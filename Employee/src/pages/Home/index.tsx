import BannerWrapper from "../../components/Banner/BannerWrapper";
import AccordionSec from "../../components/section/AccordionSec";
import AllEventSec from "../../components/section/AllEventSec";
import BodyFitnessEvaluation from "../../components/section/BodyFitnessEvaluation";
import EvaluationCertificatesSec from "../../components/section/EvaluationCertificatesSec";
import GlimpseSportsActivitieSec from '../../components/section/GlimpseSportsActivitieSec'
import HorizontalLine from "../../components/section/HorizontalLine";
import MediaKnowledgeSec from "../../components/section/MediaKnowledgeSec";

const HomePage = () => {
  return (
    <div>
      <BannerWrapper />
      <AllEventSec />

      <BodyFitnessEvaluation />
      <HorizontalLine />
      <EvaluationCertificatesSec />
      <AccordionSec />
      <HorizontalLine style={{ transform: 'rotate(180deg)' }} />
      <MediaKnowledgeSec />
      <HorizontalLine />
      <GlimpseSportsActivitieSec />
    </div>
  );
};

export default HomePage;
