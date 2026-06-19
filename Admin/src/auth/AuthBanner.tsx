import { HeroBannerImg } from "../assets/images/images";
import { Heading,Text } from "../component/Typography/Typography";

const AuthBanner = () =>{
    return(
        <>
        <div className="relative overflow-hidden h-52">
            <img
              src={HeroBannerImg}
              alt="hero-banner"
              className="absolute inset-0 w-full h-full object-cover md:object-[15%_100%] object-[28%_100%] rtl:-scale-x-100"
            />

            <div className="absolute inset-e-0 bottom-0 top-0 flex flex-col justify-between text-end md:max-w-70 max-w-60 md:p-4 p-4 bg-[linear-gradient(270deg,#FFFFFF_0%,rgba(255,255,255,0.729193)_49.47%,rgba(255,255,255,0)_100%)]
            rtl:bg-[linear-gradient(90deg,#FFFFFF_0%,rgba(255,255,255,0.729193)_49.47%,rgba(255,255,255,0)_100%)]">
              <Heading variant="h3" className="font-bold text-secondary">
                Unlock Your
                <br />
                Athlete Within
              </Heading>
              <Text
                variant="textBase"
                className="font-medium text-primary-light mt-2"
              >
                Secure Access to Wellness Programs, tournaments, and wellness
                programs.
              </Text>
            </div>
          </div>
        </>
    )
}
export default AuthBanner;