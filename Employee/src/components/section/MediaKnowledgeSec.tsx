import { useBlogs } from "../../hooks/useBlogs";
import PrimaryBtn from "../common/PrimaryBtn";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useTranslation } from "react-i18next";

export default function MediaKnowledgeSec() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, loading } = useBlogs(1, 6);

  return (
    <section className="overflow-x-hidden">
      <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="flex xs:items-center justify-between xs:flex-row flex-col gap-y-3">
          <div className="max-w-135.5">
            <h2 className="md:text-[40px]/tight text-2xl/tight font-bold text-primary lg:mb-3 mb-2">
              {t('mediaKnowledge.title')}
            </h2>
            <p className="text-secondary text-base/tight font-medium opacity-60">
              {t('home.mediaSubtitle')}
            </p>
          </div>
          <PrimaryBtn onClick={() => navigate("/media-knowledge")} className="max-w-73 md:w-full text-nowrap">
            {t('home.exploreMore')}
          </PrimaryBtn>
        </div>
        <div className="xl:mt-20 lg:mt-12 mt-7">
          {loading ? (
            <div className="text-center py-10 text-secondary/60">{t('home.loading')}</div>
          ) : (
            <Swiper
              modules={[Autoplay]}
              slidesPerView="auto"
              loop={items.length > 3}
              autoplay={{
                delay: 25000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 16 },
                480: { slidesPerView: "auto", spaceBetween: 16 },
                768: { spaceBetween: 20 },
                1199: { spaceBetween: 32 },
              }}
              className="2xl:w-[90dvw] xs:w-[100dvw]"
            >
              {items.slice(0, 6).map((item: any) => (
                <SwiperSlide key={item.id} className="xs:w-[320px]! p-1">
                  <div
                    onClick={() => navigate(`/media-knowledge/${item.id}`)}
                    className="relative lg:rounded-4xl rounded-2xl w-full h-45 lg:mb-4 mb-3 overflow-hidden cursor-pointer group/card"
                  >
                    <img
                      src={item.image}
                      alt={i18n.language === 'ar' ? item.title_ar || item.title : item.title}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover/card:scale-105"
                    />
                    {item.isVideo && (
                      <div className="rounded-full bg-primary/30 md:w-15 w-12 aspect-square absolute top-1/2 left-1/2 -translate-1/2 z-10 inline-flex justify-center items-center backdrop-blur-sm">
                        <svg className="h-auto md:w-7 w-5" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.66 15.4C22.24 17.03 20.24 18.16 16.23 20.44C12.35 22.64 10.42 23.7 8.86 23.3C8.21 23.1 7.62 22.77 7.15 22.29C6 21.14 6 18.89 6 14.4C6 9.91 6 7.66 7.15 6.5C7.62 6.03 8.21 5.68 8.86 5.5C10.42 5.05 12.35 6.15 16.23 8.35C20.24 10.6 22.24 11.77 22.66 13.38C22.84 14.05 22.84 14.7 22.66 15.4Z" fill="white" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div onClick={() => navigate(`/media-knowledge/${item.id}`)} className="cursor-pointer group/desc">
                    <div className="flex justify-between gap-2 lg:mb-3.5 mb-2.5 items-center">
                      <span className="rounded-full inline-block xs:py-1.5 py-1 px-2.5 text-xs/tight text-primary font-bold bg-[#E7D2D2]">
                        {item.category}
                      </span>
                      <span className="inline-block text-sm/tight font-medium text-secondary">{item.readTime}</span>
                    </div>
                    <h4 className="text-base/tight font-bold text-secondary lg:mb-1.5 mb-1 line-clamp-2 group-hover/desc:text-primary transition-colors">
                      {i18n.language === 'ar' ? item.title_ar || item.title : item.title}
                    </h4>
                    <p className="text-sm/tight text-secondary opacity-60 font-medium line-clamp-2">{i18n.language === 'ar' ? item.description_ar || item.description : item.description}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
}