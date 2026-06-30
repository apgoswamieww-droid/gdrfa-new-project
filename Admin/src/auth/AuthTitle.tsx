import { LogoBlack } from "../assets/images/images";
import { Heading, Text } from "../component/Typography/Typography";

const GDRFALogo = () => (
  <div className="flex items-center gap-2">
    <img
      src={LogoBlack}
      alt="logo"
      className="lg:h-10 h-8 w-fit object-contain me-auto text-start"
    />
  </div>
);

const AuthTitle = () => {
  return (
    <>
      <header className="px-6 lg:py-4 pb-4 xl:absolute 2xl:top-5 top-3 2xl:inset-s-3 inset-s-0">
        <GDRFALogo />
      </header>
      {/* Title */}
      <div className="text-center 2xl:mb-6 mb-4">
        <Heading
          variant="h2"
          className="text-base/tight sm:text-lg/tight xl:text-xl/tight 2xl:text-2xl/tight font-bold mb-1"
        >
          <span className="text-black">Welcome to </span>{" "}
          <span className="text-primary">GDRFA Sports Portal</span>
        </Heading>
        <Text variant="textBase" className=" text-secondary/50 font-bold">
          Your Gateway to Health &amp; Excellence
        </Text>
      </div>
    </>
  );
};
export default AuthTitle;
