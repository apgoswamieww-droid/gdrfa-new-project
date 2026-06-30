import { useState, useEffect } from "react";
import { getGlimpses } from "../../api/page.api";
import { SportsActivitiesOne, SportsActivitiesTwo, SportsActivitiesThree, SportsActivitiesFour, SportsActivitiesFive } from "../../assets/images/images";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useTranslation } from "react-i18next";

const fallbackImages = [SportsActivitiesOne, SportsActivitiesTwo, SportsActivitiesThree, SportsActivitiesFour, SportsActivitiesFive];
const defaultDescription = "Lorem Ipsum is simply dummy text of the printing Lorem Ipsum has been the industry's standard dummy text...";

export default function GlimpseSportsActivitieSec() {
    const { t, i18n } = useTranslation();
    const [items, setItems] = useState<any>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        getGlimpses()
            .then((res) => {
                if (res.status && Array.isArray(res.data)) {
                    setItems(res.data);
                }
            })
            .catch(() => {});
    }, []);

    const hasData = items.length > 0;
    const loopItems = hasData && items.length < 9 ? [...items, ...items, ...items] : items;

    return (
        <section className="xl:pb-20 lg:pb-20 pb-10 last-slider">
            <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
                <h2 className="md:text-[32px]/tight text-3xl/tight font-bold text-primary max-w-72 lg:-mb-20 mb-3">
                    {t('home.glimpseTitle')}
                </h2>
                <div className="xl:px-16">
                    <Swiper
                        key={hasData ? "loaded" : "empty"}
                        modules={[Autoplay]}
                        slidesPerView={3}
                        spaceBetween={24}
                        loop={true}
                        loopAdditionalSlides={3}
                        watchSlidesProgress={true}
                        autoplay={{
                            delay: 2500,
                            disableOnInteraction: false,
                        }}
                        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                        breakpoints={{
                            0: { slidesPerView: 3, spaceBetween: 0 },
                            640: { slidesPerView: 5, spaceBetween: 0 },
                            1024: { spaceBetween: 16 },
                            1280: { spaceBetween: 24 },
                        }}
                        className="lg:h-112.5 h-64 xl:-me-3!"
                    >
                        {hasData
                            ? loopItems.map((item: any, index: any) => (
                                <SwiperSlide key={`${item.id}-${index}`} className="transition-all duration-300 flex! flex-col justify-end lg:p-0 p-1">
                                    <div className="image-box lg:rounded-[14px] rounded-xl overflow-hidden lg:h-45 h-32 transition-all duration-300">
                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImages[index % fallbackImages.length]; }} />
                                    </div>
                                </SwiperSlide>
                            ))
                            : [...Array(15)].map((_, index) => (
                                <SwiperSlide key={index} className="transition-all duration-300 flex! flex-col justify-end lg:p-0 p-1">
                                    <div className="image-box lg:rounded-[14px] rounded-xl overflow-hidden lg:h-45 h-32 transition-all duration-300">
                                        <img src={fallbackImages[index % fallbackImages.length]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                </SwiperSlide>
                            ))}
                    </Swiper>
                </div>
                <p className="text-sm/tight font-medium text-secondary opacity-40 lg:max-w-80 max-w-96 lg:text-end lg:ms-auto lg:-mt-20 mt-3.5">{hasData ? (i18n.language === 'ar' ? items[activeIndex % items.length]?.description_ar || items[activeIndex % items.length]?.description || defaultDescription : items[activeIndex % items.length]?.description || items[activeIndex % items.length]?.description_ar || defaultDescription) : defaultDescription}</p>
            </div>
        </section>
    );
}
