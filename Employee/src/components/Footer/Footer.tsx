import { useTranslation } from "react-i18next";
import { FooterBg, LogoImage } from "../../assets/images/images";
import { useScroll } from "../../utils/ScrollContext";
import { useAuthStore } from "../../store/store";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const { setScrollToId } = useScroll();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);

  const allLinks = [
    { label: `${t("Home")}`, href: "/" },
    { label: `${t("sportsEvent")}`, href: "/sport-activity-list" },
    { label: `${t("achievements")}`, href: "/achievement", requiresAuth: true },
    { label: `${t("Facilities")}`, href: "/facilities" },
  ];

  const navLinks = allLinks.filter((l) => !l.requiresAuth || token);

  const cmsLinks = [
    { label: `${t("contact us")}`, href: "/contact-us" },
    { label: `${t("faqs")}`, href: "/faq" },
    { label: `${t("system User Guide")}`, href: "/system-user-guide" },
    {
      label: `${t("end User Licence Agreement")}`,
      href: "/end-user-licence-agreement",
    },
  ];
  return (
    <footer
      className="relative overflow-hidden xl:pt-20 lg:pt-15 pt-10 md:pb-0 pb-10 2xl:h-182.5 xl:h-170 lg:h-130 md:h-110 h-full bg-bottom bg-size-[100%_100%] bg-no-repeat"
      style={{ backgroundImage: `url(${FooterBg})` }}
    >
      <div className="max-w-341.5 w-full mx-auto md:px-7 px-4 relative">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="scroll-top rounded-full absolute top-0 -translate-y-1/2 xl:inset-e-33 md:inset-e-20 inset-e-12 xl:w-20 md:w-15 w-13 xl:h-20 md:h-15 h-13 md:border-7 border-5 border-white cursor-pointer"
        >
          <span className="bg-secondary w-full h-full rounded-full flex items-center justify-center">
            <svg
              className="xl:w-8 w-6 xl:h-8 h-6"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 5.33301V26.6663"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.6653 11.9996C22.6653 11.9996 17.7555 5.33302 15.9987 5.33301C14.2419 5.33299 9.33203 11.9997 9.33203 11.9997"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        <div className="bg-red-light xl:rounded-[80px] md:rounded-[60px] rounded-4xl xl:p-15 md:p-10 p-4">
          {/* Top Footer Grid */}
          <div className="grid lg:grid-cols-2 md:grid-cols-5 grid-cols-1 lg:gap-8 md:gap-4 md:pt-0 pt-8">
            <div className="lg:col-span-1 md:col-span-2 md:mb-0 mb-4 md:border-0 border-b border-primary md:pb-0 pb-4">
              <Link
                to="/"
                className="flex items-center md:justify-start justify-center w-full xl:mb-15 lg:mb-10 md:mb-8 mb-6"
              >
                <img
                  src={LogoImage}
                  alt={t("alt.logo")}
                  width={150}
                  height={40}
                  className="xl:h-9 md:h-8 sm:h-7 h-6 object-contain w-auto"
                />
              </Link>

              <ul className="xl:mb-15 lg:mb-10 md:mb-8 mb-6">
                <li className="flex items-center md:justify-start justify-center gap-2.5 lg:mb-4 md:mb-2 mb-1 last:mb-0">
                  <svg
                    className="w-6 h-6 min-w-6 p-0.5 rtl:-scale-x-100"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.90826 3.46223L6.5056 2.55625C6.24232 1.96388 6.11068 1.66768 5.91381 1.44101C5.66708 1.15694 5.34547 0.94794 4.98568 0.83785C4.69859 0.75 4.37446 0.75 3.72621 0.75C2.77791 0.75 2.30376 0.75 1.90573 0.93229C1.43687 1.14702 1.01344 1.61328 0.844727 2.1006C0.701507 2.51429 0.742537 2.93943 0.824577 3.7897C1.69791 12.8402 6.65982 17.8021 15.7103 18.6754C16.5606 18.7575 16.9858 18.7985 17.3994 18.6553C17.8868 18.4866 18.353 18.0631 18.5678 17.5943C18.75 17.1962 18.75 16.7221 18.75 15.7738C18.75 15.1255 18.75 14.8014 18.6622 14.5143C18.5521 14.1545 18.3431 13.8329 18.059 13.5862C17.8324 13.3893 17.5362 13.2577 16.9438 12.9944L16.0378 12.5917C15.3963 12.3066 15.0755 12.1641 14.7496 12.1331C14.4376 12.1034 14.1231 12.1472 13.8311 12.2609C13.526 12.3797 13.2564 12.6044 12.717 13.0538C12.1802 13.5012 11.9118 13.7249 11.5838 13.8447C11.293 13.9509 10.9086 13.9903 10.6024 13.9451C10.2569 13.8942 9.99236 13.7529 9.46326 13.4701C7.81726 12.5905 6.90953 11.6828 6.02987 10.0367C5.74714 9.5077 5.60578 9.2431 5.55487 8.8977C5.50974 8.5914 5.54908 8.207 5.6553 7.9163C5.77512 7.58828 5.99881 7.31986 6.44619 6.783C6.89562 6.24368 7.12034 5.97402 7.23915 5.66891C7.35285 5.37694 7.39662 5.0624 7.36695 4.75048C7.33594 4.42452 7.19338 4.10376 6.90826 3.46223Z"
                      stroke="#7A2530"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg
                    width="2"
                    height="10"
                    viewBox="0 0 2 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.75 0.75L0.75 8.75"
                      stroke="#0A2240"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <a
                    href="tel:047075999"
                    className="text-sm text-secondary hover:text-primary font-just font-bold transition-colors duration-300 ease-in-out"
                  >
                    047075999
                  </a>
                </li>
                <li className="flex items-center md:justify-start justify-center gap-2.5 lg:mb-4 md:mb-2 mb-1last:mb-0">
                  <svg
                    className="w-6 h-6 min-w-6"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 8.5L9.94202 10.2394C11.6572 11.2535 12.3428 11.2535 14.058 10.2394L17 8.5"
                      stroke="#7A2530"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.01577 13.4756C2.08114 16.5411 2.11383 18.0739 3.24496 19.2093C4.37609 20.3448 5.95034 20.3843 9.09884 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.755 19.2093C21.8862 18.0739 21.9189 16.5411 21.9842 13.4756C22.0053 12.4899 22.0053 11.51 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.755 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95034 3.61566 4.37609 3.65521 3.24496 4.79065C2.11383 5.92608 2.08114 7.45885 2.01577 10.5243C1.99474 11.51 1.99474 12.4899 2.01577 13.4756Z"
                      stroke="#7A2530"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg
                    width="2"
                    height="10"
                    viewBox="0 0 2 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.75 0.75L0.75 8.75"
                      stroke="#0A2240"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <a
                    href="mailto:servicedesk@gdrfa.ae"
                    className="text-sm text-secondary hover:text-primary font-just font-bold transition-colors duration-300 ease-in-out"
                  >
                    servicedesk@gdrfa.ae
                  </a>
                </li>
              </ul>
              <ul className="flex items-center gap-1 md:justify-start justify-center w-full">
                <li>
                  <a
                    href={"#"}
                    target="_blank"
                    className="group border border-primary hover:bg-primary rounded-full flex items-center justify-center xl:w-13 w-11 xl:h-13 h-11 xl:min-w-13 min-w-11 transition-colors duration-500 ease-in-out"
                  >
                    <svg
                      className="xl:w-6 w-5 xl:h-6 h-5"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="group-hover:stroke-white"
                        d="M3 21L10.5484 13.4516M10.5484 13.4516L3 3H8L13.4516 10.5484M10.5484 13.4516L16 21H21L13.4516 10.5484M21 3L13.4516 10.5484"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>
                <li>
                  <a
                    href={"#"}
                    target="_blank"
                    className="group border border-primary hover:bg-primary rounded-full flex items-center justify-center xl:w-13 w-11 xl:h-13 h-11 xl:min-w-13 min-w-11 transition-colors duration-500 ease-in-out"
                  >
                    <svg
                      className="xl:w-6 w-5 xl:h-6 h-5"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="group-hover:stroke-white"
                        d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        className="group-hover:stroke-white"
                        d="M16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12Z"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                      />
                      <path
                        className="group-hover:stroke-white"
                        d="M17.509 6.5H17.5"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    className="group border border-primary hover:bg-primary rounded-full flex items-center justify-center xl:w-13 w-11 xl:h-13 h-11 xl:min-w-13 min-w-11 transition-colors duration-500 ease-in-out"
                  >
                    <svg
                      className="xl:w-6 w-5 xl:h-6 h-5"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="group-hover:stroke-white"
                        d="M7 8.5L9.94202 10.2394C11.6572 11.2535 12.3428 11.2535 14.058 10.2394L17 8.5"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        className="group-hover:stroke-white"
                        d="M2.01577 13.4756C2.08114 16.5411 2.11383 18.0739 3.24496 19.2093C4.37609 20.3448 5.95034 20.3843 9.09884 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.755 19.2093C21.8862 18.0739 21.9189 16.5411 21.9842 13.4756C22.0053 12.4899 22.0053 11.51 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.755 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95034 3.61566 4.37609 3.65521 3.24496 4.79065C2.11383 5.92608 2.08114 7.45885 2.01577 10.5243C1.99474 11.51 1.99474 12.4899 2.01577 13.4756Z"
                        stroke="#7A2530"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-1 md:col-span-3 flex md:flex-row flex-col items-end justify-end xl:gap-6 md:gap-4">
              {/* About */}
              <div className="md:col-span-4 w-full relative md:pe-3 after:md:block after:hidden after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:xl:-inset-e-8 after:lg:-inset-e-4 after:inset-e-0 after:my-auto after:border after:border-primary after:h-20">
                <div className="col-span-1 md:text-start text-center md:mb-0 mb-4 md:border-0 border-b border-primary md:pb-0 pb-4">
                  <h3 className="text-primary font-just font-bold text-lg md:mb-3 mb-2 capitalize">
                    {t("about")}
                  </h3>
                  <ul className="lg:space-y-2.5 space-y-1">
                    {cmsLinks.map((text, i) => (
                      <li key={i}>
                        <Link
                          to={text.href}
                          className="capitalize text-secondary hover:text-primary lg:text-base/tight text-sm/tight font-just font-semibold transition-colors duration-300 ease-in-out"
                        >
                          {text.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quick Links */}
              <div className="md:col-span-4 w-full relative lg:ms-20 md:ms-2 xl:pe-5 md:pe-3">
                <div className="col-span-1 md:text-start text-center">
                  <h3 className="text-primary font-just font-bold text-lg md:mb-3 mb-2 capitalize">
                    {t("quick Links")}
                  </h3>
                  <ul className="lg:space-y-2.5 space-y-1">
                    {navLinks.map((text, i) => (
                      <li key={i}>
                        <a
                          onClick={() => {
                            if (text.href.startsWith("/")) {
                              navigate(text.href);
                            } else {
                              navigate("/");
                              setScrollToId(text.href); // store id
                            }
                          }}
                          className="capitalize text-secondary cursor-pointer hover:text-primary lg:text-base/tight text-sm/tight font-just font-semibold transition-colors duration-300 ease-in-out"
                        >
                          {text.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}

      <div className="max-w-341.5 w-full mx-auto md:px-7 px-4 xl:mt-10 mt-5 relative">
        <div className="flex md:flex-nowrap flex-wrap-reverse xl:gap-4.5 md:gap-3 gap-4 xl:px-15 px-10">
          <div className="text-center w-full flex md:flex-nowrap flex-wrap-reverse items-center md:justify-between justify-center xl:gap-4 gap-2 gap-y-1">
            <p className="text-sm text-white font-just font-bold md:text-start text-center w-full">
              {t("footer.copyright", { year: 2025 })}
            </p>
            <ul className="flex items-center md:justify-end justify-center xl:gap-6 gap-3 w-fit">
              <li className="relative after:content-[''] after:absolute after:xl:-inset-e-6 after:-inset-e-1.5 after:h-2.5 after:w-[1.5px] after:bg-primary after:top-1/2 after:-translate-y-1/2">
                <Link
                  to="/terms-condition"
                  className="text-sm font-just font-medium text-white hover:underline transition-colors duration-300 ease-in-out whitespace-nowrap"
                >
                  {t("footer.termsConditions")}
                </Link>
              </li>
              <li>
                <svg
                  width="2"
                  height="12"
                  viewBox="0 0 2 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.75 0.75L0.75 10.75"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm font-just font-medium text-white hover:underline transition-colors duration-300 ease-in-out whitespace-nowrap"
                >
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="absolute 2xl:-bottom-31 xl:-bottom-27 lg:-bottom-18 md:-bottom-15 -bottom-6 inset-s-0 inset-e-0 2xl:text-[200px] xl:text-[172px] lg:text-[130px] md:text-[100px] text-[40px] text-center font-bold bg-[linear-gradient(180deg,#FFFFFF_0%,rgba(255,255,255,0)_61.35%)] bg-clip-text text-transparent">
        GDRFA SPORTS
      </div>
    </footer>
  );
};

export default Footer;
