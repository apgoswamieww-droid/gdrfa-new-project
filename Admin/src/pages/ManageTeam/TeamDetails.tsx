import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTeamByIdApi, getTeamEventsApi } from "../../api/teams.api";
import type { Team } from "../../api/teams.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";
import DataTable, { type Column } from "../../component/Table/DataTable";

interface Player {
  id: number;
  playerId: string;
  name: string;
  nameAr?: string | null;
  name_ar?: string | null;
  email?: string;
  mobile?: string;
  isCaptain: boolean;
  status: string;
  createdAt: string;
}

interface TeamEvent {
  id: number;
  name: string;
  name_ar?: string | null;
  nameAr?: string | null;
  eventNameAr?: string | null;
  year: string;
  image: string | null;
  startDate: string;
  endDate: string;
  location: string;
  location_ar?: string | null;
  locationAr?: string | null;
  eventDescription: string;
  eventStatus: string;
  eventActiveStatus: string;
  status: string;
  teamName: string;
  activityId: string;
  activityNames: string;
  activityNames_ar?: string | null;
  activityNamesAr?: string | null;
  activity_name_ar?: string | null;
  targetType: string;
  createdAt: string;
}

interface TeamWithPlayers extends Team {
  players?: Player[];
  activity_ar?: string | null;
  activityAr?: string | null;
  teamManagerAr?: string | null;
  updatedAt?: string;
}

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [teamImageError, setTeamImageError] = useState(false);
  const isArabic = language === "ar";

  const localizedValue = (
    englishValue?: string | null,
    arabicValue?: string | null,
    fallback = "-",
  ) => {
    const value = isArabic ? arabicValue || englishValue : englishValue || arabicValue;
    return value || fallback;
  };

  const isActiveStatus = (value: unknown) =>
    value === true || value === 1 || ["1", "active"].includes(String(value || "").toLowerCase().trim());
  const fallbackText = (english: string, arabic: string) => (isArabic ? arabic : english);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id) return;
      try {
        const res = await getTeamByIdApi(Number(id));
        if (res.status) {
          const teamData = res.data;
          // Ensure players array exists, checking multiple possible keys
          if (!teamData.players && teamData.team_players) {
            teamData.players = teamData.team_players;
          }
          setTeam(teamData);
        } else {
          toast.error(res.message || fallbackText("Failed to load team", "تعذر تحميل الفريق"));
          navigate("/teams");
        }
      } catch (error: any) {
        toast.error(error.message || fallbackText("Failed to fetch team details", "تعذر جلب تفاصيل الفريق"));
        navigate("/teams");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!id) return;
      try {
        const res = await getTeamEventsApi(Number(id));
        if (res.status) {
          setEvents(res.data || []);
        }
      } catch {
        // silently fail
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [id]);

  const columns: Column<Player>[] = useMemo(
    () => [
      {
        key: "name",
        label: t.team?.playerName || (isArabic ? "اسم اللاعب" : "Player Name"),
        sortable: true,
        className: "font-medium text-black 2xl:text-base/light text-base/light",
        render: (_, row) => {
          const displayName = localizedValue(row.name, row.nameAr || row.name_ar, row.playerId);
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {String(displayName || row.playerId || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {displayName || row.playerId || "-"}
                </p>
                <p className="text-[10px] text-gray-400">{t.team?.id || "ID"}: {row.playerId}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "email",
        label: t.team?.email || (isArabic ? "البريد الإلكتروني" : "Email"),
        sortable: true,
        className:
          "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
        render: (value) => value || "-",
      },
      {
        key: "mobile",
        label: t.team?.phone || (isArabic ? "الهاتف" : "Phone"),
        sortable: true,
        className:
          "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
        render: (value) => value || "-",
      },
      {
        key: "isCaptain",
        label: t.team?.captain || fallbackText("Captain", "القائد"),
        className: "text-center",
        render: (value) =>
          value ? (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100 mx-auto">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {t.team?.captain || (isArabic ? "القائد" : "Captain")}
            </div>
          ) : (
            <span className="text-gray-300">-</span>
          ),
      },
      {
        key: "status",
        label: t.team?.status || fallbackText("Status", "الحالة"),
        className: "text-center",
        render: (value) => {
          const isActive = isActiveStatus(value);
          return (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {isActive
                ? t.team?.active || (isArabic ? "فعّال" : "Active")
                : t.team?.inactive || (isArabic ? "غير فعّال" : "Inactive")}
            </span>
          );
        },
      },
    ],
    [isArabic, language, t],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team)
    return <div className="text-center p-10 text-gray-500">{t.team?.notFound || (isArabic ? "الفريق غير موجود" : "Team not found")}</div>;

  const getImageUrl = (image: string | null) => {
    if (!image) return undefined;
    return `${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${image}`;
  };

  const playerCount = team.players?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-secondary">
          {t.team?.details || fallbackText("Team Details", "تفاصيل الفريق")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Team Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-center mb-6">
              {team.image && !teamImageError ? (
                <img
                  src={getImageUrl(team.image)}
                  alt={localizedValue(team.name, team.name_ar)}
                  className="w-40 h-40 rounded-lg object-cover mx-auto bg-gray-100 mb-4"
                  onError={() => setTeamImageError(true)}
                />
              ) : (
                <div className="w-40 h-40 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-bold text-secondary">{localizedValue(team.name, team.name_ar)}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {localizedValue(team.activity, team.activity_ar || team.activityAr)}
              </p>

              <div className="flex justify-center gap-2 mt-4">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {playerCount} / {team.numberOfMembers} {t.team?.members || (isArabic ? "الأعضاء" : "Members")}
                </span>
                {team.captain && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    <svg
                      className="w-3 h-3 mr-1 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t.team?.captainSet || (isArabic ? "تم تعيين القائد" : "Captain Set")}
                  </span>
                )}
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t.team?.manager || "Manager"}
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium text-gray-900">
                    {localizedValue(team.teamManager, team.teamManagerAr)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t.team?.createdAt || "Created At"}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(team.createdAt)}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t.team?.status || (isArabic ? "الحالة" : "Status")}
                </label>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    isActiveStatus(team.status)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isActiveStatus(team.status)
                    ? t.team?.active || (isArabic ? "فعّال" : "Active")
                    : t.team?.inactive || (isArabic ? "غير فعّال" : "Inactive")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Team Lineup */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-secondary">
                {t.team?.players || "Team Lineup"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t.team?.playersDescription || (isArabic ? "اللاعبون النشطون الحاليون وأدوارهم في الفريق." : "Current active players and their roles in the team.")}
              </p>
            </div>

            <div className="flex-1 p-4">
              {team.players && team.players.length > 0 ? (
                <DataTable
                  data={team.players}
                  columns={columns}
                  className="h-full"
                  perPageOptions={[5, 10, 20]}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="opacity-50 mb-4">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h6 className="text-gray-500 font-bold mb-2">
                    {t.team?.noMembers || (isArabic ? "لم تتم إضافة أعضاء بعد" : "No members added yet")}
                  </h6>
                  <button
                    onClick={() => navigate(`/teams/${id}/members`)}
                    className="px-6 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {t.team?.addMembersNow || (isArabic ? "إضافة أعضاء الآن" : "Add Members Now")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Participated Events */}
      {events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-secondary">
                {t.team?.participatedEvents || (isArabic ? "الفعاليات المشاركة" : "Participated Events")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t.team?.participatedHint || (isArabic ? "الفعاليات التي شارك فيها هذا الفريق" : "Events this team has participated in")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {events.length} {events.length === 1
                ? t.team?.event || (isArabic ? "فعالية" : "Event")
                : t.team?.eventsLabel || (isArabic ? "فعاليات" : "Events")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const eventImage = getImageUrl(event.image);
              return (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all bg-white"
                >
                  {eventImage ? (
                    <img
                      src={eventImage}
                      alt={localizedValue(event.name, event.name_ar || event.nameAr || event.eventNameAr)}
                      className="w-full h-36 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-secondary text-sm mb-2 line-clamp-1">
                      {localizedValue(event.name, event.name_ar || event.nameAr || event.eventNameAr)}
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">
                          {localizedValue(event.location, event.location_ar || event.locationAr)}
                        </span>
                      </div>
                      {event.activityNames && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="truncate">
                            {localizedValue(
                              event.activityNames,
                              event.activityNames_ar || event.activityNamesAr || event.activity_name_ar,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        {event.targetType === "competitive"
                ? t.team?.competitive || (isArabic ? "تنافسية" : "Competitive")
                : t.team?.regular || (isArabic ? "منتظمة" : "Regular")}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          event.eventActiveStatus === "2"
                            ? "bg-primary-green/10 text-primary-green"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.eventActiveStatus === "2"
                ? t.team?.completedEvent || (isArabic ? "مكتملة" : "Completed")
                : t.team?.upcomingEvent || (isArabic ? "قادمة" : "Upcoming")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!eventsLoading && events.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-400 font-medium">
            {t.team?.noEventsFound || (isArabic ? "لا توجد فعاليات مشاركة" : "No participated events found")}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
