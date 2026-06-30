import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/Home";
import HeaderFooterWrapper from "../utils/HeaderFooterWrapper";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import Login from "../pages/Auth/Login";
import Profile from "../pages/Auth/Profile";
import SportsEventDetail from "../pages/SportsEvents/SportsEventDetail";
import SportsEventList from "../pages/SportsEvents/SportsEventList";
import Achievements from "../pages/Home/Achievements";
import Sponsors from "../pages/Home/Sponsors";
import FacilitiesList from "../pages/Home/FacilitiesList";
import FacilityDetail from "../pages/Home/FacilityDetail";
import ScrollToTop from "../utils/ScrollToTop";
import MediaKnowledgeList from "../pages/MediaKnowledge/MediaKnowledgeList";
import MediaKnowledgeDetail from "../pages/MediaKnowledge/MediaKnowledgeDetail";
import ContactUs from "../pages/ContactUs";
import Faq from "../pages/Faq";
import CmsPageWrapper from "../pages/CmsPage";
import Certificates from "../pages/Certificates";

const AppRouting = () => {
  return (
    <>
      <ScrollToTop />
      <HeaderFooterWrapper>
        <Routes>
          <Route path="/" Component={HomePage} />
          <Route path="/login" Component={Login} />
          <Route path="/forgot-password" Component={ForgotPassword} />
          <Route path="/profile" Component={Profile} />
          <Route path="/certificates" Component={Certificates} />
          <Route path="/sport-activity-list" Component={SportsEventList} />
          <Route path="/sport-activity-list/:eventId" Component={SportsEventDetail} />
          <Route path="/achievement" Component={Achievements} />
          <Route path="/sponsors" Component={Sponsors} />
          <Route path="/facilities" Component={FacilitiesList} />
          <Route path="/facilities/:facilityId" Component={FacilityDetail} />
          <Route path="/media-knowledge" Component={MediaKnowledgeList} />
          <Route path="/media-knowledge/:id" Component={MediaKnowledgeDetail} />
          <Route path="/contact-us" Component={ContactUs} />
          <Route path="/faq" Component={Faq} />
          <Route path="/system-user-guide" element={<CmsPageWrapper slug="system-user-guide" />} />
          <Route path="/privacy-policy" element={<CmsPageWrapper slug="privacy-policy" />} />
          <Route path="/terms-condition" element={<CmsPageWrapper slug="terms-conditions" />} />
          <Route path="/end-user-licence-agreement" element={<CmsPageWrapper slug="end-user-licence-agreement" />} />
        </Routes>
      </HeaderFooterWrapper>
    </>
  );
};

export default AppRouting;
