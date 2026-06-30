import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../component/ProtectedRoute/ProtectedRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import ManageTeam from '../pages/ManageTeam/ManageTeam';
import TeamDetails from '../pages/ManageTeam/TeamDetails';
import TeamMembers from '../pages/ManageTeam/TeamMembers';
import ManageKpi from '../pages/ManageKpi/ManageKpi';
import ManageEventTypes from '../pages/EventTypes/ManageEventTypes';
import ManageEventActivities from '../pages/EventActivities/ManageEventActivities';
import ManageEvents from '../pages/Events/ManageEvents';
import CreateEvent from '../pages/Events/CreateEvent';
import EditEvent from '../pages/Events/EditEvent';
import ViewEvent from '../pages/Events/ViewEvent';
import ManageEventActivity from '../pages/Events/ManageEventActivity';
import ManagePlans from '../pages/Plans/ManagePlans';
import ManageFaqs from '../pages/Faqs/ManageFaqs';
import ManageSponsor from '../pages/ManageSponsor/ManageSponsor';
import ManageHomeSlider from '../pages/ManageHomeSlider/ManageHomeSlider';
import ManageBlog from '../pages/Blog/ManageBlog';
import CreateBlog from '../pages/Blog/CreateBlog';
import EditBlog from '../pages/Blog/EditBlog';
import ViewBlog from '../pages/Blog/ViewBlog';
import ManageMedia from '../pages/ManageMedia/ManageMedia';
import CreateMedia from '../pages/ManageMedia/CreateMedia';
import EditMedia from '../pages/ManageMedia/EditMedia';
import ViewMedia from '../pages/ManageMedia/ViewMedia';
import ManageContacts from '../pages/ManageContacts/ManageContacts';
import ViewContact from '../pages/ManageContacts/ViewContact';
import ManageCmsPages from '../pages/CmsPages/ManageCmsPages';
import ManageGlimpse from '../pages/GlimpseOfSports/ManageGlimpse';
import ViewCmsPage from '../pages/CmsPages/ViewCmsPage';
import ManageFitnessCategories from '../pages/FitnessCategories/ManageFitnessCategories';
import ViewFitnessCategory from '../pages/FitnessCategories/ViewFitnessCategory';
import ManageAgeGroups from '../pages/FitnessAgeGroups/ManageAgeGroups';
import ManageScoreMatrix from '../pages/FitnessScoreMatrix/ManageScoreMatrix';
import ManageAdminUsers from '../pages/AdminUsers/ManageAdminUsers';
import ManageEmployees from '../pages/Employees/ManageEmployees';
import ManageParticipants from '../pages/Participants/ManageParticipants';
import ViewParticipant from '../pages/Participants/ViewParticipant';
import Evaluation from '../pages/Participants/Evaluation';
import ManageFitnessEvaluation from '../pages/FitnessEvaluation/ManageFitnessEvaluation';
import FitnessEvaluationForm from '../pages/FitnessEvaluation/FitnessEvaluationForm';
import Notifications from '../pages/Notifications/Notifications';
import AuditHistory from '../pages/AuditHistory/AuditHistory';
import ViewFacilities from '../pages/Facilities/ViewFacilities';
import FacilityRequests from '../pages/Facilities/FacilityRequests';
import ProfilePage from '../pages/Profile/ProfilePage';
import AccountSettings from '../pages/Settings/AccountSettings';
import Login from '../auth/Login';
import ForgotPassword from '../auth/ForgotPassword';
import Register from '../auth/Register';
import Masters from '../pages/Masters/masters';

