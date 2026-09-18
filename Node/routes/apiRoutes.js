const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController'); // Capital 'A'
const adminAuthController = require('../controllers/adminApi/adminAuthController');
const { ensureAuthenticated, verifyToken } = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const verifySuperAdminOnly = require('../middlewares/verifySuperAdminOnly');
const checkPermission = require('../middlewares/checkPermission');
const multer = require('multer');
const createUploader = require('../utils/multer');
const { xssSanitize } = require('../utils/sanitize');

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
const uploadUser = createUploader('uploads/user', ['image']);
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

const uploadTeam = createUploader('uploads/team', ['image']);
const uploadFaq = createUploader('uploads/faq', ['image']);
const uploadEvent = createUploader('uploads/event', ['image']);

// Lifts eventId from req.body to req.params.id so checkPermission can validate it
const resolveBodyEventId = (req, res, next) => {
  if (req.body.eventId && !req.params.id) {
    req.params.id = req.body.eventId;
  }
  next();
};

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

// Admin session verification (returns current user + permissions from server)
router.get('/admin/me', verifyToken, adminAuthController.getCurrentUser);

// Password management – strict limits
router.post('/forgot-password', passwordLimiter, authController.postForgotPassword);
router.post('/reset-password', passwordLimiter, authController.postResetPassword);
router.post('/admin/forgot-password', passwordLimiter, adminAuthController.forgotPassword);
router.post('/admin/reset-password', passwordLimiter, adminAuthController.resetPassword);

// Public form submissions – moderate limits
router.post('/contact-us', publicFormLimiter, ContactUsController.contactStore);
router.post('/facility-request', publicFormLimiter, optionalAuth, facilitiesController.createFacilityRequest);

// ═════════════════════════════════════════════════════════════════════
// 🛡️ AUTHENTICATED ADMIN ROUTES (with adminLimiter)
// ═════════════════════════════════════════════════════════════════════

// Dashboard Admin Routes
router.get('/admin/dashboard/stats', verifyToken, checkPermission('view-dashboard'), adminLimiter, dashboardAdminController.getStats);
router.get('/admin/dashboard/profile', verifyToken, checkPermission('view-dashboard'), dashboardAdminController.getProfile);
router.get('/admin/dashboard/latest-events', verifyToken, checkPermission('view-dashboard'), dashboardAdminController.getLatestEvents);
router.get('/admin/dashboard/latest-participants', verifyToken, checkPermission('view-dashboard'), dashboardAdminController.getLatestParticipants);

// KPI Admin Routes
router.get('/admin/manage-kpi', verifyToken, adminLimiter, checkPermission('view-kpis'), kpiAdminController.list);
router.post('/admin/manage-kpi', verifyToken, checkPermission('create-kpis'), kpiAdminController.store);
router.put('/admin/manage-kpi/:id', verifyToken, checkPermission('edit-kpis'), kpiAdminController.update);
router.delete('/admin/manage-kpi/:id', verifyToken, checkPermission('delete-kpis'), kpiAdminController.delete);

// Event Type Admin Routes
router.get('/admin/event-types', verifyToken, checkPermission('view-activity-type'), eventTypeAdminController.list);
router.post('/admin/event-types', verifyToken, checkPermission('create-activity-type'), eventTypeAdminController.store);
router.put('/admin/event-types/:id', verifyToken, checkPermission('edit-activity-type'), eventTypeAdminController.update);
router.delete('/admin/event-types/:id', verifyToken, checkPermission('delete-activity-type'), eventTypeAdminController.delete);

// Event Activity Admin Routes
router.get('/admin/event-activities', verifyToken, checkPermission('view-sport-activity'), eventActivityAdminController.list);
router.post('/admin/event-activities', verifyToken, checkPermission('create-sport-activity'), eventActivityAdminController.store);
router.put('/admin/event-activities/:id', verifyToken, checkPermission('edit-sport-activity'), eventActivityAdminController.update);
router.delete('/admin/event-activities/:id', verifyToken, checkPermission('delete-sport-activity'), eventActivityAdminController.delete);
router.get('/admin/event-activities/activity-types', verifyToken, checkPermission('view-sport-activity'), eventActivityAdminController.getActivityTypes);

