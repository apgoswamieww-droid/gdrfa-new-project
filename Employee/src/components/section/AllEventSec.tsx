import { useEffect, useState, useMemo } from "react";
import { getHomeEvents, getMyEvents } from "../../api/page.api";
import { useAuthStore } from "../../store/store";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AllEventSec() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'allEvent' | 'myEvent'>('allEvent');
  const [allYearData, setAllYearData] = useState<any>([]);
  const [myYearData, setMyYearData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>("");

  const monthsArray = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const translatedMonths: Record<string, string> = {
    'January': t('home.january'),
    'February': t('home.february'),
    'March': t('home.march'),
    'April': t('home.april'),
    'May': t('home.may'),
    'June': t('home.june'),
    'July': t('home.july'),
    'August': t('home.august'),
    'September': t('home.september'),
    'October': t('home.october'),
    'November': t('home.november'),
    'December': t('home.december')
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allRes = await getHomeEvents();
        if (allRes.status && allRes.data) {
          setAllYearData(allRes.data);

          // Set initial active year from all data
          if (allRes.data.length > 0) {
            const latestYear = allRes.data[allRes.data.length - 1];
            setActiveYear(latestYear.year);

            // Set initial active month (first month with events or current month)
            const currentMonthName = monthsArray[new Date().getMonth()];
            const monthWithEvents = latestYear.months.find((m: any) => m.events.length > 0);
            setActiveMonth(monthWithEvents?.name || currentMonthName);
          }
        }

        if (token) {
          const myRes = await getMyEvents();
          if (myRes.status && myRes.data) {
            setMyYearData(myRes.data);
          }
        } else {
          setMyYearData([]);
          if (activeTab === 'myEvent') {
            setActiveTab('allEvent');
          }
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Handle tab switching and year/month synchronization
  useEffect(() => {
    const source = activeTab === 'allEvent' ? allYearData : myYearData;
    if (source.length > 0) {
      // If current active year is not in the current source, switch to a valid year
      if (!activeYear || !source.some((y: any) => y.year === activeYear)) {
        // Try to find a year that has events
        const yearWithEvents = [...source].reverse().find(y => y.months.some((m: any) => m.events.length > 0));
        const targetYear = yearWithEvents ? yearWithEvents.year : source[source.length - 1].year;

        setActiveYear(targetYear);

        const yearData = source.find((y: any) => y.year === targetYear);
        if (yearData) {
          const monthWithEvents = yearData.months.find((m: any) => m.events.length > 0);
          if (monthWithEvents) {
            setActiveMonth(monthWithEvents.name);
          }
        }
      } else {
        // Year exists in source, check if current month has events, if not try to find one that does
        const yearData = source.find((y: any) => y.year === activeYear);
        if (yearData) {
          const currentMonthData = yearData.months.find((m: any) => m.name === activeMonth);
          if (!currentMonthData || currentMonthData.events.length === 0) {
            const monthWithEvents = yearData.months.find((m: any) => m.events.length > 0);
            if (monthWithEvents) {
              setActiveMonth(monthWithEvents.name);
            }
          }
        }
      }
    }
  }, [activeTab, allYearData, myYearData]);

  const currentYearData = useMemo(() => {
    const source = activeTab === 'allEvent' ? allYearData : myYearData;
    return source.find((y: any) => y.year === activeYear) || null;
  }, [activeTab, allYearData, myYearData, activeYear]);

  const years = useMemo(() => {
    const source = activeTab === 'allEvent' ? allYearData : myYearData;
    return source.map((y: any) => y.year).sort((a: any, b: any) => b - a);
  }, [activeTab, allYearData, myYearData]);

  const displayedEvents = useMemo(() => {
    if (!currentYearData) return [];
    const monthData = currentYearData.months.find((m: any) => m.name === activeMonth);
    return monthData?.events || [];
  }, [currentYearData, activeMonth]);

  const handleYearChange = (year: number) => {
    setActiveYear(year);
    // When year changes, try to keep the same month, or pick first month with events
    const newYearData = (activeTab === 'allEvent' ? allYearData : myYearData).find((y: any) => y.year === year);
    if (newYearData) {
      const hasCurrentMonth = newYearData.months.some((m: any) => m.name === activeMonth && m.events.length > 0);
      if (!hasCurrentMonth) {
        const firstWithEvents = newYearData.months.find((m: any) => m.events.length > 0);
        if (firstWithEvents) setActiveMonth(firstWithEvents.name);
      }
    }
  };

  const formatDate = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = s.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-US', options);
    const endStr = e.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-US', options);
    const year = s.getFullYear();
    return `${startStr} - ${endStr} ${year}`;
  };

  return (
    <section className="">
      <div className="max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="flex xl:gap-5 gap-3 md:items-center sm:items-end justify-between sm:flex-row flex-col">
          <h2 className="md:text-[40px]/tight text-2xl/tight font-bold text-primary sm:hidden block max-sm:order-1">
            {t("home.sportsEventPrograms")}
          </h2>
          <div className="flex xl:gap-4 gap-3 items-center max-sm:order-3">
            <button
              onClick={() => setActiveTab("allEvent")}
              className={`xl:text-2xl/tight text-lg/tight text-primary text-nowrap hover:opacity-100 cursor-pointer ${activeTab === "allEvent" ? "opacity-100 font-bold" : "opacity-60 font-semibold"}`}
            >
              {t("home.allEvents")}
            </button>
            {token && (
              <>
                <span className="font-semibold">/</span>
                <button
                  onClick={() => setActiveTab("myEvent")}
                  className={`xl:text-2xl/tight text-lg/tight text-primary text-nowrap hover:opacity-100 cursor-pointer ${activeTab === "myEvent" ? "opacity-100 font-bold" : "opacity-60 font-semibold"}`}
                >
                  {t("home.myEvents")}
                </button>
              </>
            )}
          </div>
          <p className="text-base/tight font-medium opacity-60 sm:text-end sm:max-w-100 max-sm:order-2">
            {t("home.eventSubtitle")}
          </p>
        </div>
        <div className="xl:mt-15 md:mt-8 sm:mt-5 mt-2">
          <div className="flex lg:gap-6 gap-3 sm:items-center justify-end sm:flex-row flex-col">
            <h2 className="md:text-[40px]/tight text-2xl/tight font-bold text-primary sm:block hidden">
              {t("home.sportsEventPrograms")}
            </h2>

            {/* Mobile Year Selector */}
            <div className="lg:w-28 sm:w-20 w-full sm:hidden flex sm:flex-col xl:gap-6 gap-3 items-start overflow-x-auto sm:pb-0 pb-0.5">
              {years.map((year: any, index: any) => (
                <div key={year} className="">
                  <button
                    onClick={() => handleYearChange(year)}
                    className={`group flex xl:gap-6 sm:gap-3 items-center sm:flex-row flex-col cursor-pointer duration-300 hover:text-primary hover:opacity-100 ${activeYear === year ? "text-primary opacity-100 font-bold lg:text-2xl/tight sm:text-lg/tight text-base/tight" : "lg:text-lg/tight text-base/tight font-medium text-secondary opacity-60"}`}
                  >
                    {year}
                    <span
                      className={`transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 sm:rotate-0 rotate-90 ${activeYear === year ? "sm:translate-x-0 max-sm:translate-y-0 opacity-100" : "sm:-translate-x-3 max-sm:-translate-y-1 opacity-0"}`}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 9V15"
                          stroke="#141B34"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.7236 14.9351L16.0046 17.3928C13.8559 19.335 12.7816 20.3061 11.8908 19.9143C11 19.5225 11 18.0788 11 15.1915V15H10C8.5858 15 7.8787 15 7.4393 14.5607C7 14.1213 7 13.4142 7 12C7 10.5858 7 9.87868 7.4393 9.43934C7.8787 9 8.5858 9 10 9H11V8.80852C11 5.92117 11 4.47749 11.8908 4.08568C12.7816 3.69387 13.8559 4.66499 16.0046 6.60723L18.7236 9.06495C20.2412 10.4367 21 11.1226 21 12C21 12.8774 20.2412 13.5633 18.7236 14.9351Z"
                          fill="#7A2530"
                        />
                      </svg>
                    </span>
                  </button>
                  {index !== years.length - 1 && (
                    <span className="xl:mt-6 mt-3 sm:block hidden">
                      <svg
                        width="11"
                        height="1"
                        viewBox="0 0 11 1"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          opacity="0.4"
                          d="M0.5 0.5L10.5 0.5"
                          stroke="#161616"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative text-end">
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="md:rounded-[14px] rounded-lg md:py-2.5 py-1.5 ps-3.5 md:pe-9 pe-8 appearance-none bg-secondary text-white focus-within:outline-none md:text-lg/tight text-base/tight font-bold cursor-pointer"
              >
                {monthsArray.map((month) => (
                  <option key={month} value={month}>
                    {translatedMonths[month] || month}
                  </option>
                ))}
              </select>
              <span className="lg:w-6 w-5 absolute top-1/2 -translate-y-1/2 inset-e-2.5 pointer-events-none">
                <svg
                  className="lg:w-6 w-5 h-auto"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="flex xl:gap-15 md:gap-5 gap-3 xl:mt-15 md:mt-8 mt-5 sm:flex-row flex-col">
            {/* Desktop Year Selector */}
            <div className="lg:w-28 sm:w-20 xl:-mt-32 w-full sm:flex hidden sm:flex-col xl:gap-6 gap-3 items-start overflow-x-auto sm:pb-0 pb-0.5">
              {years.map((year: any, index: any) => (
                <div key={year} className="">
                  <button
                    onClick={() => handleYearChange(year)}
                    className={`group flex xl:gap-5 sm:gap-2 items-center sm:flex-row flex-col cursor-pointer duration-300 hover:text-primary hover:opacity-100 ${activeYear === year ? "text-primary opacity-100 font-bold lg:text-2xl/tight sm:text-lg/tight text-base/tight" : "lg:text-lg/tight text-base/tight font-medium text-secondary opacity-60"}`}
                  >
                    {year}
                    <span
                      className={`rtl:-scale-x-100 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 sm:rotate-0 rotate-90 ${activeYear === year ? "sm:translate-x-0 rtl:sm:-translate-x-100 max-sm:translate-y-0 opacity-100" : "sm:-translate-x-3 rtl:sm:translate-x-3 max-sm:-translate-y-1 opacity-0"}`}
                    >
                      <svg
                        className="lg:w-6 w-5 h-auto"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 9V15"
                          stroke="#141B34"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.7236 14.9351L16.0046 17.3928C13.8559 19.335 12.7816 20.3061 11.8908 19.9143C11 19.5225 11 18.0788 11 15.1915V15H10C8.5858 15 7.8787 15 7.4393 14.5607C7 14.1213 7 13.4142 7 12C7 10.5858 7 9.87868 7.4393 9.43934C7.8787 9 8.5858 9 10 9H11V8.80852C11 5.92117 11 4.47749 11.8908 4.08568C12.7816 3.69387 13.8559 4.66499 16.0046 6.60723L18.7236 9.06495C20.2412 10.4367 21 11.1226 21 12C21 12.8774 20.2412 13.5633 18.7236 14.9351Z"
                          fill="#7A2530"
                        />
                      </svg>
                    </span>
                  </button>
                  {index !== years.length - 1 && (
                    <span className="xl:mt-6 mt-3 sm:block hidden">
                      <svg
                        width="11"
                        height="1"
                        viewBox="0 0 11 1"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          opacity="0.4"
                          d="M0.5 0.5L10.5 0.5"
                          stroke="#161616"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="lg:w-[calc(100%-112px)] sm:w-[calc(100%-80px)] w-full grid lg:grid-cols-3 xs:grid-cols-2 grid-cols-1 xl:gap-x-6 gap-x-4 xl:gap-y-6 xs:gap-y-4 gap-y-6 min-h-[400px]">
              {loading ? (
                <div className="col-span-full flex justify-center items-center">
                  <p className="text-lg font-semibold opacity-60">
                    {t("home.loadingEvents")}
                  </p>
                </div>
              ) : displayedEvents.length > 0 ? (
                displayedEvents.map((item: any) => (
                  <Link to={`/sport-activity-list/${item.id}`}>
                    <div key={item.id} className="flex flex-col">
                      <div className="lg:rounded-3xl rounded-2xl lg:h-100 sm:h-72 xs:h-52 h-60 overflow-hidden bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)] p-[0.2px] relative">
                        <div className="lg:rounded-3xl rounded-2xl h-full overflow-hidden">
                          <img
                            src={item.image || ""}
                            alt={i18n.language === 'ar' ? item.name_ar || item.name : item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="md:p-2 p-1 flex flex-col justify-between absolute inset-0 z-20 items-start bg-[linear-gradient(360deg,#2E0006_0%,rgba(148,1,20,0)_100%)]">
                          <span className="inline-block rounded-full text-primary md:text-xs/tight text-[10px]/tight font-semibold lg:py-1.5 py-1 lg:px-3.5 px-2.5 bg-white lg:m-1.5">
                            {item.targetType === "competitive"
                              ? t("home.team")
                              : t("home.individual")}
                          </span>
                          <div className="w-full lg:rounded-2xl rounded-xl bg-white/70 border border-white xl:p-[18px] lg:p-3.5 p-2.5 lg:min-h-28 xs:min-h-24 flex flex-col justify-between backdrop-blur-[2px]">
                            <h5 className="font-bold lg:text-lg/tight text-base/tight text-secondary lg:mb-3 mb-2 line-clamp-2">
                              {item.name && (i18n.language === 'ar' ? item.name_ar || item.name : item.name)}

                            </h5>
                            <span className="flex lg:gap-1.5 gap-1 lg:text-sm/tight text-xs/tight font-medium text-secondary items-center">
                              <span>
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 1.5V4.5M6 1.5V4.5"
                                    stroke="#161616"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M15.75 9C15.75 6.17157 15.75 4.75736 14.8713 3.87868C13.9927 3 12.5784 3 9.75 3H8.25C5.42157 3 4.00736 3 3.12868 3.87868C2.25 4.75736 2.25 6.17157 2.25 9V10.5C2.25 13.3284 2.25 14.7427 3.12868 15.6213C4.00736 16.5 5.42157 16.5 8.25 16.5"
                                    stroke="#161616"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M2.25 7.5H15.75"
                                    stroke="#161616"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M13.7003 14.0258L12.75 13.5V12.2001M15.75 13.5C15.75 15.1568 14.4068 16.5 12.75 16.5C11.0932 16.5 9.75 15.1568 9.75 13.5C9.75 11.8432 11.0932 10.5 12.75 10.5C14.4068 10.5 15.75 11.8432 15.75 13.5Z"
                                    stroke="#7A2530"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              {formatDate(item.startDate, item.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="xl:mt-6 mt-2.5 lg:px-3.5 px-2.5 flex xl:gap-5 gap-2 items-center">
                        <p className="md:text-sm/tight text-xs/tight font-medium opacity-60 text-secondary line-clamp-3 flex-1">
                          {i18n.language === 'ar' ? item.eventDescription_ar || item.eventDescription : item.eventDescription}
                        </p>
                        <Link
                          to={`/sport-activity-list/${item.id}`}
                          className="group xl:min-w-10 xl:w-10 min-w-7 w-7 text-white hover:text-primary aspect-square border border-primary rounded-full bg-primary transition-all duration-300 hover:bg-transparent flex justify-center items-center shrink-0"
                        >
                          <svg
                            className="group-hover:-rotate-45 transition-transform duration-300 ease-in-out rtl:-scale-x-100 xl:w-6 w-5 h-auto"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M17 7L6 18"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M11 6.13153C11 6.13153 16.6335 5.65664 17.4885 6.51155C18.3434 7.36647 17.8684 13 17.8684 13"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full flex flex-col justify-center items-center opacity-40 py-10">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <p className="mt-4 text-lg font-medium">
                    {t("home.noEventsFound")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}