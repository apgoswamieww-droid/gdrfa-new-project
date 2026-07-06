const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController'); // Capital 'A'
const adminAuthController = require('../controllers/adminApi/adminAuthController');
const { ensureAuthenticated, verifyToken } = require('../middlewares/authMiddleware');
const verifyAdminOrSuperAdmin = require('../middlewares/verifyAdminOrSuperAdmin');
const { authorizeResource } = require('../middlewares/resourceAuthorization');
const multer = require('multer');
const createUploader = require('../utils/multer');

// ─── Rate Limiters ──────────────────────────────────────────────────
const {
  authLimiter,
  otpLimiter,
  passwordLimiter,
  publicFormLimiter,
  adminLimiter,
} = require('../middlewares/rateLimiter');

const ContactUsController = require('../controllers/api/contactUsController');
const sportEventController = require('../controllers/api/sportEventController');
const uploadUser = createUploader('uploads/user');
const pageController = require('../controllers/api/pageController');
const facilitiesController = require('../controllers/api/facilitiesController');
const notificationController = require('../controllers/api/notificationController');
const testNotificationController = require('../controllers/api/testNotificationController');
const kpiAdminController = require('../controllers/adminApi/kpiController');
const eventTypeAdminController = require('../controllers/adminApi/eventTypeController');
const eventActivityAdminController = require('../controllers/adminApi/eventActivityController');
const eventAdminController = require('../controllers/adminApi/eventAdminController');
const planAdminController = require('../controllers/adminApi/planController');
const adminUserController = require('../controllers/adminApi/adminUserController');
const employeeController = require('../controllers/adminApi/employeeController');
const teamAdminController = require('../controllers/adminApi/teamController');
const participantAdminController = require('../controllers/adminApi/participantController');
const facilityAdminController = require('../controllers/adminApi/facilityController');
const faqAdminController = require('../controllers/adminApi/faqController');
const commonController = require('../controllers/commonController');
const dashboardAdminController = require('../controllers/adminApi/dashboardAdminController');
const evaluationAdminController = require('../controllers/adminApi/evaluationController');
const fitnessEvaluationAdminController = require('../controllers/adminApi/fitnessEvaluationController');

const uploadTeam = createUploader('uploads/team');
const uploadFaq = createUploader('uploads/faq');
const uploadEvent = createUploader('uploads/event');

router.get('/health', (req, res) => {
  res.json({
    status: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'Connected',
    multilingual: 'Enabled (Arabic/English)'
  });
});

// ═════════════════════════════════════════════════════════════════════
// 🔐 SENSITIVE / PUBLIC ROUTES (with strict rate limiting)
// ═════════════════════════════════════════════════════════════════════

// Auth – strict limits
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/admin/login', authLimiter, adminAuthController.login);

// Token refresh (moderate limit – these are authenticated users)
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/admin/refresh-token', adminAuthController.refreshToken);

// Admin logout
router.post('/admin/logout', adminAuthController.logout);

// Password management – strict limits
router.post('/forgot-password', passwordLimiter, authController.postForgotPassword);
router.post('/reset-password', passwordLimiter, authController.postResetPassword);
router.post('/admin/forgot-password', passwordLimiter, adminAuthController.forgotPassword);
router.post('/admin/reset-password', passwordLimiter, adminAuthController.resetPassword);

// Public form submissions – moderate limits
router.post('/contact-us', publicFormLimiter, ContactUsController.contactStore);
router.post('/facility-request', publicFormLimiter, facilitiesController.createFacilityRequest);

// ═════════════════════════════════════════════════════════════════════
// 🛡️ AUTHENTICATED ADMIN ROUTES (with adminLimiter)
// ═════════════════════════════════════════════════════════════════════

// Dashboard Admin Routes
router.get('/admin/dashboard/stats', verifyToken, adminLimiter, dashboardAdminController.getStats);
router.get('/admin/dashboard/profile', verifyToken, dashboardAdminController.getProfile);
router.get('/admin/dashboard/latest-events', verifyToken, dashboardAdminController.getLatestEvents);
router.get('/admin/dashboard/latest-participants', verifyToken, dashboardAdminController.getLatestParticipants);