// Event Admin Routes
router.get('/admin/events', verifyToken, checkPermission('view-event'), eventAdminController.list);
router.get('/admin/events/:id', verifyToken, checkPermission('view-event'), eventAdminController.getById);
router.post('/admin/events', uploadEvent.single('image'), xssSanitize, verifyToken, checkPermission('create-event'), eventAdminController.store);
router.put('/admin/events/:id', uploadEvent.single('image'), xssSanitize, verifyToken, checkPermission('edit-event'), eventAdminController.update);
router.delete('/admin/events/:id', verifyToken, checkPermission('delete-event'), eventAdminController.delete);
router.get('/admin/years', verifyToken, checkPermission('view-event'), eventAdminController.getYears);
router.get('/admin/sport-activities', verifyToken, checkPermission('view-event'), eventAdminController.getSportActivities);
router.get('/admin/teams-dropdown', verifyToken, checkPermission('view-event'), eventAdminController.getTeams);
router.get('/admin/event-coordinators', verifyToken, checkPermission('view-event'), eventAdminController.getEventCoordinators);

// Event Activity Management (Manage Activity & Players)
router.get('/admin/events/:id/activities', verifyToken, checkPermission('view-event'), eventAdminController.getActivities);
router.put('/admin/events/:id/activities', verifyToken, checkPermission('edit-event'), eventAdminController.updateActivities);

// Event Winners
router.post('/admin/events/get-participants', verifyToken, resolveBodyEventId, checkPermission('view-event'), eventAdminController.getParticipants);
router.post('/admin/events/mark-complete', verifyToken, resolveBodyEventId, checkPermission('edit-event'), eventAdminController.markComplete);
router.put('/admin/events/:id/event-status', verifyToken, checkPermission('edit-event'), eventAdminController.updateEventStatus);
router.post('/admin/events/mark-activity-complete', verifyToken, resolveBodyEventId, checkPermission('edit-event'), eventAdminController.markActivityComplete);
router.get('/admin/events/:id/winners', verifyToken, checkPermission('view-event'), eventAdminController.getWinners);

// Plan Admin Routes
router.get('/admin/plans', verifyToken, checkPermission('view-plans'), planAdminController.list);
router.post('/admin/plans', verifyToken, checkPermission('create-plan'), planAdminController.store);
router.put('/admin/plans/:id', verifyToken, checkPermission('edit-plan'), planAdminController.update);
router.delete('/admin/plans/:id', verifyToken, checkPermission('delete-plan'), planAdminController.delete);
router.get('/admin/plans/kpis', verifyToken, checkPermission('view-plans'), planAdminController.getKpis);

// Admin User Management Routes
router.get('/admin/manage-admins', verifyToken, checkPermission('list-view-admin'), adminUserController.list);
router.get('/admin/roles', verifyToken, checkPermission('list-view-admin'), adminUserController.getRoles);

// Employee Management Routes
router.get('/admin/employees', verifyToken, checkPermission('list-view-users'), employeeController.list);
router.get('/admin/employees/with-filters', verifyToken, checkPermission('list-view-users'), employeeController.listWithFilters);

router.get('/admin/change-status', verifyToken, checkPermission('can-change-status'), commonController.changeStatus);

