import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";
import { Navigate, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AvtarImage } from "../../assets/images/images";
import { useAuthStore } from "../../store/store";
import { getMyFacilityRequests, uploadProfileImage, getProfileImage, getMyFitnessEvaluations } from "../../api/page.api";
import { getNotifications, getUnreadCount } from "../../api/notification.api";
import { getProfileApi } from "../../api/auth.api";

type DetailItem = {
  label: string;
  value: string;
};

const fallbackProfile = {
  name: "GDRFA Sports Member",
  username: "gdrfa.member",
  email: "member@gdrfa.ae",
  mobile: "+971 50 000 0000",
  gender: "Not specified",
  age: "28",
  rank: "Officer",
  jobTitle: "Sports Coordinator",
  sector: "Corporate Support Sector",
  department: "Employee Wellness Department",
  section: "Sports Activities Section",
  branch: "Dubai",
  workSystem: "Full time",
  latestEvaluationDate: "21 Apr 2025",
  totalPoints: "86",
};

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLElement>(null);
  const requestsRef = useRef<HTMLElement>(null);
  const { user, token, accessToken, setUser, removeAll } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const authToken = token || accessToken;

  const isLoggedIn = Boolean(authToken);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "notifications") {
      window.setTimeout(() => {
        notificationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else if (view === "requests") {
      window.setTimeout(() => {
        requestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [searchParams]);

  const [facilityRequests, setFacilityRequests] = useState<any>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [notificationsList, setNotificationsList] = useState<any>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [evaluationsLoading, setEvaluationsLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const fetchAll = async () => {
      try {
        // Fetch full profile data from CIAM to enrich user details
        const profileResp = await getProfileApi();
        if (!cancelled && profileResp.status && profileResp.data) {
          // Read current user directly from store to avoid stale closure
          const currentUser = useAuthStore.getState().user || {};
          // Merge the full CIAM profile data into the auth store
          // Use data objects (sectorData, departmentData, etc.) for display names
          setUser({
            ...currentUser,
            mobile: profileResp.data.mobile || currentUser.mobile,
            gender: profileResp.data.gender || currentUser.gender,
            age: profileResp.data.age || currentUser.age,
            dob: profileResp.data.dob || currentUser.dob,
            jobTitle: profileResp.data.jobTitleData?.name || profileResp.data.jobTitle || currentUser.jobTitle,
            rank: profileResp.data.rankData || currentUser.rank,
            sector: profileResp.data.sectorData || currentUser.sector,
            department: profileResp.data.departmentData || currentUser.department,
            section: profileResp.data.sectionData || currentUser.section,
            branch: profileResp.data.branchData || currentUser.branch,
            workSystem: profileResp.data.workSystem || currentUser.workSystem,
            image: profileResp.data.image || currentUser.image,
            email: profileResp.data.email || currentUser.email,
            name: profileResp.data.name || currentUser.name,
            assignedTo: profileResp.data.assignedTo || currentUser.assignedTo,
          });
        }

        const [reqResp, notifResp, unreadResp, profileImgResp, evalResp] = await Promise.all([
          getMyFacilityRequests(),
          getNotifications(1, 20),
          getUnreadCount(),
          getProfileImage(),
          getMyFitnessEvaluations(),
        ]);
        if (!cancelled) {
          setFacilityRequests(reqResp.data || []);
          setNotificationsList(notifResp.data?.notifications || []);
          setUnreadCount(unreadResp.data?.unreadCount || 0);
          setProfileImageUrl(profileImgResp.data?.image || null);
          setEvaluations(evalResp.data?.data || []);
        }
      } catch {
        if (!cancelled) { setFacilityRequests([]); setEvaluations([]); }
      } finally {
        if (!cancelled) { setRequestsLoading(false); setNotificationsLoading(false); setEvaluationsLoading(false); }
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const profile = useMemo(() => {
    return {
      ...fallbackProfile,
      ...user,
      name: user?.name || user?.username || fallbackProfile.name,
      image: profileImageUrl || user?.image || user?.avatar || AvtarImage,
    };
  }, [user, profileImageUrl]);

  // Normalize work detail values to display strings (some are objects from the API)
  const normalizeValue = (val: any): string => {
    if (val == null) return "";
    if (typeof val === "object") return val.name || val.id || "";
    return String(val);
  };

  const personalDetails: DetailItem[] = [
    { label: t("profile.username"), value: profile.username || fallbackProfile.username },
    { label: t("profile.email"), value: profile.email || fallbackProfile.email },
    { label: t("profile.mobile"), value: profile.mobile || fallbackProfile.mobile },
    { label: t("profile.gender"), value: typeof profile.gender === "string" ? profile.gender : (profile.gender === "Male" ? "Male" : profile.gender === "Female" ? "Female" : fallbackProfile.gender) },
    { label: t("profile.age"), value: String(profile.age || fallbackProfile.age) },
  ];

  const workDetails: DetailItem[] = [
    { label: t("profile.jobTitle"), value: normalizeValue(profile.jobTitle) || fallbackProfile.jobTitle },
    { label: t("profile.rank"), value: normalizeValue(profile.rank) || fallbackProfile.rank },
    { label: t("profile.sector"), value: normalizeValue(profile.sector) || fallbackProfile.sector },
    { label: t("profile.department"), value: normalizeValue(profile.department) || fallbackProfile.department },
    { label: t("profile.section"), value: normalizeValue(profile.section) || fallbackProfile.section },
    { label: t("profile.branch"), value: normalizeValue(profile.branch) || fallbackProfile.branch },
    { label: t("profile.workSystem"), value: normalizeValue(profile.workSystem) || fallbackProfile.workSystem },
  ];

  

  

  

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const resp = await uploadProfileImage(formData);
      if (resp.status && resp.data?.image) {
        setProfileImageUrl(resp.data.image);
        setUser({ ...user, image: resp.data.image, avatar: resp.data.image });
      }
    } catch {
      // silently fail
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    removeAll();
    localStorage.removeItem("rememberMe");
    navigate("/");
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="relative xl:pt-34 lg:pt-28 pt-24 xl:pb-24 lg:pb-16 pb-10 overflow-hidden bg-[linear-gradient(180deg,#FFF3F3_0%,#FFFFFF_48%,#F7FAFD_100%)]">
      <div className="absolute top-20 -inset-s-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-20 -inset-e-16 w-80 h-80 rounded-full bg-secondary/8 blur-3xl" />

      <div className="relative max-w-341.5 w-full mx-auto md:px-7 px-4">
        <div className="flex lg:flex-row flex-col xl:gap-8 gap-5">
          <aside className="lg:w-[34%] w-full">
            <div className="sticky top-28 bg-white/80 border border-white xl:rounded-[44px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(10,34,64,0.10)]">
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative xl:w-34 xl:h-34 w-28 h-28 rounded-full border-4 border-primary bg-white overflow-hidden flex items-center justify-center cursor-pointer group"
                >
                  {isUploading ? (
                    <span className="text-sm font-bold text-secondary/60">{t("profile.uploading")}</span>
                  ) : (
                    <img src={profile.image || AvtarImage} alt={profile.name} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-primary/90 text-white text-xs font-bold py-2 translate-y-full group-hover:translate-y-0 transition-transform">
                    {t("profile.changePhoto")}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                <h1 className="mt-5 text-secondary font-bold xl:text-3xl/tight text-2xl/tight">{profile.name}</h1>
                <p className="mt-2 text-primary font-bold text-sm">{profile.jobTitle || fallbackProfile.jobTitle}</p>
                <p className="mt-3 text-secondary/60 text-sm/tight font-medium max-w-80">{t("profile.readOnlyNote")}</p>
                <Link to="/certificates" className="mt-5 block w-full rounded-2xl bg-primary text-white px-5 py-3 text-sm font-bold text-center hover:bg-primary/90 transition-colors">
                  {t("profile.viewCertificates")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 rounded-2xl border border-primary text-primary hover:bg-primary hover:text-white px-5 py-3 text-sm font-bold transition-all cursor-pointer w-full"
                >
                  {t("profile.logout")}
                </button>
              </div>

              

              <section ref={notificationsRef} id="notifications" className="mt-5 scroll-mt-28">
                <div className="flex items-center justify-between gap-3 mb-3 text-start">
                  <div>
                    <h2 className="text-secondary font-bold text-lg/tight">{t("notifications.profileTitle")}</h2>
                    <p className="mt-1 text-secondary/55 text-xs/tight font-medium">{t("notifications.profileSubtitle")}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                    {unreadCount}
                  </span>
                </div>

                <div className="max-h-80 overflow-auto pe-1 space-y-2">
                  {notificationsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-3xl bg-[#F7EEF0] p-3 flex gap-3">
                        <div className="min-w-10 w-10 h-10 rounded-2xl bg-gray-200 animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-2.5 bg-gray-200 rounded animate-pulse w-full" />
                        </div>
                      </div>
                    ))
                  ) : notificationsList.length > 0 ? (
                    notificationsList.map((item: any, index: any) => (
                      <NotificationRow key={item.id} item={item} index={index} compact />
                    ))
                  ) : (
                    <p className="text-center text-secondary/40 text-sm font-medium py-6">{t("notifications.noNotifications") || "No notifications"}</p>
                  )}
                </div>
              </section>
            </div>
          </aside>

          <div className="lg:w-[66%] w-full space-y-5">
            <section className="bg-white/80 border border-white xl:rounded-[44px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(10,34,64,0.08)]">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="text-start">
                  <h2 className="text-secondary font-bold xl:text-3xl/tight text-2xl/tight">{t("profile.personalInformation")}</h2>
                  <p className="mt-1 text-secondary/55 text-sm font-medium">{t("profile.personalSubtitle")}</p>
                </div>
              </div>
              <DetailGrid items={personalDetails} />
            </section>

            <section className="bg-white/80 border border-white xl:rounded-[44px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(10,34,64,0.08)]">
              <div className="mb-5 text-start">
                <h2 className="text-secondary font-bold xl:text-3xl/tight text-2xl/tight">{t("profile.workInformation")}</h2>
                <p className="mt-1 text-secondary/55 text-sm font-medium">{t("profile.workSubtitle")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4 gap-3">
                {workDetails.map((item, i) => (
                  <div key={item.label} className="rounded-2xl bg-[#F7EEF0] border border-primary/5 px-4 py-3 text-start flex items-start gap-3">
                    <span className="min-w-9 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <WorkInfoIcon index={i} />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-secondary/50 text-[11px] font-bold uppercase">{item.label}</dt>
                      <dd className="mt-0.5 text-secondary text-sm font-bold wrap-break-word">{item.value || "-"}</dd>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

        <FacilityRequestsSection requestsRef={requestsRef} requests={facilityRequests} loading={requestsLoading} />
        <FitnessEvaluationSection evaluations={evaluations} loading={evaluationsLoading} />
      </div>
    </section>
  );
}



 
  

function FacilityRequestsSection({ requestsRef, requests, loading }: { requestsRef: RefObject<HTMLElement | null>; requests: any; loading: boolean }) {
  const { t } = useTranslation();
  const formatDateOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(t('i18n.language') === 'ar' ? 'ar-AE' : 'en-GB', { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "1":
        return <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider inline-block text-center min-w-28 bg-green-500 text-white shadow-lg shadow-green-500/20">{t("profile.approved")}</span>;
      case "2":
        return <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider inline-block text-center min-w-28 bg-primary text-white shadow-lg shadow-primary/20">{t("profile.rejected")}</span>;
      case "3":
        return <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider inline-block text-center min-w-28 bg-gray-400 text-white shadow-lg shadow-gray-400/20">{t("profile.cancelled")}</span>;
      default:
        return <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider inline-block text-center min-w-28 bg-amber-500 text-white shadow-lg shadow-amber-500/20">{t("profile.pending")}</span>;
    }
  };

  return (
    <section ref={requestsRef} id="requests" className="mt-5 bg-white/90 border-2 border-primary/10 xl:rounded-[44px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(10,34,64,0.12)] scroll-mt-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 mb-6">
        <div className="text-start">
          <h2 className="text-secondary font-bold xl:text-3xl/tight text-2xl/tight tracking-tight">{t("profile.facilityRequests")}</h2>
          <p className="mt-1 text-secondary/55 text-sm font-medium">{t("profile.facilityRequestsSubtitle")}</p>
        </div>
        <Link to="/facilities" className="text-primary text-sm font-bold underline hover:text-secondary transition-colors w-fit">{t("profile.bookNewFacility")}</Link>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-primary/5">
        <table className="w-full min-w-220 border-collapse bg-white text-start">
          <thead className="bg-[#F7EEF0]">
            <tr>
              <th className="px-5 py-4 text-start text-[11px] font-bold uppercase tracking-widest text-secondary/55">{t("profile.facility")}</th>
              <th className="px-5 py-4 text-start text-[11px] font-bold uppercase tracking-widest text-secondary/55">{t("profile.date")}</th>
              <th className="px-5 py-4 text-start text-[11px] font-bold uppercase tracking-widest text-secondary/55">{t("profile.slot")}</th>
              <th className="px-5 py-4 text-start text-[11px] font-bold uppercase tracking-widest text-secondary/55">{t("profile.status")}</th>
              <th className="px-5 py-4 text-start text-[11px] font-bold uppercase tracking-widest text-secondary/55">{t("profile.reason")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-primary/5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : requests.length > 0 ? (
              requests.map((req: any) => (
                <tr key={req.id} className="border-t border-primary/5">
                  <td className="px-5 py-4 text-secondary text-sm font-bold">{req.facilityName}</td>
                  <td className="px-5 py-4 text-secondary/70 text-sm font-semibold whitespace-nowrap">{formatDateOnly(req.date)}</td>
                  <td className="px-5 py-4 text-secondary/70 text-sm font-semibold whitespace-nowrap">{req.time_slot || "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                  <td className="px-5 py-4 text-secondary/65 text-sm font-medium min-w-70">-</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-secondary/40 text-lg font-bold">
                  {t("profile.noRequests")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FitnessEvaluationSection({ evaluations, loading }: { evaluations: any[]; loading: boolean }) {
  const { t } = useTranslation();

  const groupedResults = useMemo(() => {
    const groups: { key: string; label: string; results: any[]; total: number }[] = [];
    const map = new Map<string, any[]>();
    evaluations.forEach((ev) => {
      (ev.results || []).forEach((r: any) => {
        const d = new Date(r.createdAt ?? ev.createdAt ?? "");
        const key = `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      });
    });
    const sortedKeys = Array.from(map.keys()).sort().reverse();
    sortedKeys.forEach((key, i) => {
      const items = map.get(key)!;
      const total = items.reduce((s: number, r: any) => s + Number(r.result || 0), 0);
      groups.push({ key, label: i === 0 ? "Latest" : `Previous — ${key}`, results: items, total });
    });
    return groups;
  }, [evaluations]);

  const overallTotal = useMemo(() => {
    return groupedResults.reduce((sum, g) => sum + g.total, 0);
  }, [groupedResults]);

  return (
    <section className="mt-5 bg-white/90 border-2 border-primary/10 xl:rounded-[44px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(10,34,64,0.12)] scroll-mt-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 mb-6">
        <div className="text-start">
          <h2 className="text-secondary font-bold xl:text-3xl/tight text-2xl/tight tracking-tight">{t("profile.evaluationHistory")}</h2>
          <p className="mt-1 text-secondary/55 text-sm font-medium">{t("profile.evaluationHistorySubtitle")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="block text-[10px] font-bold text-primary/60 uppercase tracking-wider">Total Score</span>
            <span className="block text-xl font-bold text-primary">{Math.round(overallTotal)}</span>
          </div>
          <div className="bg-primary/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="block text-[10px] font-bold text-primary/60 uppercase tracking-wider">Sessions</span>
            <span className="block text-xl font-bold text-primary">{groupedResults.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4 bg-white shadow-sm">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-50 rounded animate-pulse w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groupedResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {groupedResults.map((group, gi) => (
            <div key={group.key} className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-secondary/70">{gi === 0 ? "Latest" : group.label}</span>
                <span className="text-[13px] font-bold text-primary">{group.total.toFixed(2).replace(/\.00$/, '')} pts</span>
              </div>
              <div className="p-2 space-y-1.5">
                {group.results.map((r: any) => (
                  <div key={r.result_id || r.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-50/50">
                    <span className="text-[11px] font-semibold text-gray-600 truncate">{r.category_name || `Cat #${r.fitness_category_id}`}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-500">{r.input_value}{r.unit_type ? ` ${r.unit_type}` : ''}</span>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{r.result} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/5 bg-[#F7EEF0] px-6 py-12 text-center">
          <p className="text-secondary/40 text-lg font-bold">{t("profile.noEvaluations")}</p>
        </div>
      )}
    </section>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function detectNotificationType(title: string): "event" | "certificate" | "fitness" {
  const lower = title.toLowerCase();
  if (lower.includes("certificate") || lower.includes("evaluation") || lower.includes("cert")) return "certificate";
  if (lower.includes("fitness") || lower.includes("score") || lower.includes("workout") || lower.includes("exercise")) return "fitness";
  return "event";
}

function NotificationRow({ item, index, compact = false }: { item: any; index: number; compact?: boolean }) {
  const nType = detectNotificationType(item.title);
  return (
    <div
      className={`notification-pop rounded-3xl bg-[#F7EEF0] border border-primary/5 flex gap-3 text-start ${compact ? "p-3 items-start" : "p-4 sm:flex-row flex-col sm:items-center gap-4"
        }`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span className={`${compact ? "min-w-10 w-10 h-10" : "min-w-12 w-12 h-12"} notification-icon rounded-2xl bg-primary/10 text-primary flex items-center justify-center`}>
        <NotificationTypeIcon type={nType} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`${compact ? "text-sm/tight line-clamp-1" : "text-base/tight"} text-secondary font-bold`}>{item.title}</h3>
          {!item.isRead && <span className="min-w-2 w-2 h-2 rounded-full bg-primary" />}
        </div>
        <p className={`${compact ? "text-xs/tight line-clamp-2" : "text-sm/tight"} mt-1 text-secondary/60 font-medium`}>{item.message}</p>
        {compact && <span className="mt-2 block text-primary text-[11px] font-bold">{formatRelativeTime(item.createdAt)}</span>}
      </div>
      {!compact && <span className="text-primary text-xs font-bold whitespace-nowrap">{formatRelativeTime(item.createdAt)}</span>}
    </div>
  );
}

function NotificationTypeIcon({ type }: { type: "event" | "certificate" | "fitness" }) {
  if (type === "certificate") {
    return (
      <svg className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M7 3H17C18.1046 3 19 3.89543 19 5V19L15.5 17L12 19L8.5 17L5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 8H15M9 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "fitness") {
    return (
      <svg className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 13H7L9 6L14 18L16 13H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 2V5M16 2V5M3.5 9H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 8C4 5.79 5.79 4 8 4H16C18.21 4 20 5.79 20 8V17C20 19.21 18.21 21 16 21H8C5.79 21 4 19.21 4 17V8Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function WorkInfoIcon({ index }: { index: number }) {
  const icons = [
    <svg key="job" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    <svg key="rank" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    <svg key="sector" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    <svg key="dept" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" /></svg>,
    <svg key="section" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    <svg key="branch" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    <svg key="work" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ];
  return <>{icons[index] || icons[0]}</>;
}

function DetailGrid({ items, columns = "sm:grid-cols-2" }: { items: DetailItem[]; columns?: string }) {
  return (
    <dl className={`grid grid-cols-1 ${columns} xl:gap-4 gap-3`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-[#F7EEF0] border border-primary/5 px-4 py-3 text-start">
          <dt className="text-secondary/50 text-xs font-bold uppercase">{item.label}</dt>
          <dd className="mt-1 text-secondary text-base font-bold wrap-break-word whitespace-nowrap">{item.value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
