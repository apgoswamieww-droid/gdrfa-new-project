import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/store";
import { useLocation } from "react-router-dom";
import {
  HeroFirst,
  HeroFourth,
  HeroSecond,
  HeroThird,
} from "../../assets/images/images";
import { getHomeSliders } from "../../api/page.api";

type BannerSlide = {
  id: string | number;
  type: "image" | "video";
  src: string;
  poster?: string;
  title?: string;
  description?: string;
};

const defaultSlides: BannerSlide[] = [
  { id: "hero-first", type: "image", src: HeroFirst },
  { id: "hero-second", type: "image", src: HeroSecond },
  { id: "hero-third", type: "image", src: HeroThird },
  { id: "hero-fourth", type: "image", src: HeroFourth },
];

const BannerWrapper = () => {
  const { token } = useAuthStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState<BannerSlide[]>(defaultSlides);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const response = await getHomeSliders();
        if (response.status && response.data && response.data.length > 0) {
          const apiSlides: BannerSlide[] = response.data.map((item: any) => ({
            id: item.id,
            type: item.media_type,
            src: item.media_path,
            title: item.title,
            description: item.short_description,
          }));
          setSlides(apiSlides);
        } else {
          // If API returns empty data, explicitly keep or reset to defaults
          setSlides(defaultSlides);
        }
      } catch (error) {
        console.error("Failed to fetch home sliders:", error);
        // Fallback to defaults on error
        setSlides(defaultSlides);
      }
    };

    fetchSliders();
  }, []);

  useEffect(() => {
    if (token) {
      // Token-dependent hero behavior can be added here when event data is wired.
    }
  }, [token]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToId) {
      const el = document.getElementById(location.state.scrollToId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const slider = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(slider);
  }, [slides.length]);

  return (
    <main className="flex-1 h-full">
      <section
        className="relative 2xl:py-[6vw] md:py-40 py-20 bg-cover bg-bottom bg-no-repeat xl:h-200 lg:h-175 md:h-120 sm:h-100 xs:h-140 h-135 max-[375px]:h-120 overflow-hidden"
      >
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSlide === index ? "opacity-100" : "opacity-0"
                }`}
            >
              {slide.type === "video" ? (
                <video
                  src={slide.src}
                  poster={slide.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover object-bottom"
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.title || ""}
                  className="w-full h-full object-cover object-bottom"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-white/5" />
        <div
          className="relative max-w-341.5 w-full mx-auto md:px-7 px-4 h-full my-auto
"
        >
          <div className="grid sm:grid-cols-2 gap-5 lg:pt-30 md:pt-0 sm:pt-20 pt-0 xl:pb-20 lg:pb-5 md:pb-20 sm:pb-10 pb-5">
            <div className="col-span-1">
              <div className="absolute xl:-bottom-40 md:-bottom-20 -bottom-15 sm:-inset-s-15 -inset-s-7 2xl:w-255 xl:w-240 lg:w-200 md:w-130 sm:w-110 xs:w-[80%] w-[90%]">
              </div>
            </div>
            <div className="col-span-1 text-end 2xl:pt-35 xl:pt-25 lg:pt-15">
            </div>
          </div>
          <div className="text-end w-full xl:max-w-175 sm:max-w-100 ms-auto sm:mb-0 mb-20 relative z-20">
          </div>
        </div>
      </section>
      <section className="ms-auto 2xl:w-full xl:w-[calc(100%-120px)] w-[calc(100%-80px)] flex justify-end xl:py-20 lg:py-15 py-10">
        <svg
          width="1300"
          height="2"
          viewBox="0 0 1300 2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 1C0 0.447715 0.447715 0 1 0H1300V2H1.00003C0.44775 2 0 1.55228 0 1Z"
            fill="#7A2530"
          />
        </svg>
      </section>
    </main>
  );
};

export default BannerWrapper;