// Team Admin Routes
router.get('/admin/teams', verifyToken, checkPermission('view-team'), teamAdminController.list);
router.get('/admin/teams/list-all', verifyToken, checkPermission('view-team'), teamAdminController.listAll);
router.get('/admin/teams/activities', verifyToken, checkPermission('view-team'), teamAdminController.getActivities);
router.get('/admin/teams/staff', verifyToken, checkPermission('view-team'), teamAdminController.getStaff);
router.get('/admin/teams/:id', verifyToken, checkPermission('view-team'), teamAdminController.show);
router.get('/admin/teams/:id/events', verifyToken, checkPermission('view-team'), teamAdminController.getTeamEvents);
router.get('/admin/team/members/:id', verifyToken, checkPermission('view-team'), teamAdminController.getTeamMembersData);
router.post('/admin/teams', uploadTeam.single('image'), xssSanitize, verifyToken, checkPermission('create-team'), teamAdminController.store);
router.put('/admin/teams/:id', uploadTeam.single('image'), xssSanitize, verifyToken, checkPermission('edit-team'), teamAdminController.update);
router.delete('/admin/teams/:id', verifyToken, checkPermission('delete-team'), teamAdminController.delete);
router.post('/admin/team/add-member/store', verifyToken, checkPermission('create-team'), teamAdminController.addMemberStore);

// Participant Admin Routes
router.get('/admin/participants', verifyToken, checkPermission('view-list-participants'), participantAdminController.list);
router.get('/admin/participants/approval-history', verifyToken, checkPermission('view-list-participants'), participantAdminController.getApprovalHistory);
router.get('/admin/participants/:id', verifyToken, checkPermission('view-list-participants'), participantAdminController.show);
router.put('/admin/participants/:id/status', verifyToken, checkPermission('change-status-of-participant'), participantAdminController.updateStatus);
router.post('/admin/events/:id/manual-register', verifyToken, checkPermission('view-list-participants'), participantAdminController.manualRegister);
router.post('/admin/events/:id/manual-register-team', verifyToken, checkPermission('view-list-participants'), participantAdminController.manualRegisterTeam);
router.delete('/admin/participants/team/:teamId', verifyToken, checkPermission('view-list-participants'), participantAdminController.deleteTeam);
router.delete('/admin/participants/:id', verifyToken, checkPermission('view-list-participants'), participantAdminController.delete);

// Evaluation Admin Routes
router.get('/admin/evaluation/categories', verifyToken, checkPermission('view-fitness-category-list'), evaluationAdminController.getCategories);
router.post('/admin/evaluation', verifyToken, checkPermission('add-evaluation'), evaluationAdminController.storeEvaluation);
router.post('/admin/evaluation/calculate-scores', verifyToken, checkPermission('add-evaluation'), evaluationAdminController.calculateScores);
router.get('/admin/evaluation/user/:userId', verifyToken, checkPermission('view-evaluation-list'), evaluationAdminController.getEvaluationsByUser);
router.get('/admin/evaluation/:id', verifyToken, checkPermission('view-evaluation-list'), evaluationAdminController.getEvaluationDetails);

// FAQ Admin Routes
router.get('/admin/faqs', verifyToken, checkPermission('view-faq-list'), faqAdminController.list);
router.post('/admin/faqs', verifyToken, checkPermission('create-faq'), faqAdminController.store);
router.put('/admin/faqs/:id', verifyToken, checkPermission('edit-faq'), faqAdminController.update);
router.delete('/admin/faqs/:id', verifyToken, checkPermission('delete-faq'), faqAdminController.delete);
router.put('/admin/faqs/:id/status', verifyToken, checkPermission('change-faq-status'), faqAdminController.toggleStatus);

// Facility Admin Routes
router.get('/admin/facilities', verifyToken, checkPermission('view-list-facilities'), facilityAdminController.list);
router.post('/admin/facilities', createUploader('uploads/facility', ['image']).single('image'), xssSanitize, verifyToken, checkPermission('create-facility'), facilityAdminController.store);
router.put('/admin/facilities/:id', createUploader('uploads/facility', ['image']).single('image'), xssSanitize, verifyToken, checkPermission('edit-facility'), facilityAdminController.update);
router.delete('/admin/facilities/:id', verifyToken, checkPermission('delete-facility'), facilityAdminController.delete);

