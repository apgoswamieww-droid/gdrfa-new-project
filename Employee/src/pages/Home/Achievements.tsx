import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyEvents, getCertificates } from "../../api/page.api";
import { useAuthStore } from "../../store/store";

import { Navigate, Link } from "react-router-dom";
import { CertificateImg } from "../../assets/images/images";

type ParticipatedEvent = {
  id: string;
  title: string;
  name_ar?: string;
  image: string | null;
  date: string;
  status: "Completed" | "Registered" | "In Progress";
  participantStatus?: string;
  participantWorkflowStatus?: string | null;
  participantCurrentLevel?: string | null;
  participantId?: number | null;
};

type CertDisplay = {
  id: number;
  title: string;
  eventName: string;
  issueDate: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtShort(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return "-";
  const d1 = new Date(start);
  if (!end) return fmtDate(d1);
  const d2 = new Date(end);
  if (d1.toDateString() === d2.toDateString()) return fmtDate(d1);
  return `${fmtShort(d1)} - ${fmtDate(d2)}`;
}

function getEventStatus(start?: string, end?: string): "Completed" | "Registered" | "In Progress" {
  if (!start) return "Registered";
  const now = new Date();
  if (end && new Date(end) < now) return "Completed";
  if (start && new Date(start) > now) return "Registered";
  return "In Progress";
}

function flattenEvents(data: any): ParticipatedEvent[] {
  const list: ParticipatedEvent[] = [];
  for (const year of data) {
    for (const month of year.months) {
      for (const ev of month.events) {
        list.push({
          id: String(ev.id),
          title: ev.name,
          name_ar: ev.name_ar,
          image: ev.image,
          date: formatDateRange(ev.startDate, ev.endDate),
          status: getEventStatus(ev.startDate, ev.endDate),
          participantStatus: ev.participantStatus,
          participantWorkflowStatus: ev.participantWorkflowStatus,
          participantCurrentLevel: ev.participantCurrentLevel,
          participantId: ev.participantId,
        });
      }
    }
  }
  return list;
}

export default function Achievements() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const isLoggedIn = Boolean(token);

  const [events, setEvents] = useState<ParticipatedEvent[]>([]);
  const [certs, setCerts] = useState<CertDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const [evRes, certRes] = await Promise.all([
          getMyEvents(),
          getCertificates(),
        ]);
        if (cancelled) return;
        if (evRes.status) setEvents(flattenEvents(evRes.data || []));
        if (certRes.status) {
          setCerts(
            (certRes.data || []).map((c: any) => ({
              id: c.id,
              title: c.activity_title || "Certificate",
              eventName: c.event_title || "",
              issueDate: c.createdAt ? fmtDate(new Date(c.createdAt)) : "-",
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || t("achievementsPage.failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [t]);

  const totalEvents = events.length;
  const totalCerts = certs.length;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden min-h-screen">
      <AnimatedSportsBackground />

      <section className="relative xl:pt-36 lg:pt-30 pt-24 xl:pb-24 lg:pb-16 pb-10 z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <div className="flex lg:flex-row flex-col lg:items-end justify-between gap-5 mb-12">
            <div className="max-w-170 text-start">
              <span className="inline-flex rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold">
                {t("achievementsPage.eyebrow")}
              </span>
              <h1 className="mt-5 xl:text-5xl md:text-4xl text-3xl font-bold text-secondary">
                {t("achievementsPage.title")}
              </h1>
            </div>
            <p className="text-secondary/60 md:text-base font-medium lg:max-w-105 text-start">
              {t("achievementsPage.subtitle")}
            </p>
          </div>

          {loading && (
            <div className="space-y-12">
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/90 rounded-[32px] p-8 shadow-sm border border-secondary/5 animate-pulse">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-6 w-16 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/90 rounded-[32px] p-8 shadow-sm border border-secondary/5 animate-pulse space-y-4">
                <div className="h-5 w-60 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded-full" />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <span className="text-5xl">😕</span>
              <p className="mt-4 text-secondary/60 text-lg font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Stats Overview */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <StatCard label={t("achievementsPage.totalEvents")} value={totalEvents} icon="🏁" />
                <StatCard label={t("achievementsPage.certificates")} value={totalCerts} icon="🎖️" />
                <StatCard label={t("achievementsPage.eventsAttended")} value={totalEvents} icon="🏆" />
              </div>

              <div className="grid lg:grid-cols-[0.62fr_0.38fr] gap-10 items-start">
                {/* Participated Events Section */}
                <div>
                  <h2 className="text-secondary font-bold text-3xl mb-8 text-start">{t("achievementsPage.participatedEvents")}</h2>
                  {events.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-12 shadow-sm border border-secondary/5 text-center">
                      <span className="text-5xl">🏁</span>
                      <p className="mt-4 text-secondary/60 font-medium">{t("achievementsPage.noEvents")}</p>
                      <Link to="/sport-activity-list" className="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors">
                        {t("achievementsPage.browseEvents")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {events.map((ev) => {
                        const eventTitle = i18n.language === 'ar' ? (ev.name_ar || ev.title) : ev.title;
                        return (
                          <Link
                            to={`/sport-activity-list/${ev.id}`}
                            key={ev.id}
                            className="group bg-white/90 backdrop-blur-sm rounded-[32px] p-4 shadow-sm border border-secondary/5 hover:shadow-xl transition-all duration-300 flex md:flex-row flex-col gap-6 items-center text-start"
                          >
                            <div className="md:w-48 w-full md:h-32 h-48 rounded-2xl overflow-hidden shrink-0 relative">
                              {ev.image ? (
                                <img src={ev.image} alt={eventTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              ) : (
                                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-4xl text-primary/30">🏅</div>
                              )}
                              <div className="absolute top-3 left-3 flex flex-col gap-1">
                                {ev.participantWorkflowStatus === "fully_approved" || ev.participantStatus === "1" ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-green-500 text-white">
                                    {t("achievementsPage.approved") || "Approved"}
                                  </span>
                                ) : ev.participantWorkflowStatus === "rejected" || ev.participantStatus === "2" ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-red-500 text-white">
                                    {t("achievementsPage.rejected") || "Rejected"}
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-amber-500 text-white">
                                      Pending
                                    </span>
                                    {ev.participantCurrentLevel && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/90 text-amber-700 shadow-sm text-center">
                                        {ev.participantCurrentLevel === "section" ? "Section Mgr" :
                                         ev.participantCurrentLevel === "department" ? "Dept Mgr" :
                                         ev.participantCurrentLevel === "admin" ? "Admin" : ev.participantCurrentLevel}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4 w-full">
                              <h3 className="text-secondary font-bold text-xl leading-tight group-hover:text-primary transition-colors truncate">{eventTitle}</h3>
                              <div className="flex flex-wrap gap-y-2 gap-x-6 mt-4">
                                <div className="flex items-center gap-2 text-secondary/50 text-xs font-bold uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                                  {t("achievementsPage.date")}: <span className="text-secondary">{ev.date}</span>
                                </div>
                              </div>
                              {(ev.participantStatus === "0" || ev.participantWorkflowStatus === "in_progress") && (
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                                  <span className={ev.participantCurrentLevel === "section" || !ev.participantCurrentLevel ? "text-amber-600 font-semibold" : "text-gray-300"}>Section</span>
                                  <span className="text-gray-300">→</span>
                                  <span className={ev.participantCurrentLevel === "department" ? "text-amber-600 font-semibold" : "text-gray-300"}>Dept</span>
                                  <span className="text-gray-300">→</span>
                                  <span className={ev.participantCurrentLevel === "admin" ? "text-amber-600 font-semibold" : "text-gray-300"}>Admin</span>
                                </div>
                              )}
                            </div>
                            <div className="md:block hidden">
                              <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <ArrowIconSmall />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Certificates Section */}
                <div className="sticky top-24">
                  <h2 className="text-secondary font-bold text-3xl mb-8 text-start">{t("achievementsPage.myCertificates")}</h2>
                  {certs.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-secondary/5 text-center">
                      <span className="text-5xl">📜</span>
                      <p className="mt-4 text-secondary/60 font-medium">{t("achievementsPage.noCertificates")}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {certs.map((cert) => (
                        <div
                          key={cert.id}
                          className="bg-white/90 backdrop-blur-sm rounded-[32px] p-5 shadow-sm border border-secondary/5 flex gap-5 items-center text-start transition-all hover:bg-white"
                        >
                          <div className="min-w-24 w-24 h-24 rounded-2xl overflow-hidden border border-secondary/10 bg-secondary/5 relative group">
                            <img src={CertificateImg} alt="cert" className="w-full h-full object-cover p-2" />
                            <div className="absolute inset-0 bg-secondary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ViewIcon />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-secondary font-bold text-base leading-tight mb-1 truncate">{cert.title}</h4>
                            <p className="text-secondary/50 text-xs font-medium mb-1 truncate">{cert.eventName}</p>
                            <p className="text-[10px] text-secondary/40 font-medium">{cert.issueDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-8 shadow-lg border border-secondary/5 text-start flex items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shadow-inner">
        {icon}
      </div>
      <div>
        <span className="text-xs text-secondary/40 font-bold uppercase tracking-wider block mb-1">{label}</span>
        <strong className="text-3xl text-secondary font-bold">{value}</strong>
      </div>
    </div>
  );
}

function AnimatedSportsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {["🥇", "🏆", "🎖️", "⭐", "🚀", "💪"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${5 + index * 18}%`,
            top: `${10 + (index % 4) * 22}%`,
            animationDelay: `${index * 700}ms`,
            animationDuration: `${8 + index}s`
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

function ViewIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
