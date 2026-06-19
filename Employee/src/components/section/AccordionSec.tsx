import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccordionImgOne } from "../../assets/images/images";
import PrimaryBtn from "../common/PrimaryBtn";
import { useAuthStore } from "../../store/store";
import { getFacilities } from "../../api/page.api";
import { slugify } from "../../utils/slug";
import { useTranslation } from "react-i18next";

export default function AccordionSec() {
    const { t, i18n } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [facilities, setFacilities] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const isLoggedIn = Boolean(token);

    useEffect(() => {
        let cancelled = false;
        const fetchFacilities = async () => {
            try {
                setLoading(true);
                const response = await getFacilities();
                if (!cancelled) {
                    setFacilities(response.data || []);
                }
            } catch {
                if (!cancelled) setFacilities([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchFacilities();
        return () => { cancelled = true; };
    }, []);

    const handleReviewClick = () => {
        if (isLoggedIn) {
            navigate("/profile?view=requests");
        } else {
            navigate("/login");
        }
    };

    const renderAccordionItems = () => {
        if (loading) {
            return (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded" />
                    ))}
                </div>
            );
        }
        if (facilities.length === 0) {
            return <p className="text-center text-secondary/40 font-medium py-10">{t('home.noFacilities')}</p>;
        }
        return facilities.map((item: any, index: any) => {
            const isActive = activeIndex === index;
            const isNextActive = activeIndex === index - 1;
            const imgSrc = item.image || AccordionImgOne;
            const numberStr = String(index + 1).padStart(2, '0');

            return (
                <div key={item.id} onClick={() => setActiveIndex(index)} className="group flex cursor-pointer">
                    <div className="md:w-1/5 xs:w-[60px] w-10 flex flex-col justify-between">
                        <span className={`flex items-center xl:gap-6 xs:gap-4 gap-2 xl:py-6 lg:py-4 py-3 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary ${isActive ? 'lg:text-[20px]/tight text-lg/tight font-bold opacity-100 text-primary' : 'lg:text-lg/tight text-base/tight font-medium opacity-60 text-secondary'}`}>
                            {numberStr}
                            <span className={`rtl:-scale-x-100 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${isActive ? 'translate-x-0 opacity-100' : 'xl:-translate-x-4 -translate-x-3 opacity-0'}`}>
                                <svg className="xl:w-6 w-4 h-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 9V15" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.7236 14.9351L16.0046 17.3928C13.8559 19.335 12.7816 20.3061 11.8908 19.9143C11 19.5225 11 18.0788 11 15.1915V15H10C8.5858 15 7.8787 15 7.4393 14.5607C7 14.1213 7 13.4142 7 12C7 10.5858 7 9.87868 7.4393 9.43934C7.8787 9 8.5858 9 10 9H11V8.80852C11 5.92117 11 4.47749 11.8908 4.08568C12.7816 3.69387 13.8559 4.66499 16.0046 6.60723L18.7236 9.06495C20.2412 10.4367 21 11.1226 21 12C21 12.8774 20.2412 13.5633 18.7236 14.9351Z" fill="#7A2530" />
                                </svg>
                            </span>
                        </span>
                        <span className="w-2.5 h-px block bg-black/40"></span>
                    </div>
                    <div className="md:w-4/5 xs:w-[calc(100%-60px)] w-[calc(100%-40px)]">
                        <div className={`xl:ps-10 lg:ps-7 md:ps-4 ps-3 border-t relative before:content-[''] before:absolute before:h-full before:block before:w-dvw before:start-full ${index === 0 || isNextActive ? "border-none" : "border-t-primary"} ${isActive ? 'border-none bg-[#154B981A] before:bg-[#154B981A]' : 'border-primary/40 before:bg-transparent'}`}>
                            <h4 className={`xl:py-6 lg:py-4 py-3 lg:text-lg/tight text-base/tight text-secondary opacity-60 font-bold transition-all duration-300 group-hover:opacity-100 ${isActive ? 'hidden' : 'block'}`}>{i18n.language === 'ar' ? item.title_ar || item.title : item.title}</h4>
                            <div className={`md:py-2 py-3 items-end xl:gap-[60px] lg:gap-8 md:gap-6 sm:gap-4 gap-2 sm:flex-row flex-col ${isActive ? 'flex' : 'hidden'}`}>
                                <div className="flex xs:gap-4 gap-3 xs:flex-row flex-col">
                                    <div className="xs:w-1/2 w-full flex flex-col justify-between xl:py-8 lg:py-4 py-0">
                                        <h5 className="lg:text-lg/tight text-base/tight font-bold text-secondary">{i18n.language === 'ar' ? item.title_ar || item.title : item.title}</h5>
                                        <p className="text-sm/tight font-medium text-secondary opacity-40">{i18n.language === 'ar' ? item.description_ar || item.description : item.description}</p>
                                    </div>
                                    <div className="xs:w-1/2 w-full">
                                        <img src={imgSrc} alt={i18n.language === 'ar' ? item.title_ar || item.title : item.title} className="" />
                                    </div>
                                </div>
                                <Link
                                    to={`/facilities/${slugify(item.title)}`}
                                    className="rounded-full bg-white flex justify-center items-center lg:gap-1.5 gap-1 lg:py-2 py-1 lg:px-4 px-3 text-sm/tight font-bold text-black lg:mb-2.5 transition-all duration-300 hover:bg-primary hover:text-white group/req"
                                >
                                    {t('home.request')}
                                    <svg className="rtl:-scale-x-100 lg:w-6 w-4 h-auto text-primary transition-all duration-300 group-hover/req:text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17 7L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M11 6.13153C11 6.13153 16.6335 5.65664 17.4885 6.51155C18.3434 7.36647 17.8684 13 17.8684 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <section className="overflow-x-hidden">
            <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
                <div className="flex justify-between xs:items-center xs:flex-row flex-col gap-y-3">
                    <div className="max-w-97.5 text-start">
                        <h2 className="md:text-[32px]/tight text-3xl/tight font-bold text-primary lg:mb-3 mb-2">
                            {t('home.facilitiesTitle')}
                        </h2>
                        <p className="text-base/tight font-medium text-secondary opacity-60">{t('home.facilitiesSubtitle')}</p>
                    </div>
                    <PrimaryBtn
                        className="max-w-73 md:w-full cursor-pointer transition-all hover:shadow-lg active:scale-95"
                        onClick={handleReviewClick}
                    >
                        {t('home.reviewYourRequest')}
                    </PrimaryBtn>
                </div>
                <div className="xl:mt-15 md:mt-10 mt-7">
                    {renderAccordionItems()}
                </div>
            </div>
        </section>
    )
}