// Facility Request Status Change (with email + notification)
router.get('/admin/facility-request/change-status', verifyToken, checkPermission('can-approve-or-reject-request'), commonController.changeFacilityRequestStatus);

// Sponsors API (website)
const sponsorController = require('../controllers/api/sponsorController');
router.get('/sponsors', sponsorController.getAllSponsors);

// Social Links Public API (no auth required)
const socialLinkPublicController = require('../controllers/api/socialLinkPublicController');
router.get('/social-links', socialLinkPublicController.getAll);

// Sponsor Admin API (React admin panel)
const sponsorAdminController = require('../controllers/adminApi/sponsorController');
const uploadSponsorAdmin = createUploader('uploads/sponsors', ['image']);
router.get('/admin/sponsors', verifyToken, checkPermission('view-sponsor-list'), sponsorAdminController.list);
router.post('/admin/sponsors', uploadSponsorAdmin.single('logo'), xssSanitize, verifyToken, checkPermission('create-sponsor'), sponsorAdminController.store);
router.put('/admin/sponsors/:id', uploadSponsorAdmin.single('logo'), xssSanitize, verifyToken, checkPermission('edit-sponsor'), sponsorAdminController.update);
router.delete('/admin/sponsors/:id', verifyToken, checkPermission('delete-sponsor'), sponsorAdminController.delete);

// Social Links Admin API (React admin panel) - Super Admin only
const socialLinkAdminController = require('../controllers/adminApi/socialLinkController');
const uploadSocialLinkAdmin = createUploader('uploads/socialLinks', ['image']);
router.get('/admin/social-links', verifyToken, verifySuperAdminOnly, socialLinkAdminController.list);
router.post('/admin/social-links', uploadSocialLinkAdmin.single('image'), xssSanitize, verifyToken, verifySuperAdminOnly, socialLinkAdminController.store);
router.put('/admin/social-links/:id', uploadSocialLinkAdmin.single('image'), xssSanitize, verifyToken, verifySuperAdminOnly, socialLinkAdminController.update);
router.delete('/admin/social-links/:id', verifyToken, verifySuperAdminOnly, socialLinkAdminController.delete);

// Home Slider Admin API (React admin panel)
const homeSliderAdminController = require('../controllers/adminApi/homeSliderController');
const { wrapMulter } = require('../utils/uploadMiddleware');
const uploadHomeSlider = createUploader('uploads/homeSlider', ['imageVideo']);
router.get('/admin/home-sliders', verifyToken, checkPermission('view-home-slider-list'), homeSliderAdminController.list);
router.post('/admin/home-sliders', wrapMulter(uploadHomeSlider.single('media_path')), verifyToken, checkPermission('create-home-slider'), homeSliderAdminController.store);
router.put('/admin/home-sliders/:id', wrapMulter(uploadHomeSlider.single('media_path')), verifyToken, checkPermission('edit-home-slider'), homeSliderAdminController.update);
router.delete('/admin/home-sliders/:id', verifyToken, checkPermission('delete-home-slider'), homeSliderAdminController.delete);

// Blog Admin API (React admin panel)
const blogAdminController = require('../controllers/adminApi/blogController');
const uploadBlog = createUploader('uploads/blog', ['imageVideo']);

// Media Admin API (React admin panel)
const mediaAdminController = require('../controllers/adminApi/mediaController');
const uploadMedia = createUploader('uploads/media', ['media']);
router.get('/admin/blogs', verifyToken, checkPermission('view-blog-list'), blogAdminController.list);
router.get('/admin/blogs/:id', verifyToken, checkPermission('view-blog-list'), blogAdminController.show);
router.post('/admin/blogs', uploadBlog.single('media'), xssSanitize, verifyToken, checkPermission('create-blog'), blogAdminController.store);
router.put('/admin/blogs/:id', uploadBlog.single('media'), xssSanitize, verifyToken, checkPermission('edit-blog'), blogAdminController.update);
router.delete('/admin/blogs/:id', verifyToken, checkPermission('delete-blog'), blogAdminController.delete);
router.get('/admin/tags', verifyToken, checkPermission('view-blog-list'), blogAdminController.listTags);

