import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowIcon } from "../SportsEvents/SportsEventList";
import { getFacilities } from "../../api/page.api";
import { slugify } from "../../utils/slug";
import { SportsActivitiesOne } from "../../assets/images/images";
import Toast from "../../components/ui/Toast";

export default function FacilitiesList() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [facilities, setFacilities] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    (location.state as { toast?: { message: string; type: "success" | "error" } })?.toast || null
  );

  useEffect(() => {
    if (toast) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await getFacilities();
        if (!cancelled) setFacilities(resp.data || []);
      } catch {
        if (!cancelled) setFacilities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-[#F7FAFD] min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-341.5 mx-auto md:px-7 px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-[40px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden min-h-screen">
      <AnimatedFacilitiesBackground />

      <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <div className="flex lg:flex-row flex-col lg:items-end justify-between gap-5 mb-16">
            <div className="max-w-170 text-start">
              <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold mb-5">
                {t("facilities.eyebrow")}
              </span>
              <h1 className="xl:text-6xl md:text-5xl text-4xl font-bold text-secondary leading-tight">
                {t("facilities.title")}
              </h1>
            </div>
            <p className="text-secondary/60 md:text-lg font-medium lg:max-w-105 text-start">
              {t("facilities.subtitle")}
            </p>
          </div>

          {facilities.length === 0 ? (
            <p className="text-center text-secondary/40 font-medium py-20">{t("facilities.noFacilities")}</p>
          ) : (
            <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
              {facilities.map((facility: any) => {
                const slug = slugify(facility.title);
                const facilityTitle = i18n.language === 'ar' ? (facility.title_ar || facility.title) : facility.title;
                return (
                  <Link
                    key={facility.id}
                    to={`/facilities/${slug}`}
                    className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full border border-secondary/5"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={facility.image || SportsActivitiesOne}
                        alt={facilityTitle}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,34,64,0)_0%,rgba(10,34,64,0.4)_100%)]" />
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="bg-white/90 backdrop-blur-md text-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg">
                          {t("facilities.bookNow")}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1 text-start">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] text-secondary/40 font-bold uppercase tracking-[0.2em]">{t("facilities.availableForBooking")}</span>
                      </div>

                      <h3 className="text-secondary font-bold text-xl mb-4 group-hover:text-primary transition-colors leading-tight">
                        {facilityTitle}
                      </h3>

                      <p className="text-secondary/60 text-sm font-medium mb-6 line-clamp-3 flex-1">
                        {i18n.language === 'ar' ? (facility.description_ar || facility.description) : facility.description}
                      </p>

                      <div className="pt-6 border-t border-secondary/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="text-xs text-secondary font-bold truncate max-w-40">{facility.title.split('–').pop()?.trim()?.split(',')[0] || 'GDRFA'}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-secondary/5 text-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowIcon />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function AnimatedFacilitiesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {["🏢", "🏟️", "🏗️", "📐", "📍", "🔑"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${5 + index * 17}%`,
            top: `${12 + (index % 4) * 23}%`,
            animationDelay: `${index * 800}ms`,
            animationDuration: `${9 + index}s`
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}
