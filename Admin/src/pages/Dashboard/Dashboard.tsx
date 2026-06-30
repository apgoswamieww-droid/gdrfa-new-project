import { useState, useEffect } from "react";
import HeroBanner from "./HeroBanner";
import ProfileCard from "./ProfileCard";
import StatCard from "./StatCard";
import LatestEvents from "./LatestEvents";
import ParticipantsPanel from "./ParticipantsPanel";
import { getDashboardStatsApi } from "../../api/dashboard.api";
import { useTranslation } from "../../hooks/useTranslation";
import type { IconType } from "./StatCard";

const Dashboard = () => {
  const { t } = useTranslation();
  
  // ─── Fallback Data ────────────────────────────────────────────────────
  const FALLBACK_STATS: { key: string; label: string; value: string; icon: IconType; bg: string }[] = [
    { key: "users", label: t.dashboard.totalEmployees, value: "—", icon: "users", bg: "bg-rose-50" },
    { key: "events", label: t.dashboard.totalParticipants, value: "—", icon: "events", bg: "bg-blue-50" },
    { key: "request", label: t.dashboard.totalEvents, value: "—", icon: "request", bg: "bg-gray-100" },
  ];

  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        const result = await getDashboardStatsApi();

        if (cancelled) return;

        if (result?.data) {
          const d = result.data;
          setStats([
            { key: "users", label: t.dashboard.totalEmployees, value: String(d.totalEmployees ?? "—"), icon: "users", bg: "bg-rose-50" },
            { key: "events", label: t.dashboard.totalParticipants, value: String(d.totalParticipants ?? "—"), icon: "events", bg: "bg-blue-50" },
            { key: "request", label: t.dashboard.totalEvents, value: String(d.totalEvents ?? "—"), icon: "request", bg: "bg-gray-100" },
          ]);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Dashboard API warning:", e);
          // Fallback data is already set in initialState
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { cancelled = true; };
  }, [t.dashboard.totalEmployees, t.dashboard.totalParticipants, t.dashboard.totalEvents]);

  return (
    <>
      <div className="2xl:space-y-6 md:space-y-4 space-y-3">
        <div className="grid 2xl:grid-cols-9 sm:grid-cols-8 grid-cols-1 xl:gap-4 gap-3">
          <div className="2xl:col-span-6 sm:col-span-5">
            <HeroBanner />
          </div>
          <div className="2xl:col-span-3 sm:col-span-3">
            <ProfileCard />
          </div>
        </div>
        <div className="grid 2xl:grid-cols-9 md:grid-cols-8 grid-cols-1 xl:gap-4 gap-3">
          {/* Stats */}
          <div className="2xl:col-span-6 md:col-span-5 flex flex-col 2xl:space-y-6 md:space-y-4 space-y-3">
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 xl:gap-3 gap-3">
              {stats.map((stat) => (
                <StatCard
                  key={stat.key}
                  label={stat.label}
                  value={loading ? "..." : stat.value}
                  icon={stat.icon}
                  bg={stat.bg}
                />
              ))}
            </div>
            {/* Events + right panel */}
            <div className="flex-1 min-w-0">
              <LatestEvents />
            </div>
          </div>
          <div className="2xl:col-span-3 md:col-span-3 flex flex-col gap-4">
            <ParticipantsPanel />
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