const AppRoutes = () => {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
        <Route path="/manage-team" element={<ProtectedRoute><ManageTeam /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><ManageTeam /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute><TeamDetails /></ProtectedRoute>} />
        <Route path="/teams/:id/members" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
        <Route path="/masters/manage-kpis" element={<ProtectedRoute><ManageKpi /></ProtectedRoute>} />
        <Route path="/masters/event-types" element={<ProtectedRoute><ManageEventTypes /></ProtectedRoute>} />
        <Route path="/masters/event-activities" element={<ProtectedRoute><ManageEventActivities /></ProtectedRoute>} />
        <Route path="/masters/plans" element={<ProtectedRoute><ManagePlans /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><ManageEvents /></ProtectedRoute>} />
        <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/events/edit/:id" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
        <Route path="/events/view/:id" element={<ProtectedRoute><ViewEvent /></ProtectedRoute>} />
        <Route path="/events/:eventId/activities" element={<ProtectedRoute><ManageEventActivity /></ProtectedRoute>} />
        <Route path="/masters/faqs" element={<ProtectedRoute><ManageFaqs /></ProtectedRoute>} />
        <Route path="/eval/fitness-categories" element={<ProtectedRoute><ManageFitnessCategories /></ProtectedRoute>} />
        <Route path="/eval/fitness-categories/view/:id" element={<ProtectedRoute><ViewFitnessCategory /></ProtectedRoute>} />
        <Route path="/eval/fitness-age-groups" element={<ProtectedRoute><ManageAgeGroups /></ProtectedRoute>} />
        <Route path="/eval/fitness-score-matrix" element={<ProtectedRoute><ManageScoreMatrix /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><ManagePlans /></ProtectedRoute>} />
        <Route path="/users/admin" element={<ProtectedRoute><ManageAdminUsers /></ProtectedRoute>} />
        <Route path="/users/employees" element={<ProtectedRoute><ManageEmployees /></ProtectedRoute>} />
        <Route path="/participant-requests" element={<ProtectedRoute><ManageParticipants /></ProtectedRoute>} />
        <Route path="/participant-requests/view/:id" element={<ProtectedRoute><ViewParticipant /></ProtectedRoute>} />
        <Route path="/participant-requests/evaluation/:id" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/fitness-evaluation" element={<ProtectedRoute><ManageFitnessEvaluation /></ProtectedRoute>} />
        <Route path="/fitness-evaluation/edit/:id" element={<ProtectedRoute><FitnessEvaluationForm /></ProtectedRoute>} />
        <Route path="/audit-history" element={<ProtectedRoute><AuditHistory /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/facility/view" element={<ProtectedRoute><ViewFacilities /></ProtectedRoute>} />
        <Route path="/facility/request" element={<ProtectedRoute><FacilityRequests /></ProtectedRoute>} />
        <Route path="/cms/faq" element={<ProtectedRoute><ManageFaqs /></ProtectedRoute>} />
        <Route path="/cms/sponsors" element={<ProtectedRoute><ManageSponsor /></ProtectedRoute>} />
        <Route path="/cms/home-slider" element={<ProtectedRoute><ManageHomeSlider /></ProtectedRoute>} />
        <Route path="/cms/blog" element={<ProtectedRoute><ManageBlog /></ProtectedRoute>} />
        <Route path="/cms/blog/create" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
        <Route path="/cms/blog/edit/:id" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
        <Route path="/cms/blog/view/:id" element={<ProtectedRoute><ViewBlog /></ProtectedRoute>} />
        <Route path="/cms/media" element={<ProtectedRoute><ManageMedia /></ProtectedRoute>} />
        <Route path="/cms/media/create" element={<ProtectedRoute><CreateMedia /></ProtectedRoute>} />
        <Route path="/cms/media/edit/:id" element={<ProtectedRoute><EditMedia /></ProtectedRoute>} />
        <Route path="/cms/media/view/:id" element={<ProtectedRoute><ViewMedia /></ProtectedRoute>} />
        <Route path="/cms/contact-us" element={<ProtectedRoute><ManageContacts /></ProtectedRoute>} />
        <Route path="/cms/contacts" element={<ProtectedRoute><ManageContacts /></ProtectedRoute>} />
        <Route path="/cms/contacts/view/:id" element={<ProtectedRoute><ViewContact /></ProtectedRoute>} />
        <Route path="/cms/pages" element={<ProtectedRoute><ManageCmsPages /></ProtectedRoute>} />
        <Route path="/cms/pages/view/:id" element={<ProtectedRoute><ViewCmsPage /></ProtectedRoute>} />
        <Route path="/cms/glimpse" element={<ProtectedRoute><ManageGlimpse /></ProtectedRoute>} />
        <Route path="/masters" element={<ProtectedRoute><Masters /></ProtectedRoute>} />
      </Routes>
  );
};

export default AppRoutes;