// KPI Admin Routes
router.get('/admin/manage-kpi', verifyToken, adminLimiter, authorizeResource('kpi', { operation: 'read' }), kpiAdminController.list);
router.post('/admin/manage-kpi', verifyToken, authorizeResource('kpi', { operation: 'create' }), kpiAdminController.store);
router.put('/admin/manage-kpi/:id', verifyToken, authorizeResource('kpi'), kpiAdminController.update);
router.delete('/admin/manage-kpi/:id', verifyToken, authorizeResource('kpi'), kpiAdminController.delete);

// Event Type Admin Routes
router.get('/admin/event-types', verifyToken, authorizeResource('eventType', { operation: 'read' }), eventTypeAdminController.list);
router.post('/admin/event-types', verifyToken, authorizeResource('eventType', { operation: 'create' }), eventTypeAdminController.store);
router.put('/admin/event-types/:id', verifyToken, authorizeResource('eventType'), eventTypeAdminController.update);
router.delete('/admin/event-types/:id', verifyToken, authorizeResource('eventType'), eventTypeAdminController.delete);

// Event Activity Admin Routes
router.get('/admin/event-activities', verifyToken, authorizeResource('sportActivity', { operation: 'read' }), eventActivityAdminController.list);
router.post('/admin/event-activities', verifyToken, authorizeResource('sportActivity', { operation: 'create' }), eventActivityAdminController.store);
router.put('/admin/event-activities/:id', verifyToken, authorizeResource('sportActivity'), eventActivityAdminController.update);
router.delete('/admin/event-activities/:id', verifyToken, authorizeResource('sportActivity'), eventActivityAdminController.delete);
router.get('/admin/event-activities/activity-types', verifyToken, authorizeResource('sportActivity', { operation: 'read' }), eventActivityAdminController.getActivityTypes);

// Event Admin Routes
router.get('/admin/events', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.list);
router.get('/admin/events/:id', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getById);
router.post('/admin/events', uploadEvent.single('image'), verifyToken, authorizeResource('event', { operation: 'create' }), eventAdminController.store);
router.put('/admin/events/:id', uploadEvent.single('image'), verifyToken, authorizeResource('event'), eventAdminController.update);
router.delete('/admin/events/:id', verifyToken, authorizeResource('event'), eventAdminController.delete);
router.get('/admin/years', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getYears);
router.get('/admin/sport-activities', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getSportActivities);
router.get('/admin/teams-dropdown', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getTeams);
router.get('/admin/event-coordinators', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getEventCoordinators);

// Event Activity Management (Manage Activity & Players)
router.get('/admin/events/:id/activities', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getActivities);
router.put('/admin/events/:id/activities', verifyToken, authorizeResource('event'), eventAdminController.updateActivities);

// Event Winners
router.post('/admin/events/get-participants', verifyToken, eventAdminController.getParticipants);
router.post('/admin/events/mark-complete', verifyToken, eventAdminController.markComplete);
router.put('/admin/events/:id/event-status', verifyToken, authorizeResource('event'), eventAdminController.updateEventStatus);
router.post('/admin/events/mark-activity-complete', verifyToken, eventAdminController.markActivityComplete);
router.get('/admin/events/:id/winners', verifyToken, authorizeResource('event', { operation: 'read' }), eventAdminController.getWinners);

// Plan Admin Routes
router.get('/admin/plans', verifyToken, authorizeResource('plan', { operation: 'read' }), planAdminController.list);
router.post('/admin/plans', verifyToken, authorizeResource('plan', { operation: 'create' }), planAdminController.store);
router.put('/admin/plans/:id', verifyToken, authorizeResource('plan'), planAdminController.update);
router.delete('/admin/plans/:id', verifyToken, authorizeResource('plan'), planAdminController.delete);
router.get('/admin/plans/kpis', verifyToken, authorizeResource('plan', { operation: 'read' }), planAdminController.getKpis);

// Admin User Management Routes
router.get('/admin/manage-admins', verifyToken, adminUserController.list);
router.get('/admin/roles', verifyToken, adminUserController.getRoles);

// Employee Management Routes
router.get('/admin/employees', verifyToken, employeeController.list);
router.get('/admin/employees/with-filters', verifyToken, employeeController.listWithFilters);

