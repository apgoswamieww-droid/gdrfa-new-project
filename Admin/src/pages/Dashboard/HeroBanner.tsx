import { HeroBannerImg } from "../../assets/images/images";
import { Heading,Text } from "../../component/Typography/Typography";
import { useTranslation } from "../../hooks/useTranslation";

const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden 2xl:rounded-2xl rounded-xl sm:h-full h-52">
      <img
        src={HeroBannerImg}
        alt="hero-banner"
        className="absolute inset-0 w-full h-full object-cover rtl:-scale-x-100 md:object-[15%_100%] object-[28%_100%]"
      />
      <div
        className="absolute inset-e-0 bottom-0 top-0 flex flex-col justify-between text-end max-w-lg xl:p-10 md:p-4 p-4 bg-[linear-gradient(270deg,#FFFFFF_0%,rgba(255,255,255,0.729193)_49.47%,rgba(255,255,255,0)_100%)]
        rtl:bg-[linear-gradient(90deg,#FFFFFF_0%,rgba(255,255,255,0.729193)_49.47%,rgba(255,255,255,0)_100%)]
"
      >
        <Heading variant="h3" className="font-bold text-secondary whitespace-pre-line">
          {t.dashboard.heroTitle}
        </Heading>
        <Text variant="textBase" className="font-medium text-primary-light mt-2 whitespace-pre-line">
          {t.dashboard.heroSubtitle}
        </Text>
      </div>
    </div>
  );
};
export default HeroBanner;