// Media Admin Routes
router.get('/admin/media', verifyToken, checkPermission('view-media-list'), mediaAdminController.list);
router.get('/admin/media/:id', verifyToken, checkPermission('view-media-list'), mediaAdminController.show);
router.post('/admin/media', uploadMedia.single('file'), xssSanitize, verifyToken, checkPermission('create-media'), mediaAdminController.store);
router.put('/admin/media/:id', uploadMedia.single('file'), xssSanitize, verifyToken, checkPermission('edit-media'), mediaAdminController.update);
router.delete('/admin/media/:id', verifyToken, checkPermission('delete-media'), mediaAdminController.delete);

// Contact Us Admin API (React admin panel)
const contactUsAdminController = require('../controllers/adminApi/contactUsController');
const cmsAdminController = require('../controllers/adminApi/cmsController');
const fitnessCategoryAdminController = require('../controllers/adminApi/fitnessCategoryController');

// Glimpse of Sports Admin Routes
const glimpseOfSportsAdminController = require('../controllers/adminApi/glimpseOfSportsController');
const uploadGlimpse = createUploader('uploads/glimpseOfSports', ['image']);
router.get('/admin/glimpse-of-sports', verifyToken, checkPermission('view-glimpse-list'), glimpseOfSportsAdminController.list);
router.post('/admin/glimpse-of-sports', uploadGlimpse.single('image'), xssSanitize, verifyToken, checkPermission('create-glimpse'), glimpseOfSportsAdminController.store);
router.put('/admin/glimpse-of-sports/:id', uploadGlimpse.single('image'), xssSanitize, verifyToken, checkPermission('edit-glimpse'), glimpseOfSportsAdminController.update);
router.delete('/admin/glimpse-of-sports/:id', verifyToken, checkPermission('delete-glimpse'), glimpseOfSportsAdminController.delete);
router.get('/glimpse-of-sports', glimpseOfSportsAdminController.publicList);

// Fitness Category Admin Routes
router.get('/admin/fitness-categories', verifyToken, checkPermission('view-fitness-category-list'), fitnessCategoryAdminController.list);
router.get('/admin/fitness-categories/:id', verifyToken, checkPermission('view-fitness-category-list'), fitnessCategoryAdminController.show);
router.post('/admin/fitness-categories', verifyToken, checkPermission('add-fitness-category'), fitnessCategoryAdminController.store);
router.put('/admin/fitness-categories/:id', verifyToken, checkPermission('edit-fitness-category'), fitnessCategoryAdminController.update);
router.delete('/admin/fitness-categories/:id', verifyToken, checkPermission('delete-fitness-category'), fitnessCategoryAdminController.delete);
router.put('/admin/fitness-categories/:id/status', verifyToken, checkPermission('change-fitness-category-status'), fitnessCategoryAdminController.toggleStatus);

// Fitness Age Groups Admin Routes
router.get('/admin/fitness-age-groups', verifyToken, checkPermission('view-fitness-category-list'), fitnessCategoryAdminController.listAgeGroups);
router.get('/admin/fitness-age-groups/:id', verifyToken, checkPermission('view-fitness-category-list'), fitnessCategoryAdminController.showAgeGroup);
router.post('/admin/fitness-age-groups', verifyToken, checkPermission('add-fitness-category'), fitnessCategoryAdminController.storeAgeGroup);
router.put('/admin/fitness-age-groups/:id', verifyToken, checkPermission('edit-fitness-category'), fitnessCategoryAdminController.updateAgeGroup);
router.delete('/admin/fitness-age-groups/:id', verifyToken, checkPermission('delete-fitness-category'), fitnessCategoryAdminController.deleteAgeGroup);