router.get('/admin/change-status', verifyToken, commonController.changeStatus);

// Team Admin Routes
router.get('/admin/teams', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.list);
router.get('/admin/teams/list-all', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.listAll);
router.get('/admin/teams/activities', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.getActivities);
router.get('/admin/teams/staff', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.getStaff);
router.get('/admin/teams/:id', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.show);
router.get('/admin/teams/:id/events', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.getTeamEvents);
router.get('/admin/team/members/:id', verifyToken, authorizeResource('team', { operation: 'read' }), teamAdminController.getTeamMembersData);
router.post('/admin/teams', uploadTeam.single('image'), verifyToken, authorizeResource('team', { operation: 'create' }), teamAdminController.store);
router.put('/admin/teams/:id', uploadTeam.single('image'), verifyToken, authorizeResource('team'), teamAdminController.update);
router.delete('/admin/teams/:id', verifyToken, authorizeResource('team'), teamAdminController.delete);
router.post('/admin/team/add-member/store', verifyToken, authorizeResource('team', { operation: 'create' }), teamAdminController.addMemberStore);

// Participant Admin Routes
router.get('/admin/participants', verifyToken, authorizeResource('participant', { operation: 'read' }), participantAdminController.list);
router.get('/admin/participants/approval-history', verifyToken, verifyAdminOrSuperAdmin, participantAdminController.getApprovalHistory);
router.get('/admin/participants/:id', verifyToken, authorizeResource('participant', { operation: 'read' }), participantAdminController.show);
router.put('/admin/participants/:id/status', verifyToken, authorizeResource('participant'), participantAdminController.updateStatus);
router.post('/admin/events/:id/manual-register', verifyToken, authorizeResource('participant', { operation: 'create' }), participantAdminController.manualRegister);
router.post('/admin/events/:id/manual-register-team', verifyToken, authorizeResource('participant', { operation: 'create' }), participantAdminController.manualRegisterTeam);
router.delete('/admin/participants/team/:teamId', verifyToken, authorizeResource('participantTeam'), participantAdminController.deleteTeam);
router.delete('/admin/participants/:id', verifyToken, authorizeResource('participant'), participantAdminController.delete);

// Evaluation Admin Routes
router.get('/admin/evaluation/categories', verifyToken, verifyAdminOrSuperAdmin, evaluationAdminController.getCategories);
router.post('/admin/evaluation', verifyToken, verifyAdminOrSuperAdmin, evaluationAdminController.storeEvaluation);
router.post('/admin/evaluation/calculate-scores', verifyToken, verifyAdminOrSuperAdmin, evaluationAdminController.calculateScores);
router.get('/admin/evaluation/user/:userId', verifyToken, verifyAdminOrSuperAdmin, evaluationAdminController.getEvaluationsByUser);
router.get('/admin/evaluation/:id', verifyToken, verifyAdminOrSuperAdmin, evaluationAdminController.getEvaluationDetails);

// FAQ Admin Routes
router.get('/admin/faqs', verifyToken, authorizeResource('faq', { operation: 'read' }), faqAdminController.list);
router.post('/admin/faqs', verifyToken, authorizeResource('faq', { operation: 'create' }), faqAdminController.store);
router.put('/admin/faqs/:id', verifyToken, authorizeResource('faq'), faqAdminController.update);
router.delete('/admin/faqs/:id', verifyToken, authorizeResource('faq'), faqAdminController.delete);
router.put('/admin/faqs/:id/status', verifyToken, authorizeResource('faq'), faqAdminController.toggleStatus);

// Facility Admin Routes
router.get('/admin/facilities', verifyToken, authorizeResource('facility', { operation: 'read' }), facilityAdminController.list);
router.post('/admin/facilities', createUploader('uploads/facility').single('image'), verifyToken, authorizeResource('facility', { operation: 'create' }), facilityAdminController.store);
router.put('/admin/facilities/:id', createUploader('uploads/facility').single('image'), verifyToken, authorizeResource('facility'), facilityAdminController.update);
router.delete('/admin/facilities/:id', verifyToken, authorizeResource('facility'), facilityAdminController.delete);

