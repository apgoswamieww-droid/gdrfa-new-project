import { Text } from "../../component/Typography/Typography";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { useTranslation } from "../../hooks/useTranslation";
import "swiper/swiper-bundle.css";

interface EventItem {
  title: string;
  img: string;
  description: string;
  category: string;
  date: string;
}

interface EventCardProps {
  events: EventItem[];
}

const EventCard = ({ events }: EventCardProps) => {
  const { t } = useTranslation();
  return (
    <Swiper
      modules={[FreeMode]}
      freeMode={true}
      slidesPerView={1}
      spaceBetween={16}
      breakpoints={{
        0: {
          slidesPerView: 1.2,
          spaceBetween: 12,
        },
        640: {
          slidesPerView: 1.9,
          spaceBetween: 12,
        },
        1280: {
          slidesPerView: 2.4,
          spaceBetween: 16,
        },
        1536: {
          slidesPerView: 3.2,
          spaceBetween: 16,
        },
      }}
      className="w-full"
    >
      {events.map((item, index) => (
        <SwiperSlide key={index}>
          <div className="2xl:rounded-xl rounded-lg 2xl:h-80 sxl:h-72 h-60 overflow-hidden p-[0.2px] relative">
            <div className="2xl:rounded-xl rounded-lg h-full overflow-hidden">
              <img src={item.img} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="md:p-2 p-1 flex flex-col justify-between absolute inset-0 z-20 items-start bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)]">
              <Text
                variant="textXss"
                className="inline-block rounded-full text-primary font-semibold lg:py-1.5 py-1 lg:px-3.5 px-2.5 bg-white lg:m-1.5"
              >
                {t.dashboard?.individual || "Individual"}
              </Text>
              <div className="w-full 2xl:rounded-lg rounded-xl bg-white/70 border border-white 2xl:p-4 lg:p-3 p-2.5 xl:min-h-28 xs:min-h-24 flex flex-col justify-between backdrop-blur-[2px]">
                <Text variant="textLg" className="font-bold text-secondary lg:mb-3 mb-2 line-clamp-2">
                  {item.title}
                </Text>
                <Text variant="textSm" className="flex lg:gap-1.5 gap-1 font-medium text-secondary/60">
                  <svg className="min-w-4.5 w-4.5 h-4.5" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1.5V4.5M6 1.5V4.5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.75 9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.25 7.5H15.75" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.7003 14.0258L12.75 13.5V12.2001M15.75 13.5C15.75 15.1568 14.4068 16.5 12.75 16.5C11.0932 16.5 9.75 15.1568 9.75 13.5C9.75 11.8432 11.0932 10.5 12.75 10.5C14.4068 10.5 15.75 11.8432 15.75 13.5Z" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.date}
                </Text>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default EventCard;
