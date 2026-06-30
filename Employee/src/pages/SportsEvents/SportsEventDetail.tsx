import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowIcon } from "./SportsEventList";
import { getEventById, postParticipant } from "../../api/page.api";
import { useAuthStore } from "../../store/store";
import { useTranslation } from "react-i18next";
import Toast from "../../components/ui/Toast";

export default function SportsEventDetail() {
  const { t, i18n } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [selectedActivityId, setSelectedActivityId] = useState<number | undefined>(undefined);
  const [selectedActivityObject, setSelectedActivityObject] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [participating, setParticipating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const response = await getEventById(eventId);
        if (response.status && response.data) {
          setEvent(response.data);
        } else {
          setError(t("sportsEvents.detail.notFound"));
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(t("sportsEvents.detail.failedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (event?.eventActivitySchedule?.length) {
      const first = event.eventActivitySchedule[0];
      setSelectedActivityId(first.activityId);
      setSelectedActivityObject(first);
    }
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFD]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-secondary font-bold">{t("sportsEvents.detail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFD]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-secondary">{error || t("sportsEvents.detail.notFound")}</h2>
          <Link to="/sport-activity-list" className="inline-block px-6 py-2 bg-primary text-white rounded-full font-bold">
            {t("sportsEvents.detail.backToEvents")}
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (start: string | null, end: string | null) => {
    if (!start) return t("sportsEvents.tba");
    const s = new Date(start);
    const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = s.toLocaleDateString(locale, options);
    if (!end) return startStr;
    const e = new Date(end);
    const endStr = e.toLocaleDateString(locale, options);
    return `${startStr} - ${endStr}`;
  };

  const formatSingleDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(locale, options);
  };

  const getEventStatusBadge = () => {
    // If admin marked as completed
    if (String(event.eventActiveStatus) === "2") {
      return { label: t("sportsEvents.completed"), type: "completed" as const };
    }
    const now = new Date();
    const start = event.startDate ? new Date(event.startDate) : null;
    const end = event.endDate ? new Date(event.endDate) : null;
    if (start && end && now >= start && now <= end) {
      return { label: t("sportsEvents.ongoing"), type: "ongoing" as const };
    }
    if (start && now < start) {
      return { label: t("sportsEvents.upcoming"), type: "upcoming" as const };
    }
    // Fallback: if eventActiveStatus is "1" (active)
    if (String(event.eventActiveStatus) === "1") {
      return { label: t("sportsEvents.ongoing"), type: "ongoing" as const };
    }
    return null;
  };

  const getRegistrationStatus = () => {
    // If event is marked as completed, show Event Completed
    if (String(event.eventActiveStatus) === "2") {
      return {
        label: t("sportsEvents.detail.eventCompleted"),
        type: "completed" as const,
      };
    }
    const now = new Date();
    const start = event.regStartDate ? new Date(event.regStartDate) : null;
    const end = event.regEndDate ? new Date(event.regEndDate) : null;

    if (!start && !end) return null;

    if (start && now < start) {
      return {
        label: `Registration Opens On ${formatSingleDate(event.regStartDate)}`,
        type: "warning" as const,
      };
    }

    if (start && end && now >= start && now <= end) {
      return {
        label: end
          ? `Registration Live - Closes On ${formatSingleDate(event.regEndDate)}`
          : "Registration Live",
        type: "success" as const,
      };
    }

    if (end && now > end) {
      return {
        label: "Registration Closed",
        type: "danger" as const,
      };
    }

    return null;
  };

  const handleTeamClick = (team: any) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
  };

  const getCurrentUserRole = (team: any): "captain" | "member" | null => {
    if (!user?.id) return null;
    const player = team.players.find(
      (p: any) => String(p.id).toLowerCase() === String(user.id).toLowerCase()
    );
    if (!player) return null;
    return String(player.isCaptain) === "1" ? "captain" : "member";
  };

  const isIndividual = event.targetType === "ragular" || event.targetType === null || event.targetType === undefined;
  const isAllEmployees = event.targetedEmployees === "all";
  const isSelectedEmployees = event.targetedEmployees === "selected";
  const isUserInSelectedList = isSelectedEmployees && user?.id && event.selectedEmployees?.split(",").map((s: string) => s.trim()).includes(user.id);
  const isUserEligible = isIndividual && (isAllEmployees || isUserInSelectedList || event.selectedEvent);

  const now = new Date();
  const regStart = event.regStartDate ? new Date(event.regStartDate) : null;
  const regEnd = event.regEndDate ? new Date(event.regEndDate) : null;
  const regNotOpen = regStart ? now < regStart : false;
  const regClosed = regEnd ? now > regEnd : false;

  const isButtonVisible =
    selectedActivityObject?.isParticipant ||
    (!selectedActivityObject?.isParticipant && !isIndividual && event.isCaptain) ||
    (!selectedActivityObject?.isParticipant && isUserEligible);

  const handleOpenModal = () => {
    if (token) {
      setIsOpen(true);
    } else {
      navigate("/login");
    }
  };

  const handleRegister = async () => {
    if (!event?.id || !user?.id || !selectedActivityObject) return;
    setParticipating(true);
    try {
      const response = await postParticipant({
        user_id: user.id,
        event_id: event.id,
        activity_id: selectedActivityObject.activityId,
        manager_id: user.assignedTo,
        coordinator_id: event.eventCoordinators,
        activity_type: event.teams?.length > 0 ? "2" : "1",
      });
      setIsOpen(false);
      if (response.status) {
        setSelectedActivityObject((prev: any) => prev ? { ...prev, isParticipant: true } : prev);
        setToast({ message: t("sportsEvents.detail.registrationSuccess"), type: "success" });
      } else {
        setToast({ message: response.message || t("sportsEvents.detail.registrationFailed"), type: "error" });
      }
    } catch (err: any) {
      setIsOpen(false);
      setToast({ message: err?.message || t("sportsEvents.detail.registrationError"), type: "error" });
    } finally {
      setParticipating(false);
    }
  };

  const eventName = i18n.language === 'ar' ? (event.name_ar || event.name) : event.name;

  return (
    <div className="bg-[#F7FAFD] relative overflow-hidden">
      <AnimatedSportsBackground />

      {/* Hero Section - More Compact */}
      <section className="relative lg:h-[70dvh] h-[50dvh] lg:min-h-[500px] min-h-[350px] lg:pt-32 md:pt-24 pt-20 overflow-hidden">
        <div className="absolute inset-0 sports-detail-grid opacity-40 z-0" />
        <div className="max-w-341.5 mx-auto md:px-7 px-4 h-full relative z-10">
          <div className="w-full h-full relative overflow-hidden group">
            <div className="relative h-full md:rounded-[40px] rounded-3xl overflow-hidden shadow-2xl bg-secondary/10">
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,34,64,0)_0%,rgba(10,34,64,0.8)_100%)] w-full h-full z-10"></span>
              {event.image ? (
                <img
                  src={event.image}
                  alt={eventName}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-secondary/20">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 start-0 z-20 w-full p-6 md:p-10 xl:p-14 max-w-3xl text-start">
              <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold mb-4 transition-colors">
                <span className="rtl:-scale-x-100 rotate-180"><ArrowIcon /></span>
                {t("sportsEvents.detail.backToHome")}
              </Link>
              <div className="flex gap-2 flex-wrap mb-4">
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  {event.targetType === "competitive" ? t("sportsEvents.team") : t("sportsEvents.individual")}
                </span>
                <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">{t("sportsEvents.sports")}</span>
                {(() => {
                  const status = getEventStatusBadge();
                  if (!status) return null;
                  const colors: Record<string, string> = {
                    completed: "bg-green-500 text-white",
                    ongoing: "bg-blue-500 text-white",
                    upcoming: "bg-amber-500 text-white",
                  };
                  return (
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${colors[status.type]}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              <h1 className="text-white md:text-4xl text-2xl font-bold leading-tight">
                {eventName}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="xl:py-20 lg:py-14 py-10 relative z-10">
        <div className="max-w-341.5 mx-auto md:px-7 px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Overview & Location */}
            <div className="lg:col-span-7 space-y-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/5">
                <h2 className="text-secondary font-bold text-2xl mb-4 text-start">
                  {t("sportsEvents.detail.eventOverview")}
                </h2>
                <div className="text-secondary/60 text-sm md:text-base leading-relaxed font-medium text-start space-y-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: i18n.language === 'ar' ? event.eventDescription_ar || event.eventDescription : event.eventDescription }} />
              </div>

              {event.eventActivitySchedule && event.eventActivitySchedule.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/5">
                  <h2 className="text-secondary font-bold text-2xl mb-6 text-start">
                    {t("sportsEvents.detail.activitySchedule")}
                  </h2>
                  <div className="space-y-4">
                    {event.eventActivitySchedule.map((activity: any) => (
                      <div key={activity.activityId} className="border border-secondary/5 rounded-2xl p-5 bg-secondary/[0.02]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-secondary font-bold text-base">{activity.activityName || t("sportsEvents.detail.activity", { id: activity.activityId })}</h4>
                            {activity.description && (
                              <p className="text-secondary/50 text-sm mt-1.5 leading-relaxed">{activity.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                            {activity.activityType || t("sportsEvents.sports")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-secondary/60">
                          <span className="flex items-center gap-1.5">
                            <CalendarIconSmall />
                            {formatDate(activity.startDate, activity.endDate)}
                          </span>
                          {activity.startTime && (
                            <span className="flex items-center gap-1.5">
                              <ClockIconSmall />
                              {activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.location && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/5">
                  <h2 className="text-secondary font-bold text-2xl mb-4 text-start">
                    {t("sportsEvents.detail.location")}
                  </h2>
                  <p className="text-secondary/60 text-sm md:text-base font-medium mb-6 text-start">
                    {t("sportsEvents.detail.locationDescription", { location: event.location })}
                  </p>
                  <div className="rounded-[24px] relative overflow-hidden h-80 md:h-96 shadow-inner border border-secondary/5 bg-secondary/5">
                    {event.lat && event.lng ? (
                      <iframe
                        className="w-full h-full grayscale-[0.2]"
                        src={`https://maps.google.com/maps?q=${event.lat},${event.lng}&z=15&output=embed`}
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <iframe
                        className="w-full h-full grayscale-[0.2]"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&z=15&output=embed`}
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Info Boxes */}
            <div className="lg:col-span-5 space-y-6 text-start">
              <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-6 md:p-8 shadow-lg border border-secondary/5 sticky top-24">
                <h3 className="text-secondary font-bold text-xl pb-4 mb-6 border-b border-secondary/10">
                  {t("sportsEvents.detail.eventInformation")}
                </h3>

                <div className="space-y-5">
                  <InfoItem
                    icon={<CalendarIconSmall />}
                    label={t("sportsEvents.detail.dateTime")}
                    value={`${formatDate(event.startDate, event.endDate)}${event.startTime ? ` ${t("sportsEvents.detail.at")} ${event.startTime}` : ""}`}
                  />
                  {getRegistrationStatus() && (() => {
                    const status = getRegistrationStatus()!;
                    const colors = {
                      warning: "bg-amber-50 text-amber-700 border-amber-200",
                      success: "bg-green-50 text-green-700 border-green-200",
                      danger: "bg-red-50 text-red-700 border-red-200",
                      completed: "bg-green-50 text-green-700 border-green-200",
                    };
                    return (
                      <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${colors[status.type]}`}>
                        {status.label}
                      </div>
                    );
                  })()}
                  <InfoItem
                    icon={<LocationIconSmall />}
                    label={t("sportsEvents.detail.venue")}
                    value={event.location || t("sportsEvents.detail.tbd")}
                  />
                  <InfoItem
                    icon={<CategoryIconSmall />}
                    label={t("sportsEvents.detail.category")}
                    value={event.targetType === "competitive" ? t("sportsEvents.detail.teamBased") : t("sportsEvents.individual")}
                  />
                  <InfoItem
                    icon={<StatusIconSmall />}
                    label={t("sportsEvents.detail.status")}
                    value={String(event.eventActiveStatus) === "2" ? t("sportsEvents.detail.completed") : String(event.eventActiveStatus) === "1" ? t("sportsEvents.detail.active") : t("sportsEvents.upcoming")}
                  />
                  <InfoItem
                    icon={<ParticipantsIconSmall />}
                    label={t("sportsEvents.detail.participants")}
                    value={event.total_joined ? t("sportsEvents.detail.joined", { count: event.total_joined }) : t("sportsEvents.detail.beFirst")}
                  />
                </div>

              </div>

              {/* Activity Selector */}
              {event.eventActivitySchedule && event.eventActivitySchedule.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/5">
                  <h3 className="text-secondary font-bold text-xl pb-4 mb-6 border-b border-secondary/10">
                    {t("sportsEvents.detail.activities")}
                  </h3>
                  <p className="text-secondary/50 text-sm font-medium mb-5 text-start">
                    {t("sportsEvents.detail.selectActivity")}
                  </p>

                  <div className="relative">
                    <select
                      value={selectedActivityId ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedActivityId(id);
                        const obj = event.eventActivitySchedule?.find(
                          (a: any) => a.activityId === id
                        );
                        setSelectedActivityObject(obj || null);
                      }}
                      className="bg-secondary/5 border border-secondary/10 focus:outline-none md:pe-12 pe-10 md:px-6 px-5 lg:py-4 py-3.5 rounded-2xl text-base text-secondary/60 font-medium w-full appearance-none cursor-pointer"
                    >
                      {event.eventActivitySchedule.map((a: any) => (
                        <option key={a.activityId} value={a.activityId}>
                          {a.activityName || t("sportsEvents.detail.activity", { id: a.activityId })}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute md:end-6 end-5 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path d="M11 1.5C11 1.5 7.31758 6.5 6 6.5C4.68233 6.5 1 1.5 1 1.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {selectedActivityObject && (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-secondary/60">
                        <CalendarIconSmall />
                        <span>
                          {formatDate(selectedActivityObject.startDate, selectedActivityObject.endDate)}
                          {selectedActivityObject.startTime && ` ${t("sportsEvents.detail.at")} ${selectedActivityObject.startTime}`}
                        </span>
                      </div>
                      {selectedActivityObject.description && (
                        <p className="text-sm text-secondary/50 leading-relaxed">
                          {selectedActivityObject.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6">
                    {String(event.eventActiveStatus) === "2" ? (
                      <div className="w-full rounded-2xl bg-primary-green/8 text-primary-green py-4 px-6 font-bold text-base text-center border border-primary-green/20">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t("sportsEvents.detail.eventCompleted")}
                        </div>
                      </div>
                    ) : (
                      <>
                        {isButtonVisible ? (
                          <button
                            disabled={selectedActivityObject?.isParticipant || participating || regNotOpen || regClosed}
                            onClick={handleOpenModal}
                            className="w-full rounded-2xl bg-primary text-white py-4 px-6 font-bold text-base transition-all hover:bg-secondary shadow-[0_10px_30px_rgba(122,37,48,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {selectedActivityObject?.isParticipant
                              ? t("sportsEvents.detail.participated")
                              : participating
                                ? t("sportsEvents.detail.registering")
                                : t("sportsEvents.detail.participate")}
                          </button>
                        ) : (
                          <div className="w-full rounded-2xl bg-secondary/5 text-secondary/40 py-4 px-6 font-bold text-base text-center border border-secondary/10">
                            {!user?.id
                              ? t("sportsEvents.detail.loginToRegister")
                              : !isIndividual
                                ? t("sportsEvents.detail.captainOnly")
                                : t("sportsEvents.detail.notEligible")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Target Audience Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/5">
                <h3 className="text-secondary font-bold text-xl pb-4 mb-6 border-b border-secondary/10">
                  {t("sportsEvents.detail.targetAudience")}
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <span className="text-[10px] text-secondary/40 font-bold uppercase block mb-1 tracking-wider">{t("sportsEvents.detail.targetType")}</span>
                    <span className="text-base text-secondary font-bold">{event.targetType === "competitive" ? t("sportsEvents.detail.teamBased") : t("sportsEvents.individual")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-secondary/40 font-bold uppercase block mb-1 tracking-wider">{t("sportsEvents.detail.targetedEmployees")}</span>
                    <span className="text-base text-secondary font-bold">{event.targetedEmployees === "all" ? t("sportsEvents.detail.allEmployees") : t("sportsEvents.detail.specificGroups")}</span>
                  </div>

                  {event.teams && event.teams.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-secondary/40 font-bold uppercase block mb-2 tracking-wider">{t("sportsEvents.detail.listOfTeams")}</span>
                      <div className="space-y-2">
                        {event.teams.map((team: any) => (
                          <div
                            key={team.teamId}
                            onClick={() => handleTeamClick(team)}
                            className="bg-primary/5 border border-primary/10 px-4 py-3 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-primary/10 transition-colors"
                          >
                            <span className="text-sm text-secondary font-bold">{team.teamName}</span>
                            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowIconSmall />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onRegister={handleRegister}
        participating={participating}
        activityName={selectedActivityObject?.activityName}
      />

      {/* Team Members Modal */}
      {showTeamModal && selectedTeam && (
        <TeamMembersModal
          team={selectedTeam}
          userRole={getCurrentUserRole(selectedTeam)}
          onClose={closeTeamModal}
        />
      )}

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

function RegistrationModal({ isOpen, onClose, onRegister, participating, activityName }: {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  participating: boolean;
  activityName: string;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <h3 className="text-secondary font-bold text-2xl mb-2 text-start">
            {t("sportsEvents.detail.registrationForm")}
          </h3>
          <p className="text-secondary/50 text-sm md:text-base font-medium text-start mb-8">
            {t("sportsEvents.detail.registerFor", { name: activityName })}
          </p>

          <form onSubmit={(e) => { e.preventDefault(); onRegister(); }}>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={participating}
                className="w-full rounded-2xl bg-primary text-white py-4 px-6 font-bold text-base transition-all hover:bg-secondary shadow-[0_10px_30px_rgba(122,37,48,0.2)] cursor-pointer disabled:opacity-50"
              >
                {participating ? t("sportsEvents.detail.registering") : t("sportsEvents.detail.register")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-primary text-primary py-4 px-6 font-bold text-base transition-all hover:bg-primary/5 cursor-pointer"
              >
                {t("sportsEvents.detail.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TeamMembersModal({ team, userRole, onClose }: { team: any; userRole: "captain" | "member" | null; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const currentUserId = useAuthStore((s) => s.user?.id);

  const isCaptainOfThisTeam = userRole === "captain";
  const isMemberOfThisTeam = userRole === "member" || userRole === "captain";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-secondary/10 flex items-center justify-between">
          <div>
            <h3 className="text-secondary font-bold text-xl">{team.teamName}</h3>
            <p className="text-secondary/50 text-sm font-medium mt-1">
              {team.players.length} {team.players.length === 1 ? t("sportsEvents.detail.member") : t("sportsEvents.detail.teamMembers")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary/5 flex items-center justify-center text-secondary/60 hover:bg-secondary/10 hover:text-secondary transition-all cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          {!currentUserId ? (
            <div className="text-center py-8">
              <p className="text-secondary/50 font-medium">{t("sportsEvents.detail.loginToView")}</p>
            </div>
          ) : !isMemberOfThisTeam ? (
            <div className="text-center py-8">
              <svg className="mx-auto mb-4 text-secondary/20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-secondary/50 font-medium">{t("sportsEvents.detail.notMember")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {isCaptainOfThisTeam && (
                <div className="bg-primary/5 rounded-2xl px-4 py-3 text-start">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{t("sportsEvents.detail.captainView")}</p>
                  <p className="text-xs text-primary/70 mt-1">{t("sportsEvents.detail.captainViewDesc")}</p>
                </div>
              )}

              {!isCaptainOfThisTeam && isMemberOfThisTeam && (
                <div className="bg-secondary/5 rounded-2xl px-4 py-3 text-start">
                  <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-wider">{t("sportsEvents.detail.memberView")}</p>
                  <p className="text-xs text-secondary/50 mt-1">{t("sportsEvents.detail.memberViewDesc")}</p>
                </div>
              )}

              {team.players.map((player: any) => (
                <div
                  key={player.id}
                  className={`rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors ${String(player.isCaptain) === "1"
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-secondary/[0.03] border border-secondary/5"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${String(player.isCaptain) === "1"
                    ? "bg-primary text-white"
                    : "bg-secondary/10 text-secondary/60"
                    }`}>
                    {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  <div className="flex-1 min-w-0 text-start">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-secondary truncate">
                        {player.name || t("sportsEvents.detail.unknown")}
                      </span>
                      {String(player.isCaptain) === "1" && (
                        <span className="shrink-0 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                          {t("sportsEvents.detail.captain")}
                        </span>
                      )}
                    </div>

                    {isCaptainOfThisTeam && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {player.email && (
                          <span className="text-xs text-secondary/50 flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            {player.email}
                          </span>
                        )}
                        {player.mobile && (
                          <span className="text-xs text-secondary/50 flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            {player.mobile}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {String(player.isCaptain) === "1" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimatedSportsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {["⚽", "🏃", "🚴", "🏊", "🏆", "⏱"].map((icon, index) => (
        <span
          key={icon}
          className="sports-clip absolute text-primary/10 font-bold select-none"
          style={{
            insetInlineStart: `${8 + index * 16}%`,
            top: `${15 + (index % 4) * 20}%`,
            animationDelay: `${index * 800}ms`,
            animationDuration: `${7 + index}s`
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 min-w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-secondary/40 font-bold uppercase tracking-wider">{label}</span>
        <span className="text-sm md:text-base text-secondary font-bold leading-tight mt-0.5">{value}</span>
      </div>
    </div>
  );
}

// Smaller Icons for the Info Items
function CalendarIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LocationIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CategoryIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function StatusIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ParticipantsIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
