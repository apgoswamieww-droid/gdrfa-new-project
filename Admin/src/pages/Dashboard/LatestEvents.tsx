import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "./EventCard";
import { Heading } from "../../component/Typography/Typography";
import { getDashboardLatestEventsApi } from "../../api/dashboard.api";
import { formatDate } from "../../utils/dateUtils";
import { EventImg, EventImgTwo, EventImgThree } from "../../assets/images/images";
import { useTranslation } from "../../hooks/useTranslation";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

const getImageUrl = (path?: string) => {
  if (!path) return "";
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
};

const fallbackImages = [EventImg, EventImgTwo, EventImgThree];

const LatestEvents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDashboardLatestEventsApi();
        if (res.status && res.data) {
          setEvents(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e: any) {
        console.warn("Failed to load latest events", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const cardEvents = filtered.map((e, i) => ({
    id: e.id,
    title: e.title,
    img: getImageUrl(e.image) || fallbackImages[i % fallbackImages.length],
    description: e.description || "",
    category: e.targetType === "competitive" ? (t.dashboard?.competitive || "Competitive") : (t.dashboard?.regular || "Regular"),
    date: `${formatDate(e.startDate)} - ${formatDate(e.endDate)}`,
  }));

  return (
    <div className="bg-white 2xl:rounded-2xl rounded-xl">
      <div className="flex sm:flex-row flex-col items-center justify-between sm:gap-3 gap-2 2xl:p-5 p-4">
        <div className="flex flex-row items-center 2xl:gap-3 gap-2 me-auto">
          <Heading variant="h4" className="font-bold text-primary">
            {t.dashboard.latestEvents}
          </Heading>
          <svg width="2" height="12" viewBox="0 0 2 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line opacity="0.31" x1="0.75" y1="0.75" x2="0.749999" y2="11.25" stroke="#364B9B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <button
            onClick={() => navigate("/events")}
            className="xl:text-base/tight text-sm/tight text-secondary font-bold transition-colors hover:text-primary cursor-pointer"
          >
            {t.dashboard.viewAll}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-[#364B9B1A] rounded-full px-4 xl:py-3 py-2 w-full ms-auto 2xl:max-w-[320px] xl:max-w-3xs sm:max-w-44 max-w-54">
          <svg className="xl:w-5 xl:h-5 w-4 h-4" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_7194_77954)">
              <path d="M14.582 14.583L18.332 18.333" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.668 9.16699C16.668 5.02486 13.3101 1.66699 9.16797 1.66699C5.02584 1.66699 1.66797 5.02486 1.66797 9.16699C1.66797 13.3092 5.02584 16.667 9.16797 16.667C13.3101 16.667 16.668 13.3092 16.668 9.16699Z" stroke="#0A2240" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_7194_77954">
                <rect width="20" height="20" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <input
            className="bg-transparent text-sm text-secondary/60 placeholder-secondary/60 outline-none w-full"
            placeholder={t.dashboard?.searchEvents || "Search for Events.."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ps-4 2xl:ps-8 2xl:pb-8 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : cardEvents.length > 0 ? (
          <EventCard events={cardEvents} />
        ) : (
          <p className="text-gray-400 text-sm text-center py-12">{t.dashboard?.noEventsFound || "No events found"}</p>
        )}
      </div>
    </div>
  );
};

export default LatestEvents;