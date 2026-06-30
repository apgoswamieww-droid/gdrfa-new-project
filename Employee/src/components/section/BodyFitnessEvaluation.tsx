import HorizontalLine from "./HorizontalLine"
import { Fitness1, Fitness2, Fitness3 } from "../../assets/images/images"
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import { useRef, useState, useEffect } from "react";
import CustomChart from "../Chart/CustomChart";
import { useAuthStore } from "../../store/store";
import { getFitnessCategory } from "../../api/page.api";
import { useTranslation } from "react-i18next";

export default function BodyFitnessEvaluationYo() {
    const { t } = useTranslation();
    const swiperRef = useRef<SwiperType | null>(null);
    const { token, currentLanguage } = useAuthStore();
    const isRTL = currentLanguage === "ar";
    const [categories, setCategories] = useState<any>([]);
    const [filterType, setFilterType] = useState("yearly");

    const [loading, setLoading] = useState(true);

    const isLoggedIn = Boolean(token);

    useEffect(() => {
        if (!isLoggedIn) {
            console.log('[BodyFitnessEvaluation] ❌ Not logged in — skipping fetch');
            return;
        }

        let cancelled = false;

        const fetchFitnessData = async () => {
            try {
                setLoading(true);
                console.log(`[BodyFitnessEvaluation] 🔵 STEP 1: Calling getFitnessCategory API with filterType = "${filterType}"`);
                const response = await getFitnessCategory(filterType);
                console.log('[BodyFitnessEvaluation] 🔵 STEP 2: Raw API response:', response);

                if (!cancelled) {
                    if (response?.data) {
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3: response.data:', response.data);
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3a: response.data.categories:', response.data.categories);
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3b: response.data.filter:', response.data.filter);
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3c: response.data.total_points:', response.data.total_points);
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3d: response.data.evaluation_date:', response.data.evaluation_date);
                        console.log('[BodyFitnessEvaluation] 🔵 STEP 3e: response.data.user:', response.data.user);
                    }

                    if (response.data?.categories) {
                        console.log(`[BodyFitnessEvaluation] 🔵 STEP 4: Setting ${response.data.categories.length} categories into state`);
                        response.data.categories.forEach((cat: any, i: number) => {
                            console.log(`[BodyFitnessEvaluation]   Category[${i}]:`, {
                                category_id: cat.category_id,
                                category_name: cat.category_name,
                                unit: cat.unit,
                                input_value: cat.input_value,
                                result_points: cat.result_points,
                                level: cat.level,
                                last_update: cat.last_update,
                                total_points: cat.total_points,
                                evaluation_points: cat.evaluation_points,
                            });
                        });
                        setCategories(response.data.categories);
                    } else {
                        console.log('[BodyFitnessEvaluation] ⚠️ STEP 4: No categories found in response — setting empty array');
                        if (!cancelled) setCategories([]);
                    }
                }
            } catch (err) {
                console.error('[BodyFitnessEvaluation] ❌ API call failed:', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchFitnessData();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, filterType]);

    console.log('[BodyFitnessEvaluation] 🟢 Rendering with categories state:', categories);

    const bodyFitnessData = categories.length > 0
        ? categories.map((cat: any, index: any) => {
            const item = {
                id: cat.category_id || index,
                label: cat.category_name,
                pts: cat.result_points ?? 0,
                date: cat.last_update ? new Date(cat.last_update).toLocaleDateString(t('i18n.language') === 'ar' ? 'ar-AE' : 'en-US', { day: "numeric", month: "short", year: "numeric" }).replace(/, \d{4}/, "") : "",
                stats: [""],
                rings: [cat.result_points ?? 0, Math.max(0, (cat.result_points ?? 0) - 20), Math.max(0, (cat.result_points ?? 0) - 40)],
                emoji: [Fitness1, Fitness2, Fitness3][index % 3],
            };
            console.log(`[BodyFitnessEvaluation] 🟢 Transformed item[${index}]:`, item);
            return item;
        })
        : [];

    console.log('[BodyFitnessEvaluation] 🟢 bodyFitnessData length:', bodyFitnessData.length, '| Will render?', bodyFitnessData.length > 0 ? 'YES ✅' : 'NO ❌ (null)');

    const [activeIndex, setActiveIndex] = useState(0);
    const loopItems = bodyFitnessData.length > 0 && bodyFitnessData.length < 6
        ? [...bodyFitnessData, ...bodyFitnessData, ...bodyFitnessData]
        : bodyFitnessData;

    const activeItem = bodyFitnessData[activeIndex % bodyFitnessData.length] || bodyFitnessData[0];

    const monthsArray: Record<number, string> = {
        0: t('home.january'),
        1: t('home.february'),
        2: t('home.march'),
        3: t('home.april'),
        4: t('home.may'),
        5: t('home.june'),
        6: t('home.july'),
        7: t('home.august'),
        8: t('home.september'),
        9: t('home.october'),
        10: t('home.november'),
        11: t('home.december')
    };

    const currentMonthLabel = `${monthsArray[new Date().getMonth()]} ${new Date().getFullYear()}`;

    if (!isLoggedIn) return null;

    if (loading) {
        return (
            <section className="xl:pt-24 xl:pb-35 lg:py-20 py-10">
                <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-64" />
                    </div>
                </div>
            </section>
        );
    }

    if (bodyFitnessData.length === 0) return null;

    return (
        <>
            <HorizontalLine />
            <section className="">
                <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
                    <div className="grid lg:grid-cols-3 sm:grid-cols-2 items-start gap-2">
                        <div className="">
                            <h2 className="text-secondary font-just font-bold md:text-[32px]/tight text-3xl/tight text-start max-w-82.5">
                                {t('home.fitnessTitle')}
                            </h2>
                        </div>
                        <div className="lg:block hidden"></div>
                        <div className="">
                            <div className="border rounded-[1.12rem] border-secondary/40 flex items-center justify-center md:gap-6 gap-3 md:ps-4 ps-3 pe-1 py-1 w-fit ms-auto">
                                <div className="flex items-center gap-2 z-40 text-sm/tight font-bold text-secondary">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M9.16797 10.833H13.3346M6.66797 10.833H6.67545M10.8346 14.1663H6.66797M13.3346 14.1663H13.3271"
                                            stroke="#7A2530"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M15 1.66699V3.33366M5 1.66699V3.33366"
                                            stroke="#0A2240"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M2.08203 10.2027C2.08203 6.57162 2.08203 4.75607 3.12546 3.62803C4.1689 2.5 5.84827 2.5 9.20703 2.5H10.7904C14.1491 2.5 15.8285 2.5 16.8719 3.62803C17.9154 4.75607 17.9154 6.57162 17.9154 10.2027V10.6307C17.9154 14.2617 17.9154 16.0773 16.8719 17.2053C15.8285 18.3333 14.1491 18.3333 10.7904 18.3333H9.20703C5.84827 18.3333 4.1689 18.3333 3.12546 17.2053C2.08203 16.0773 2.08203 14.2617 2.08203 10.6307V10.2027Z"
                                            stroke="#0A2240"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M2.5 6.66699H17.5"
                                            stroke="#0A2240"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    {currentMonthLabel}
                                </div>

                                <div className="w-auto relative">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="bg-primary rounded-xl md:px-4.5 px-3 md:pe-14! pe-12! py-2.5 text-sm/tight font-just font-bold text-white outline-none appearance-none cursor-pointer"
                                    >
                                        <option
                                            className="bg-white text-secondary/60"
                                            value="yearly"
                                        >
                                            {t('home.yearly')}
                                        </option>
                                        <option
                                            className="bg-white text-secondary/60"
                                            value="monthly"
                                        >
                                            {t('home.monthly')}
                                        </option>
                                    </select>
                                    <span className="absolute md:inset-e-4 inset-e-3 top-1/2 -translate-y-1/2">
                                        <svg
                                            width="12"
                                            height="7"
                                            viewBox="0 0 12 7"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M10.75 0.750041C10.75 0.750041 7.06758 5.75 5.75 5.75C4.43233 5.75 0.75 0.75 0.75 0.75"
                                                stroke="white"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="body-fitness-slider relative xl:p-10 lg:p-6 p-4 bg-[#154B981A] xl:rounded-[60px] lg:rounded-4xl rounded-3xl 2xl:min-h-110 lg:min-h-[300px] sm:min-h-[200px] mb-24 lg:mt-11 sm:mt-36 mt-40">
                        <Swiper
                            dir={isRTL ? "rtl" : "ltr"}
                            modules={[Autoplay]}
                            slidesPerView={3}
                            spaceBetween={110}
                            centeredSlides={true}
                            watchSlidesProgress={true}
                            onSwiper={(swiper) => {
                                swiperRef.current = swiper;
                                setActiveIndex(swiper.realIndex);
                            }}
                            onSlideChange={(swiper) => {
                                setActiveIndex(swiper.realIndex);
                            }}
                            loop={true}
                            autoplay={{
                                delay: 2500,
                                disableOnInteraction: false,
                            }}
                            breakpoints={{
                                0: {
                                    spaceBetween: 50,
                                    slidesPerView: 1,
                                },
                                640: {
                                    spaceBetween: 50,
                                },
                                1280: {
                                    spaceBetween: 110,
                                },
                            }}
                            className="2xl:!pt-36 lg:!pt-17 sm:!pt-10"
                        >
                            {loopItems.map((item: any, index: any) => (
                                <SwiperSlide key={`${item.id}-${index}`} className="">
                                    <div className="relative bg-white xl:rounded-[20px] rounded-2xl flex justify-between xl:px-8 xl:py-6 p-4 2xl:min-h-50 xl:min-h-50 min-h-42">
                                        <div>
                                            <img src={item.emoji} alt="" className="max-w-40 2xl:max-h-70 xl:max-h-42 lg:max-h-36 md:max-h-30 max-h-25 2xl:-mt-36 xl:-mt-20 -mt-14 absolute" />
                                        </div>

                                        <div className="flex flex-col justify-between lg:w-5/6 w-[65%]">
                                            <h5 className="lg:text-lg/tight text-base/tight font-bold text-primary mb-0.5 text-end">{item.label}</h5>
                                            <div className="text-end">
                                                <h4 className="xl:text-2xl/tight text-lg/tight font-bold text-secondary mb-0.5">{item.pts} {t('home.points')}</h4>
                                                <span className="hidden">{item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className="absolute z-20 2xl:-top-36 xl:-top-33 lg:-top-28 -top-26 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2  xl:rounded-[60px] lg:rounded-4xl rounded-3xl bg-primary text-white xl:px-10 xl:py-8 lg:p-7 p-4 sm:w-[calc(33.33%+14px)] w-full">
                            <div className="relative flex gap-2.5 justify-between xl:min-h-24 min-h-20">
                                <div>
                                    <img src={activeItem.emoji} alt="" className="max-w-35 2xl:max-h-52 xl:max-h-42 lg:max-h-36 max-h-30 xl:-mt-28 lg:-mt-20 -mt-14 absolute" />
                                </div>
                                <div className="text-end lg:w-5/6 w-[60%]">
                                    <h4 className="xl:text-2xl/tight text-lg/tight font-bold lg:mb-1.5 mb-1">{activeItem.pts} {t('home.points')}</h4>
                                    <span className="md:text-sm/tight text-xs/tight font-medium block text-[#CDA5A6]">{t('home.lastEvaluatedOn')} {activeItem.date}</span>
                                </div>
                            </div>
                            <hr className="m-0 border-0 h-px w-full bg-white/40 2xl:my-4.5 my-2 mb-4" />
                            <div className="text-center 2xl:min-h-100 xl:min-h-76 lg:min-h-60 lg:h-full sm:h-52 h-45 flex justify-center flex-col items-center">
                                <CustomChart rings={activeItem.rings} labels={activeItem.stats} />
                            </div>
                            <hr className="m-0 border-0 h-px w-full bg-white/40 my-4.5" />
                            <div className="flex justify-between items-center gap-3 xl:min-h-12">
                                <h5 className="xl:text-2xl/tight text-lg/tight font-bold">{activeItem.label}</h5>
                                <div className="flex items-center  md:gap-3 gap-1">
                                    <button
                                        onClick={() => swiperRef.current?.slidePrev()}
                                        className="group cursor-pointer ltr:-scale-x-100"
                                    >

                                        <svg className="h-2.5 md:w-11 w-8 transition-all duration-300 group-hover:scale-x-110 origin-left" width="43" height="9" viewBox="0 0 43 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 4.25L41 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M39 0.75C39.6068 1.43814 42 3.26972 42 4.25C42 5.23028 39.6068 7.0619 39 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                    </button>

                                    <button
                                        onClick={() => swiperRef.current?.slideNext()}
                                        className="group cursor-pointer rtl:-scale-x-100"
                                    >
                                        <svg className="h-2.5 md:w-11 w-8 transition-all duration-300 group-hover:scale-x-110 origin-left" width="43" height="9" viewBox="0 0 43 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 4.25L41 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M39 0.75C39.6068 1.43814 42 3.26972 42 4.25C42 5.23028 39.6068 7.0619 39 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}