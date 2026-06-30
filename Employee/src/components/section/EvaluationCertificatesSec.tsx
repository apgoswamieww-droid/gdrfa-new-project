import { useTranslation } from "react-i18next";
import HorizontalLine from "./HorizontalLine"
import { CertificateImg, CertificateSecBg, EvolutionHeadingImg } from "../../assets/images/images";
import PrimaryBtn from "../common/PrimaryBtn";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useRef, useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../store/store";
import { getCertificates, downloadCertificateImage } from "../../api/page.api";
import Toast from "../ui/Toast";

import "swiper/css";
import "swiper/css/effect-fade";

export default function EvaluationCertificatesSec(){
    const { t } = useTranslation();
    const swiperRef = useRef<SwiperType | null>(null);
    const { token } = useAuthStore();
    const [certificates, setCertificates] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const handleDownload = useCallback(async (id: number) => {
        try {
            await downloadCertificateImage(id);
        } catch {
            setToast({ message: "Download failed", type: "error" });
        }
    }, []);

    const isLoggedIn = Boolean(token);

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        const fetchCertificates = async () => {
            try {
                setLoading(true);
                const response = await getCertificates();
                if (!cancelled) {
                    setCertificates(response.data || []);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : t("evaluationCertificates.failedToLoad"));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchCertificates();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, t]);

    if (!isLoggedIn) return null;

    if (loading) {
        return (
            <section className="xl:pt-24 xl:pb-35 lg:py-20 py-10">
                <div className="max-w-[1366px] w-full mx-auto md:px-7 px-4 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-64 mx-auto" />
                        <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
                    </div>
                </div>
            </section>
        );
    }

    if (error || certificates.length === 0) {
        return null;
    }

    return(
        <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <HorizontalLine />
        <section className="">
            <div className="max-w-[1366px] w-full mx-auto md:px-7 px-4">
                <div className="text-center max-w-[730px] mx-auto flex lg:gap-8 gap-3.5 items-center">
                    <div className="xs:block hidden rtl:-scale-x-100">
                        <img src={EvolutionHeadingImg} alt="" className="h-auto sm:min-w-16 sm:w-16 min-w-11 w-11" />
                    </div>
                    <div>
                        <h2 className="md:text-[40px]/tight text-2xl/tight font-bold text-[#050729] lg:mb-4 mb-3">
                            {t("evaluationCertificates.title")}
                        </h2>
                        <p className="text-black text-base/tight font-medium opacity-60">{t("evaluationCertificates.subtitle")}</p>
                    </div>
                    <div className="ltr:-scale-x-100 xs:block hidden">
                        <img src={EvolutionHeadingImg} alt="" className="h-auto sm:min-w-16 sm:w-16 min-w-11 w-11" />
                    </div>
                </div>
            </div>
            <div 
                style={{ backgroundImage: `url(${CertificateSecBg})` }}
                className="bg-no-repeat bg-center md:px-7 px-4 relative">
                    <div className="xl:mt-24 mt-14 border border-primary max-w-[880px] mx-auto xl:rounded-[60px] rounded-4xl bg-[#FFF7F7]  xl:px-10 md:px-7 xs:px-5 px-3 relative z-20">
                        <Swiper
                            modules={[Navigation, Autoplay, EffectFade]}
                            onSwiper={(swiper) => (swiperRef.current = swiper)}
                            effect="fade"
                            fadeEffect={{ crossFade: true }}
                            loop={true}
                            autoplay={{
                                delay: 3000,
                                disableOnInteraction: false,
                            }}
                            spaceBetween={0}
                            slidesPerView={1}
                            
                            className="slide-equal-height -my-6"
                            >
                            {certificates.map((item: any, index: any) => (
                                <SwiperSlide key={item.id || index} className="!h-auto">
                                    <div className="bg-white border border-black xl:rounded-[60px] rounded-4xl xl:ps-10 md:ps-7 xs:ps-5 ps-3 xl:pt-5 sm:pt-4 pt-3 flex xs:flex-row flex-col overflow-hidden h-full justify-between">
                                        <div className="xl:pb-5 pb-4 xs:w-1/2 w-full self-center xl:pe-7 xs:pe-0 pe-3">
                                            <h3 className="text-black lg:text-2xl/tight text-lg/tight font-bold lg:mb-2 mb-1">{item.activity_title || item.event_title}</h3>
                                            <p className="text-secondary opacity-40 text-sm/tight font-medium">{item.event_title}</p>
                                            <span className="block w-[60px] h-px bg-secondary xl:my-8 md:my-5 my-3.5"></span>
                                            <div>
                                              <PrimaryBtn
                                                className="max-w-[292px] w-full"
                                                onClick={() => handleDownload(item.id)}
                                              >
                                                {t("evaluationCertificates.download")}
                                              </PrimaryBtn>
                                            </div>
                                        </div>
                                        <div className="xs:w-1/2 w-full self-end">
                                            <img src={CertificateImg} alt="" className="ms-auto lg:h-84 md:h-70 rtl:-scale-x-100" />
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    <div className="flex gap-2 justify-center xl:mt-16 mt-12">
                        <button
                        onClick={() => swiperRef.current?.slidePrev()}
                        className="group cursor-pointer -scale-x-100"
                        >
                        
                            <svg className="h-2.5 w-11 transition-all duration-300 group-hover:scale-x-110 origin-left" width="43" height="9" viewBox="0 0 43 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4.25L41 4.25" stroke="#7A2530" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M39 0.75C39.6068 1.43814 42 3.26972 42 4.25C42 5.23028 39.6068 7.0619 39 7.75" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>

                        </button>

                        <button
                        onClick={() => swiperRef.current?.slideNext()}
                        className="group cursor-pointer"
                        >
                        
                            <svg className="h-2.5 w-11 transition-all duration-300 group-hover:scale-x-110 origin-left" width="43" height="9" viewBox="0 0 43 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4.25L41 4.25" stroke="#7A2530" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M39 0.75C39.6068 1.43814 42 3.26972 42 4.25C42 5.23028 39.6068 7.0619 39 7.75" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>

                        </button>
                    </div>
            </div>
        </section>
        </>
    )
}
