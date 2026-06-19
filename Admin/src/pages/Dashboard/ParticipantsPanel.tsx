import { useState, useEffect } from "react";
import { Heading, Text } from "../../component/Typography/Typography";
import { getDashboardLatestParticipantsApi } from "../../api/dashboard.api";
import { useTranslation } from "../../hooks/useTranslation";

const ParticipantRow = ({ p }: { p: any }) => (
  <div className="flex items-start 2xl:gap-3.5 xl:gap-3 gap-2 group">
    <div className="2xl:w-16 xl:w-12 w-10 2xl:h-16 xl:h-12 h-10 rounded-full bg-[#364B9B1F] flex items-center justify-center shrink-0 transition-colors">
      <svg
        className="2xl:w-8 xl:w-6 w-5 2xl:h-8 xl:h-6 h-5"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.3346 14.6663C21.3346 11.7208 18.9468 9.33301 16.0013 9.33301C13.0558 9.33301 10.668 11.7208 10.668 14.6663C10.668 17.6118 13.0558 19.9997 16.0013 19.9997C18.9468 19.9997 21.3346 17.6118 21.3346 14.6663Z"
          stroke="#141B34"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.75904 20C5.85147 18.4311 5.33203 16.6095 5.33203 14.6667C5.33203 14.6667 5.33203 14.6667 5.33203 14.6667C5.33203 8.77563 10.1077 4 15.9987 4C21.8898 4 26.6654 8.77563 26.6654 14.6667C26.6654 16.6095 26.1459 18.4311 25.2383 20"
          stroke="#141B34"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 28C24 23.5817 20.4183 20 16 20C11.5817 20 8 23.5817 8 28"
          stroke="#141B34"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="flex-1 w-full">
      <Text variant="textBase" className="font-bold text-black xl:mb-1.5 mb-1">
        {p.name}
      </Text>
      <div className="flex xl:flex-row flex-col xl:justify-between justify-start items-center xl:gap-2 gap-1 w-full">
        <div className="flex flex-col xl:w-fit w-full">
          <Text variant="textSm" className="font-medium text-black/60">
            {p.mobile}
          </Text>
          <Text variant="textSm" className="font-medium text-black/60 truncate">
            {p.email}
          </Text>
        </div>
        <Text variant="textXs" className="shrink-0 font-bold bg-[#E7D2D2] text-primary px-2.5 py-1.5 rounded-full xl:ms-auto xl:me-[unset] me-auto">
          {p.activityType}
        </Text>
      </div>
    </div>
  </div>
);

const ShimmerRow = () => (
  <div className="flex items-start 2xl:gap-3.5 xl:gap-3 gap-2 animate-pulse">
    <div className="2xl:w-16 xl:w-12 w-10 2xl:h-16 xl:h-12 h-10 rounded-full bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

const ParticipantsPanel = () => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchParticipants() {
      try {
        const res = await getDashboardLatestParticipantsApi();
        if (!cancelled && res?.data) {
          setParticipants(res.data);
        }
      } catch (e) {
        if (!cancelled) console.warn("Failed to fetch latest participants:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchParticipants();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white 2xl:rounded-2xl rounded-xl p-4 2xl:p-4 w-full h-full flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <Heading variant="h4" className="font-bold text-primary whitespace-nowrap">
          {t.dashboard?.latestParticipants || "Latest Participants"}
        </Heading>
        <button className="xl:text-base/tight text-sm/tight text-secondary font-bold transition-colors whitespace-nowrap">
          {t.dashboard.viewAll}
        </button>
      </div>
      <div className="h-0.5 2xl:my-4 my-4 bg-[linear-gradient(90deg,#364b9b1f_0%,#FFFFFF_100%)]"></div>

      <div className="xl:space-y-6 space-y-4 max-h-110 overflow-auto custom-scrollbar pe-1 flex-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ShimmerRow key={i} />)
          : participants.map((p) => <ParticipantRow key={p.id} p={p} />)}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