// Fitness Score Matrix
router.get('/admin/fitness-score-matrix', verifyToken, checkPermission('view-fitness-category-list'), fitnessCategoryAdminController.listScoreMatrix);
router.post('/admin/fitness-score-matrix', verifyToken, checkPermission('add-fitness-category'), fitnessCategoryAdminController.storeScoreMatrix);
router.put('/admin/fitness-score-matrix/:id', verifyToken, checkPermission('edit-fitness-category'), fitnessCategoryAdminController.updateScoreMatrix);
router.delete('/admin/fitness-score-matrix/:id', verifyToken, checkPermission('delete-fitness-category'), fitnessCategoryAdminController.deleteScoreMatrix);
router.post('/admin/fitness-score-matrix/bulk-import', verifyToken, checkPermission('add-fitness-category'), fitnessCategoryAdminController.bulkImportScoreMatrix);

// Fitness Test (Evaluate Participant)
router.post('/admin/fitness-test', verifyToken, checkPermission('add-fitness-category'), fitnessCategoryAdminController.storeFitnessTest);

// Fitness Evaluation (Excel Upload) Routes
router.get('/admin/fitness-evaluations', verifyToken, checkPermission('view-evaluation-list'), fitnessEvaluationAdminController.list);
router.get('/admin/fitness-evaluations/:id', verifyToken, checkPermission('view-evaluation-list'), fitnessEvaluationAdminController.show);
router.post('/admin/fitness-evaluations', verifyToken, checkPermission('add-evaluation'), fitnessEvaluationAdminController.store);
router.put('/admin/fitness-evaluations/:id', verifyToken, checkPermission('edit-evaluation'), fitnessEvaluationAdminController.update);
router.delete('/admin/fitness-evaluations/:id', verifyToken, checkPermission('delete-evaluation'), fitnessEvaluationAdminController.delete);
router.get('/admin/fitness-evaluations-years', verifyToken, checkPermission('view-evaluation-list'), fitnessEvaluationAdminController.getYears);
router.get('/admin/fitness-evaluations/:id/user-lookup', verifyToken, checkPermission('view-evaluation-list'), fitnessEvaluationAdminController.lookupUserByGrp);
router.put('/admin/evaluation-results/:id', verifyToken, checkPermission('edit-evaluation'), fitnessEvaluationAdminController.updateResult);
router.delete('/admin/evaluation-results/:id', verifyToken, checkPermission('delete-evaluation'), fitnessEvaluationAdminController.deleteResult);
router.post('/admin/fitness-evaluations/:id/delete-session', verifyToken, checkPermission('delete-evaluation'), fitnessEvaluationAdminController.deleteSession);

// CMS Admin Routes
router.get('/admin/cms-pages', verifyToken, checkPermission('view-cms-page-list'), cmsAdminController.list);
router.get('/admin/cms-pages/:id', verifyToken, checkPermission('view-cms-page-list'), cmsAdminController.show);
router.post('/admin/cms-pages', verifyToken, checkPermission('create-cms-page'), cmsAdminController.store);
router.put('/admin/cms-pages/:id', verifyToken, checkPermission('edit-cms-page'), cmsAdminController.update);
router.delete('/admin/cms-pages/:id', verifyToken, checkPermission('delete-cms-page'), cmsAdminController.delete);
router.put('/admin/cms-pages/:id/status', verifyToken, checkPermission('change-cms-page-status'), cmsAdminController.toggleStatus);

router.get('/admin/contacts', verifyToken, checkPermission('view-contact-list'), contactUsAdminController.list);
router.get('/admin/contacts/:id', verifyToken, checkPermission('view-contact-list'), contactUsAdminController.show);
router.delete('/admin/contacts/:id', verifyToken, checkPermission('delete-contact'), contactUsAdminController.delete);
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
router.post('/update-profile', uploadUser.single('image'), xssSanitize, verifyToken, authController.updateProfile);
router.post('/upload-profile-image', verifyToken, uploadUser.single('image'), xssSanitize, authController.uploadProfileImage);
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
