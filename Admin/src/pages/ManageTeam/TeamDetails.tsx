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
  email?: string;
  mobile?: string;
  isCaptain: boolean;
  status: string;
  createdAt: string;
}

interface TeamEvent {
  id: number;
  name: string;
  year: string;
  image: string | null;
  startDate: string;
  endDate: string;
  location: string;
  eventDescription: string;
  eventStatus: string;
  eventActiveStatus: string;
  status: string;
  teamName: string;
  activityId: string;
  activityNames: string;
  targetType: string;
  createdAt: string;
}

interface TeamWithPlayers extends Team {
  players?: Player[];
  updatedAt?: string;
}

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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
          toast.error(res.message || "Failed to load team");
          navigate("/teams");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch team details");
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
        label: "Player Name",
        sortable: true,
        className: "font-medium text-black 2xl:text-base/light text-base/light",
        render: (_, row) => {
          const displayName = row.name;
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
                <p className="text-[10px] text-gray-400">ID: {row.playerId}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        className:
          "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
        render: (value) => value || "-",
      },
      {
        key: "mobile",
        label: "Phone",
        sortable: true,
        className:
          "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
        render: (value) => value || "-",
      },
      {
        key: "isCaptain",
        label: t.team?.captain || "Captain",
        className: "text-center",
        render: (value) =>
          value ? (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100 mx-auto">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Captain
            </div>
          ) : (
            <span className="text-gray-300">-</span>
          ),
      },
      {
        key: "status",
        label: t.team?.status || "Status",
        className: "text-center",
        render: (value) => {
          const isActive = value === "Active" || value === "1";
          return (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
    ],
    [t],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team)
    return <div className="text-center p-10 text-gray-500">Team not found</div>;

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
          {t.team?.details || "Team Details"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Team Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-center mb-6">
              {team.image ? (
                <img
                  src={getImageUrl(team.image)}
                  alt={team.name}
                  className="w-40 h-40 rounded-lg object-cover mx-auto bg-gray-100 mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
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
              <h3 className="text-lg font-bold text-secondary">{team.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{team.activity}</p>

              <div className="flex justify-center gap-2 mt-4">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {playerCount} / {team.numberOfMembers} Members
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
                    Captain Set
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
                    {team.teamManager || "-"}
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
                  Status
                </label>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    team.status === "1"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {team.status === "1"
                    ? t.team?.active || "Active"
                    : t.team?.inactive || "Inactive"}
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
                Current active players and their roles
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
                    No members added yet
                  </h6>
                  <button
                    onClick={() => navigate(`/teams/${id}/members`)}
                    className="px-6 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Add Members Now
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
                Participated Events
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Events this team has participated in
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {events.length} {events.length === 1 ? "Event" : "Events"}
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
                      alt={event.name}
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
                      {event.name}
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
                        <span className="truncate">{event.location}</span>
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
                          <span className="truncate">{event.activityNames}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        {event.targetType === "competitive" ? "Competitive" : "Regular"}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          event.eventActiveStatus === "2"
                            ? "bg-primary-green/10 text-primary-green"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.eventActiveStatus === "2" ? "Completed" : "Upcoming"}
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
            No participated events found
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
