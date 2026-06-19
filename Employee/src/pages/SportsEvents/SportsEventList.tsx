import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSportEvents } from "../../api/page.api";
import { useTranslation } from "react-i18next";

export default function SportsEventList() {
  const { t, i18n } = useTranslation();
  const [activeStatus, setActiveStatus] = useState("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const statusTabs = [
    { label: t("sportsEvents.all"), value: "all" },
    { label: t("sportsEvents.ongoing"), value: "ongoing" },
    { label: t("sportsEvents.upcoming"), value: "upcoming" },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await getSportEvents(activeStatus);
        if (response.status && response.data) {
          setEvents(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch sport events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [activeStatus]);

  const formatDate = (start: string | null, end: string | null) => {
    if (!start) return t("sportsEvents.tba");
    const s = new Date(start);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = s.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-US', options);
    if (!end) return startStr;
    const e = new Date(end);
    const endStr = e.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-US', options);
    return `${startStr} - ${endStr}`;
  };

  return (
    <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_44%,#F7FAFD_100%)]">
      <AnimatedSportsBackground />

      <div className="relative max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="flex lg:flex-row flex-col lg:items-end justify-between gap-5">
          <div className="max-w-170 text-start">
            <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold">
              {t("sportsEvents.eyebrow")}
            </span>
            <h1 className="mt-5 xl:text-[64px]/[0.98] md:text-5xl/tight text-4xl/tight font-bold text-secondary">
              {t("sportsEvents.title")}
            </h1>
          </div>
          <div className="flex flex-col lg:items-end gap-6">
            <p className="text-secondary/60 md:text-base/tight text-sm/tight font-medium lg:max-w-105 lg:text-end text-start">
              {t("sportsEvents.subtitle")}
            </p>

            {/* Status Tabs */}
            <ul className="p-1 rounded-2xl border border-secondary flex gap-1 overflow-x-auto">
              {statusTabs.map((tab) => (
                <li key={tab.value} className="xl:min-w-[140px] md:min-w-[120px] min-w-auto">
                  <button
                    className={`rounded-2xl whitespace-nowrap font-bold sm:px-4 px-2.5 sm:py-1 py-0.5 p-1 lg:min-h-[50px] min-h-[40px] block w-full cursor-pointer transition-all ${activeStatus === tab.value
                      ? "text-white bg-primary"
                      : "text-secondary hover:text-white hover:bg-primary"
                      }`}
                    onClick={() => setActiveStatus(tab.value)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="xl:mt-12 mt-8 grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 xl:gap-6 gap-5 min-h-[400px]">
          {loading ? (
            <div className="col-span-full flex justify-center items-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : events.length > 0 ? (
            events.map((event: any) => (
              <Link
                to={`/sport-activity-list/${event.id}`}>
                <article key={event.id} className="group flex flex-col" >
                  <div className="lg:rounded-3xl rounded-2xl lg:h-100 sm:h-78 h-68 overflow-hidden bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)] p-[0.2px] relative shadow-[0_22px_70px_rgba(10,34,64,0.12)]">
                    <div className="lg:rounded-3xl rounded-2xl h-full overflow-hidden">
                      <img src={event.image || ""} alt={i18n.language === 'ar' ? event.name_ar || event.name : event.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="md:p-2 p-1 flex flex-col justify-between absolute inset-0 z-20 items-start bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)]">
                      <div className="flex gap-2 flex-wrap">
                        <span className="inline-block rounded-full text-primary md:text-xs/tight text-[10px]/tight font-semibold lg:py-1.5 py-1 lg:px-3.5 px-2.5 bg-white lg:m-1.5">
                          {event.targetType === 2 || event.targetType === "2" ? t("sportsEvents.team") : t("sportsEvents.individual")}
                        </span>
                        <span className="inline-block rounded-full text-white md:text-xs/tight text-[10px]/tight font-semibold lg:py-1.5 py-1 lg:px-3.5 px-2.5 bg-primary lg:m-1.5">
                          {t("sportsEvents.sports")}
                        </span>
                      </div>
                      <div className="w-full lg:rounded-2xl rounded-xl bg-white/75 border border-white xl:p-[18px] lg:p-3.5 p-3 lg:min-h-32 flex flex-col justify-between backdrop-blur-[3px] text-start">
                        <h2 className="font-bold lg:text-lg/tight text-base/tight text-secondary lg:mb-3 mb-2 line-clamp-2">{i18n.language === 'ar' ? event.name_ar || event.name : event.name}</h2>
                        <span className="flex lg:gap-1.5 gap-1 lg:text-sm/tight text-xs/tight font-medium text-secondary">
                          <CalendarIcon />
                          {formatDate(event.startDate, event.endDate)}
                        </span>
                        <span className="mt-2 flex lg:gap-1.5 gap-1 lg:text-sm/tight text-xs/tight font-medium text-secondary/70">
                          <LocationIcon />
                          {event.location || t("sportsEvents.onlineTba")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="xl:mt-5 mt-3 lg:px-3.5 px-2.5 flex xl:gap-5 gap-2 items-center text-start">
                    <p className="md:text-sm/tight text-xs/tight font-medium opacity-60 text-secondary line-clamp-3 flex-1">{i18n.language === 'ar' ? event.eventDescription_ar || event.eventDescription : event.eventDescription}</p>
                    <Link
                      to={`/sport-activity-list/${event.id}`}
                      className="group/link xl:min-w-10 xl:w-10 min-w-8 w-8 text-white hover:text-primary aspect-square border border-primary rounded-full bg-primary transition-all duration-300 hover:bg-transparent flex justify-center items-center"
                      aria-label={i18n.language === 'ar' ? `View ${event.name_ar || event.name}` : `View ${event.name}`}
                    >
                      <ArrowIcon />
                    </Link>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col justify-center items-center opacity-40 py-20">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p className="mt-4 text-xl font-bold text-secondary">{t("sportsEvents.noEvents")}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AnimatedSportsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {["⚽", "🏃", "🚴", "🏊", "🏆", "⏱"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${8 + index * 16}%`,
            top: `${18 + (index % 3) * 23}%`,
            animationDelay: `${index * 600}ms`,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

export function CalendarIcon() {
  return (
    <svg className="min-w-4 w-4 h-4" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M12 1.5V4.5M6 1.5V4.5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.25 7.5H15.75" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.75 9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5H9.75" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="min-w-4 w-4 h-4" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 13.5C13.6569 13.5 15 12.1569 15 10.5C15 8.84315 13.6569 7.5 12 7.5C10.3431 7.5 9 8.84315 9 10.5C9 12.1569 10.3431 13.5 12 13.5Z" stroke="#7A2530" strokeWidth="1.5" />
      <path d="M19.5 10.5C19.5 17 12 21.5 12 21.5C12 21.5 4.5 17 4.5 10.5C4.5 6.35786 7.85786 3 12 3C16.1421 3 19.5 6.35786 19.5 10.5Z" stroke="#161616" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg className="group-hover/link:-rotate-45 transition-transform duration-300 ease-in-out rtl:-scale-x-100 xl:w-6 w-5 h-auto" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17 7L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 6.13153C11 6.13153 16.6335 5.65664 17.4885 6.51155C18.3434 7.36647 17.8684 13 17.8684 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