// Facility Request Status Change (with email + notification)
router.get('/admin/facility-request/change-status', verifyToken, commonController.changeFacilityRequestStatus);

// Sponsors API (website)
const sponsorController = require('../controllers/api/sponsorController');
router.get('/sponsors', sponsorController.getAllSponsors);

// Sponsor Admin API (React admin panel)
const sponsorAdminController = require('../controllers/adminApi/sponsorController');
const uploadSponsorAdmin = createUploader('uploads/sponsors');
router.get('/admin/sponsors', verifyToken, authorizeResource('sponsor', { operation: 'read' }), sponsorAdminController.list);
router.post('/admin/sponsors', uploadSponsorAdmin.single('logo'), verifyToken, authorizeResource('sponsor', { operation: 'create' }), sponsorAdminController.store);
router.put('/admin/sponsors/:id', uploadSponsorAdmin.single('logo'), verifyToken, authorizeResource('sponsor'), sponsorAdminController.update);
router.delete('/admin/sponsors/:id', verifyToken, authorizeResource('sponsor'), sponsorAdminController.delete);

// Home Slider Admin API (React admin panel)
const homeSliderAdminController = require('../controllers/adminApi/homeSliderController');
const { wrapMulter } = require('../utils/uploadMiddleware');
const uploadHomeSlider = createUploader('uploads/homeSlider');
router.get('/admin/home-sliders', verifyToken, authorizeResource('homeSlider', { operation: 'read' }), homeSliderAdminController.list);
router.post('/admin/home-sliders', wrapMulter(uploadHomeSlider.single('media_path')), verifyToken, authorizeResource('homeSlider', { operation: 'create' }), homeSliderAdminController.store);
router.put('/admin/home-sliders/:id', wrapMulter(uploadHomeSlider.single('media_path')), verifyToken, authorizeResource('homeSlider'), homeSliderAdminController.update);
router.delete('/admin/home-sliders/:id', verifyToken, authorizeResource('homeSlider'), homeSliderAdminController.delete);

// Blog Admin API (React admin panel)
const blogAdminController = require('../controllers/adminApi/blogController');
const uploadBlog = createUploader('uploads/blog');

// Media Admin API (React admin panel)
const mediaAdminController = require('../controllers/adminApi/mediaController');
const uploadMedia = createUploader('uploads/media');
router.get('/admin/blogs', verifyToken, authorizeResource('blog', { operation: 'read' }), blogAdminController.list);
router.get('/admin/blogs/:id', verifyToken, authorizeResource('blog', { operation: 'read' }), blogAdminController.show);
router.post('/admin/blogs', uploadBlog.single('media'), verifyToken, authorizeResource('blog', { operation: 'create' }), blogAdminController.store);
router.put('/admin/blogs/:id', uploadBlog.single('media'), verifyToken, authorizeResource('blog'), blogAdminController.update);
router.delete('/admin/blogs/:id', verifyToken, authorizeResource('blog'), blogAdminController.delete);
router.get('/admin/tags', verifyToken, authorizeResource('blog', { operation: 'read' }), blogAdminController.listTags);

// Media Admin Routes
router.get('/admin/media', verifyToken, authorizeResource('media', { operation: 'read' }), mediaAdminController.list);
router.get('/admin/media/:id', verifyToken, authorizeResource('media', { operation: 'read' }), mediaAdminController.show);
router.post('/admin/media', uploadMedia.single('file'), verifyToken, authorizeResource('media', { operation: 'create' }), mediaAdminController.store);
router.put('/admin/media/:id', uploadMedia.single('file'), verifyToken, authorizeResource('media'), mediaAdminController.update);
router.delete('/admin/media/:id', verifyToken, authorizeResource('media'), mediaAdminController.delete);

// Contact Us Admin API (React admin panel)
const contactUsAdminController = require('../controllers/adminApi/contactUsController');
const cmsAdminController = require('../controllers/adminApi/cmsController');
const fitnessCategoryAdminController = require('../controllers/adminApi/fitnessCategoryController');

// Glimpse of Sports Admin Routes
const glimpseOfSportsAdminController = require('../controllers/adminApi/glimpseOfSportsController');
const uploadGlimpse = createUploader('uploads/glimpseOfSports');
router.get('/admin/glimpse-of-sports', verifyToken, authorizeResource('glimpseOfSports', { operation: 'read' }), glimpseOfSportsAdminController.list);
router.post('/admin/glimpse-of-sports', uploadGlimpse.single('image'), verifyToken, authorizeResource('glimpseOfSports', { operation: 'create' }), glimpseOfSportsAdminController.store);
router.put('/admin/glimpse-of-sports/:id', uploadGlimpse.single('image'), verifyToken, authorizeResource('glimpseOfSports'), glimpseOfSportsAdminController.update);
router.delete('/admin/glimpse-of-sports/:id', verifyToken, authorizeResource('glimpseOfSports'), glimpseOfSportsAdminController.delete);
router.get('/glimpse-of-sports', glimpseOfSportsAdminController.publicList);

// Fitness Category Admin Routes
router.get('/admin/fitness-categories', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.list);
router.get('/admin/fitness-categories/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.show);
router.post('/admin/fitness-categories', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.store);
router.put('/admin/fitness-categories/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.update);
router.delete('/admin/fitness-categories/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.delete);
router.put('/admin/fitness-categories/:id/status', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.toggleStatus);

// Fitness Age Groups Admin Routes
router.get('/admin/fitness-age-groups', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.listAgeGroups);
router.get('/admin/fitness-age-groups/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.showAgeGroup);
router.post('/admin/fitness-age-groups', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.storeAgeGroup);
router.put('/admin/fitness-age-groups/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.updateAgeGroup);
router.delete('/admin/fitness-age-groups/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.deleteAgeGroup);

// Fitness Score Matrix
router.get('/admin/fitness-score-matrix', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.listScoreMatrix);
router.post('/admin/fitness-score-matrix', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.storeScoreMatrix);
router.put('/admin/fitness-score-matrix/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.updateScoreMatrix);
router.delete('/admin/fitness-score-matrix/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.deleteScoreMatrix);
router.post('/admin/fitness-score-matrix/bulk-import', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.bulkImportScoreMatrix);

// Fitness Test (Evaluate Participant)
router.post('/admin/fitness-test', verifyToken, verifyAdminOrSuperAdmin, fitnessCategoryAdminController.storeFitnessTest);

// Fitness Evaluation (Excel Upload) Routes
router.get('/admin/fitness-evaluations', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.list);
router.get('/admin/fitness-evaluations/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.show);
router.post('/admin/fitness-evaluations', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.store);
router.put('/admin/fitness-evaluations/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.update);
router.delete('/admin/fitness-evaluations/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.delete);
router.get('/admin/fitness-evaluations-years', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.getYears);
router.get('/admin/fitness-evaluations/:id/user-lookup', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.lookupUserByGrp);
router.put('/admin/evaluation-results/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.updateResult);
router.delete('/admin/evaluation-results/:id', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.deleteResult);
router.post('/admin/fitness-evaluations/:id/delete-session', verifyToken, verifyAdminOrSuperAdmin, fitnessEvaluationAdminController.deleteSession);

// CMS Admin Routes
router.get('/admin/cms-pages', verifyToken, authorizeResource('cmsPage', { operation: 'read' }), cmsAdminController.list);
router.get('/admin/cms-pages/:id', verifyToken, authorizeResource('cmsPage', { operation: 'read' }), cmsAdminController.show);
router.post('/admin/cms-pages', verifyToken, authorizeResource('cmsPage', { operation: 'create' }), cmsAdminController.store);
router.put('/admin/cms-pages/:id', verifyToken, authorizeResource('cmsPage'), cmsAdminController.update);
router.delete('/admin/cms-pages/:id', verifyToken, authorizeResource('cmsPage'), cmsAdminController.delete);
router.put('/admin/cms-pages/:id/status', verifyToken, authorizeResource('cmsPage'), cmsAdminController.toggleStatus);

router.get('/admin/contacts', verifyToken, authorizeResource('contactUs', { operation: 'read' }), contactUsAdminController.list);
router.get('/admin/contacts/:id', verifyToken, authorizeResource('contactUs', { operation: 'read' }), contactUsAdminController.show);
router.delete('/admin/contacts/:id', verifyToken, authorizeResource('contactUs'), contactUsAdminController.delete);
router.get('/faq', pageController.getFaq);
router.get('/home-slider', pageController.getSlider);
router.get('/home-event', pageController.getHomeEvent);
router.get('/event/:id', pageController.getEventById);
router.get('/cms/:slug', pageController.getPageBySlug);
router.get('/cms', pageController.getAllPages);
router.get('/team-details/:id', pageController.getTeamDetails);
router.get('/facilities', facilitiesController.getAllFacilities);
router.get('/facility-requests/:facilityId', facilitiesController.getBookedTimes);
router.get('/my-facility-requests', verifyToken, facilitiesController.getMyFacilityRequests);
router.get('/facility-requests', verifyToken, facilityAdminController.listRequests);
router.get('/blog-list', pageController.getAllBlogs);
router.get('/blog/:id', pageController.getBlogById);
router.get('/media-list', pageController.getAllMedia);
router.get('/media/:id', pageController.getMediaById);

// router.post('/imageUpload', upload.single('image'), authController.imageUpload);
router.get('/profile', verifyToken, authController.getProfile);
router.post('/update-profile', uploadUser.single('image'), verifyToken, authController.updateProfile);
router.post('/upload-profile-image', verifyToken, uploadUser.single('image'), authController.uploadProfileImage);
router.get('/profile-image', verifyToken, authController.getProfileImage);
router.post('/change-password', verifyToken, authController.changePassword);
router.get('/logout', verifyToken, authController.logout);
router.get('/user/events', verifyToken, sportEventController.getMyEvents);
router.get('/user/participant-approval-history/:participantId', verifyToken, sportEventController.getMyApprovalHistory);
router.get('/evaluation', verifyToken, pageController.getMyEvaluations);
router.get('/fitness-category', verifyToken, pageController.getFitnessCategory);
router.get('/fitness-categories', verifyToken, pageController.getFitnessCategories);

router.get('/get-sectors', verifyToken, authController.getSectors);
router.get('/departments', verifyToken, authController.getDepartments);
router.get('/sections', verifyToken, authController.getSectionsByDepartment);
router.get('/branches', verifyToken, authController.getBranchesBySection);
// router.get('/manager',verifyToken, authController.getManagers); // Method not implemented
router.get('/ranks', verifyToken, authController.getRanks);
router.get('/job-titles', verifyToken, authController.getJobTitles);


router.post('/participant', verifyToken, pageController.postEventParticipant);
router.get('/certificates', verifyToken, pageController.getCertificates);
router.get('/certificates/:id/download', verifyToken, pageController.downloadCertificate);
router.get('/sport-events', sportEventController.getSportEvents);
router.get('/notifications', verifyToken, notificationController.getAllNotification);
router.get('/clear-notification/:id', verifyToken, notificationController.clearNotificationById);
router.put('/clear-all-notification', verifyToken, notificationController.clearAllNotifications);
router.put('/mark-as-read/:id', verifyToken, notificationController.markAsRead);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

// FCM Token Management Routes
router.post('/update-fcm-token', verifyToken, notificationController.updateFCMToken);
router.delete('/remove-fcm-token', verifyToken, notificationController.removeFCMToken);
router.post('/test-push-notification', verifyToken, notificationController.testPushNotification);

// Test Notification Routes (using PushNotificationUtil)
router.post('/test/notification/single-user', verifyToken, testNotificationController.testSingleUser);
router.post('/test/notification/multiple-users', verifyToken, testNotificationController.testMultipleUsers);
router.post('/test/notification/by-role', verifyToken, testNotificationController.testByRole);
router.post('/test/notification/broadcast', verifyToken, testNotificationController.testBroadcast);
router.post('/test/notification/event', verifyToken, testNotificationController.testEventNotification);
router.post('/test/notification/team', verifyToken, testNotificationController.testTeamNotification);
router.get('/test/notification/users-with-tokens', verifyToken, testNotificationController.getUsersWithTokens);
router.post('/test/notification/current-user', verifyToken, testNotificationController.testCurrentUser);

module.exports = router;
