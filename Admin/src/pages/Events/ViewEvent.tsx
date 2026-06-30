import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getEventByIdApi, getEventCoordinatorsApi, getSportActivitiesApi,
  getEventActivitiesApi, getEventParticipantsApi, markEventAsCompleteApi,
  markActivityCompleteApi, getEventWinnersApi
} from "../../api/events.api";
import { getParticipantsApi, manualRegisterApi, manualRegisterTeamApi, deleteParticipantApi, deleteParticipantTeamApi, updateParticipantStatusApi, type Participant } from "../../api/participants.api";
import { getEmployeesWithFiltersApi, type EmployeeWithDetails, type EmployeeFilterOptions } from "../../api/employees.api";
import { useTranslation } from "../../hooks/useTranslation";
import ConfirmModal from "../../component/ConfirmModal/ConfirmModal";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";
import DataTable, { type Column } from "../../component/Table/DataTable";
import EmployeeSelectionModal from "../../component/EmployeeSelectionModal/EmployeeSelectionModal";
import TeamSelectionModal from "../../component/TeamSelectionModal/TeamSelectionModal";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

const getImageUrl = (path?: string) => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
};

const DefaultImagePlaceholder = ({ className }: { className?: string }) => (
  <div className={`bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${className || ""}`}>
    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 6 7 6s0-2 2.5-2a2.5 2.5 0 010 5H8m8-2h1.5a2.5 2.5 0 000-5C17 4 17 6 17 6s0-2-2.5-2a2.5 2.5 0 000 5H16m-4 2v6m0 0l-3-3m3 3l3-3" />
  </svg>
);

const SetWinnerModal = ({
  open, onClose, activityId, activityName, eventId, eventType,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  activityId: number;
  activityName: string;
  eventId: number;
  eventType: string;
  onSuccess: () => void;
}) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getEventParticipantsApi(eventId, activityId, eventType);
        if (res.status && res.data) {
          if (res.data.players) setPlayers(res.data.players);
          if (res.data.teams) setTeams(res.data.teams);
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to load participants");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [open, eventId, activityId, eventType]);

  useEffect(() => {
    setSelectedPlayers([]);
    setSelectedTeam("");
  }, [open]);

  const handleSave = async () => {
    if (eventType === "ragular") {
      if (selectedPlayers.length === 0) {
        toast.error("Please select at least one winner");
        return;
      }
    } else {
      if (!selectedTeam) {
        toast.error("Please select a winning team");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = eventType === "ragular"
        ? { user_ids: selectedPlayers }
        : { winner_team: selectedTeam };

      const res = await markEventAsCompleteApi(eventId, activityId, payload);
      if (res.status) {
        toast.success(res.message || "Winners saved successfully!");
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save winners");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-secondary">Set Winner</h3>
            <p className="text-sm text-gray-500 mt-1">{activityName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : eventType === "ragular" ? (
            <div>
              <p className="text-sm font-semibold text-secondary mb-3">Select winners from participants:</p>
              {players.length === 0 ? (
                <p className="text-sm text-gray-400">No participants found for this activity</p>
              ) : (
                <div className="space-y-2">
                  {players.map((p) => (
                    <label key={p.user_id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedPlayers.includes(p.user_id) ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50 border border-transparent"}`}>
                      <input type="checkbox" checked={selectedPlayers.includes(p.user_id)} onChange={() => togglePlayer(p.user_id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary">{p.name}</p>
                        {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-secondary mb-3">Select the winning team:</p>
              {teams.length === 0 ? (
                <p className="text-sm text-gray-400">No teams found for this activity</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <label key={team.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedTeam === String(team.id) ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50 border border-transparent"}`}>
                      <input type="radio" name="winnerTeam" value={team.id} checked={selectedTeam === String(team.id)} onChange={() => setSelectedTeam(String(team.id))} className="w-4 h-4 border-gray-300 text-primary focus:ring-primary" />
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <TrophyIcon />
                      </div>
                      <p className="text-sm font-medium text-secondary">{team.name}</p>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (eventType === "ragular" ? players.length === 0 || selectedPlayers.length === 0 : teams.length === 0 || !selectedTeam)}
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <TrophyIcon />
                Set Winner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewEvent = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState<Array<{ id: string; name: string; nameAr?: string; email?: string }>>([]);
  const [sportActivities, setSportActivities] = useState<Array<{ id: number; name: string; activityType?: number; isTeam?: string }>>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedEmployeesList, setSelectedEmployeesList] = useState<EmployeeWithDetails[]>([]);
  const [selectedEmployeesLoading, setSelectedEmployeesLoading] = useState(false);

  const [completedActivityIds, setCompletedActivityIds] = useState<number[]>([]);
  const [markedCompleteIds, setMarkedCompleteIds] = useState<number[]>([]);
  const [winnersByActivity, setWinnersByActivity] = useState<Record<string, any>>({});
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerModalActivity, setWinnerModalActivity] = useState<{ id: number; name: string } | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [addParticipantLoading, setAddParticipantLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ id: number; status: string; currentStatus: string } | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  const toggleTeam = (name: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>({
    sectors: [], departments: [], sections: [], branches: [], ranks: [], jobTitles: [], genders: [], workSystems: [], staffTypes: [],
  });

  const fetchWinners = async () => {
    if (!id) return;
    try {
      const res = await getEventWinnersApi(Number(id));
      if (res.status && res.data) {
        setCompletedActivityIds(res.data.completedActivityIds);
        setMarkedCompleteIds(res.data.completedScheduleIds || []);
        setWinnersByActivity(res.data.winnersByActivity || {});
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const response = await getEventByIdApi(Number(id));
        if (response.status && response.data) {
          setEvent(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load event");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    fetchWinners();
  }, [id]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [coordRes, sportRes] = await Promise.all([
          getEventCoordinatorsApi(),
          getSportActivitiesApi(),
        ]);
        if (coordRes.data) setCoordinators(coordRes.data);
        if (sportRes?.data?.data) setSportActivities(sportRes.data.data);
      } catch (e) {
        console.warn("Failed to load meta data", e);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchSchedules = async () => {
      try {
        const res = await getEventActivitiesApi(Number(id));
        if (res.status && res.data) {
          setSchedules(res.data.schedules || []);
        }
      } catch (e) {
        console.warn("Failed to load activity schedules", e);
      }
    };
    fetchSchedules();
  }, [id]);

  useEffect(() => {
    if (!event || event.targetType !== "ragular" || event.targetedEmployees !== "selected") return;
    const selectedIds = event.selectedEmployees ? event.selectedEmployees.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    if (selectedIds.length === 0) return;
    const fetchSelectedEmployees = async () => {
      setSelectedEmployeesLoading(true);
      try {
        const res = await getEmployeesWithFiltersApi();
        if (res.status && res.data?.employees) {
          const filtered = res.data.employees.filter((e: EmployeeWithDetails) => selectedIds.includes(e.id));
          setSelectedEmployeesList(filtered);
        }
      } catch (e) {
        console.warn("Failed to load selected employees", e);
      } finally {
        setSelectedEmployeesLoading(false);
      }
    };
    fetchSelectedEmployees();
  }, [event]);

  useEffect(() => {
    if (!id) return;
    const fetchParticipants = async () => {
      setParticipantsLoading(true);
      try {
        const res = await getParticipantsApi({ event_id: id, length: 500 });
        if (res.status && res.data?.data) {
          setParticipants(res.data.data);
        }
      } catch (e) {
        console.warn("Failed to load participants", e);
      } finally {
        setParticipantsLoading(false);
      }
    };
    fetchParticipants();
  }, [id]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await getEmployeesWithFiltersApi();
        if (res.status && res.data?.filterOptions) {
          setFilterOptions(res.data.filterOptions);
        }
      } catch { /* ignore */ }
    };
    fetchFilterOptions();
  }, []);

  const handleAddTeam = async (teamIds: number[]) => {
    if (!id || teamIds.length === 0) return;
    setAddParticipantLoading(true);
    try {
      const res = await manualRegisterTeamApi(Number(id), { team_ids: teamIds });
      if (res.status) {
        toast.success(res.message || "Teams added successfully");
        setShowAddTeamModal(false);
        const refreshed = await getParticipantsApi({ event_id: id, length: 500 });
        if (refreshed.status && refreshed.data?.data) {
          setParticipants(refreshed.data.data);
        }
      } else {
        toast.error(res.message || "Failed to add teams");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to add teams");
    } finally {
      setAddParticipantLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await deleteParticipantTeamApi(teamId, Number(id));
      if (res.status) {
        toast.success(res.message || "Team removed successfully");
        const refreshed = await getParticipantsApi({ event_id: id, length: 500 });
        if (refreshed.status && refreshed.data?.data) {
          setParticipants(refreshed.data.data);
        }
      } else {
        toast.error(res.message || "Failed to remove team");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove team");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddParticipant = async (userIds: string[]) => {
    if (!id || userIds.length === 0) return;
    setAddParticipantLoading(true);
    try {
      const res = await manualRegisterApi(Number(id), { user_ids: userIds });
      if (res.status) {
        toast.success(res.message || "Participants added successfully");
        setShowAddParticipantModal(false);
        // Refresh participant list
        const refreshed = await getParticipantsApi({ event_id: id, length: 500 });
        if (refreshed.status && refreshed.data?.data) {
          setParticipants(refreshed.data.data);
        }
      } else {
        toast.error(res.message || "Failed to add participants");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to add participants");
    } finally {
      setAddParticipantLoading(false);
    }
  };

  const resolveNames = (ids?: string) => {
    if (!ids) return [];
    return ids
      .split(",")
      .map((idStr) => idStr.trim())
      .filter(Boolean)
      .map((idStr) => {
        const found = coordinators.find((c) => c.id === idStr);
        return found ? found : { id: idStr, name: idStr, email: undefined };
      });
  };

  const coordinatorsList = resolveNames(event?.eventCoordinators);
  const adminsList = resolveNames(event?.eventAdmins);

  const linkedActivities = sportActivities.filter((a) =>
    event?.activityId
      ? event.activityId.split(",").map((s: any) => s.trim()).includes(String(a.id))
      : false
  );

  const isActivityScheduleEnded = (sched: any) => {
    if (!sched.end_date) return false;
    const datePart = sched.end_date.split('T')[0].split(' ')[0];
    const endDateStr = sched.end_time ? `${datePart}T${sched.end_time}` : `${datePart}T23:59:59`;
    const endDate = new Date(endDateStr);
    return !isNaN(endDate.getTime()) && new Date() >= endDate;
  };

  const handleSetWinner = (activityId: number, activityName: string) => {
    setWinnerModalActivity({ id: activityId, name: activityName });
    setShowWinnerModal(true);
  };

  const handleMarkComplete = (activityId: number, activityName: string) => {
    if (!id) return;
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-secondary text-base">Mark as Complete</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Mark "{activityName}" as complete? This activity will be marked done without setting winners.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading("Marking as complete...");
              try {
                const res = await markActivityCompleteApi(Number(id), activityId);
                if (res.status) {
                  toast.success(res.message || "Activity marked as complete", { id: loadingToast });
                  fetchWinners();
                }
              } catch (e: any) {
                toast.error(e.message || "Failed to mark activity as complete", { id: loadingToast });
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark as Complete
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: "top-center",
      style: {
        minWidth: '400px',
        borderRadius: '24px',
        padding: '16px'
      }
    });
  };

  const selectedEmployeeColumns: Column<EmployeeWithDetails>[] = [
    {
      key: "id",
      label: "User Domain",
      sortable: true,
      className: "font-medium text-black text-sm",
      render: (value) => String(value),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      className: "font-medium text-black text-sm",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
            {((value as string) || "?").charAt(0).toUpperCase()}
          </div>
          <span>{String(value)}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
    {
      key: "mobile",
      label: "Phone",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
    {
      key: "sector",
      label: "Sector",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
    {
      key: "section",
      label: "Section",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
    {
      key: "branch",
      label: "Branch",
      sortable: true,
      className: "text-gray-400 text-sm font-medium",
      render: (value) => (value ? String(value) : "-"),
    },
  ];

  const participantColumns: Column<Participant>[] = [
    {
      key: "id",
      label: "#",
      className: "text-center w-12 text-gray-400 text-sm font-medium",
      render: (value) => String(value),
    },
    {
      key: "user",
      label: "Name",
      sortable: true,
      className: "font-medium text-black text-sm",
      render: (value) => {
        const user = value as Participant["user"];
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {(user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <span>{user?.name || "-"}</span>
          </div>
        );
      },
    },
    {
      key: "sportActivity",
      label: "Activity",
      className: "text-gray-400 text-sm font-medium",
      render: (value) => {
        const act = value as Participant["sportActivity"];
        return act?.name || "-";
      },
    },
    {
      key: "user",
      label: "Email",
      className: "text-gray-400 text-sm font-medium",
      render: (value) => {
        const user = value as Participant["user"];
        return user?.email || "-";
      },
    },
    {
      key: "user",
      label: "Mobile",
      className: "text-gray-400 text-sm font-medium",
      render: (value) => {
        const user = value as Participant["user"];
        return user?.mobile || "-";
      },
    },
    {
      key: "status",
      label: "Status",
      className: "text-center",
      render: (value, row) => {
        const p = row as Participant;
        const levelLabel: Record<string, string> = {
          branch: "Branch Mgr",
          section: "Section Mgr",
          department: "Dept Mgr",
          admin: "Admin",
        };
        const levelSuffix = p.currentApprovalLevel ? ` (${levelLabel[p.currentApprovalLevel] || p.currentApprovalLevel})` : "";
        let label = "Pending" + levelSuffix;
        let cls = "bg-yellow-50 text-yellow-700";
        if (p.workflowStatus === "fully_approved" || value === "1") {
          label = "Approved";
          cls = "bg-green-50 text-green-700";
        } else if (p.workflowStatus === "rejected" || value === "2") {
          label = "Rejected";
          cls = "bg-red-50 text-red-700";
        }
        return (
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Registered",
      className: "text-gray-400 text-sm font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
    {
      key: "id",
      label: "Action",
      className: "text-center",
      render: (value, row) => {
        const p = row as Participant;
        return (
          <div className="flex items-center justify-center gap-1">
            {p.status === "1" && (
              <button
                title="Cancel Registration"
                onClick={() => handleStatusChange(p.id, "2")}
                className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {p.status === "2" && (
              <button
                title="Re-approve"
                onClick={() => handleStatusChange(p.id, "1")}
                className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors cursor-pointer hover:bg-primary/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <button
              title="Remove Participant"
              onClick={() => setDeleteTarget(value as number)}
              className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ];

  const handleDeleteParticipant = useCallback(async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      const res = await deleteParticipantApi(deleteTarget);
      if (res.status) {
        toast.success(t.participants?.successDelete || "Participant removed successfully");
        const refreshed = await getParticipantsApi({ event_id: id, length: 500 });
        if (refreshed.status && refreshed.data?.data) {
          setParticipants(refreshed.data.data);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove participant");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, id, t]);

  const handleStatusChange = async (participantId: number, newStatus: string) => {
    const p = participants.find(x => x.id === participantId);
    setStatusChangeTarget({ id: participantId, status: newStatus, currentStatus: p?.status || "" });
  };

  const confirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    setStatusChanging(true);
    try {
      const res = await updateParticipantStatusApi(statusChangeTarget.id, statusChangeTarget.status);
      if (res.status || res.success) {
        toast.success(res.message || "Status updated");
        const refreshed = await getParticipantsApi({ event_id: id, length: 500 });
        if (refreshed.status && refreshed.data?.data) {
          setParticipants(refreshed.data.data);
        }
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setStatusChanging(false);
      setStatusChangeTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.events?.loading || "Loading..."}</p>
      </div>
    );
  }

  if (!event) return null;

  const isAllActivitiesCompleted = schedules.length > 0 && schedules.every((s) => {
    const winners = winnersByActivity[s.activity_id]?.winners;
    return winners && winners.length > 0;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/events" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">{t.events?.backToList || "Back to Events"}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Overview */}
          <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary">{t.events?.details || "Event Details"}</h2>
              <div className="flex items-center gap-2">
                {isAllActivitiesCompleted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-primary-green/8 text-primary-green">
                    <span className="w-2 h-2 rounded-full bg-primary-green" />
                    Completed
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${event.status === "1" ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${event.status === "1" ? "bg-primary-green" : "bg-red-500"}`} />
                  {event.status === "1" ? (t.events?.active || "Active") : (t.events?.inactive || "Inactive")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.eventName || "Event Name"} (English)</label>
                  <p className="text-secondary font-medium">{event.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.eventDescription || "Description"} (English)</label>
                  <p className="text-gray-600 whitespace-pre-wrap text-sm">{event.eventDescription || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.startDate || "Start Date"}</label>
                  <p className="text-secondary font-medium">{formatDate(event.startDate)}{event.startTime ? ` ${event.startTime}` : ""}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.endDate || "End Date"}</label>
                  <p className="text-secondary font-medium">{formatDate(event.endDate)}{event.endTime ? ` ${event.endTime}` : ""}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.regStartDate || "Registration Start"}</label>
                  <p className="text-secondary font-medium">{event.regStartDate ? formatDate(event.regStartDate) : "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.regEndDate || "Registration End"}</label>
                  <p className="text-secondary font-medium">{event.regEndDate ? formatDate(event.regEndDate) : "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.numberOfHour || "Number of Hours"}</label>
                  <p className="text-secondary font-medium">{event.numberOfHour ?? "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.ageRange || "Age Range"}</label>
                  <p className="text-secondary font-medium">{event.ageRange || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.year || "Year"}</label>
                  <p className="text-secondary font-medium">{event.yearLabel || event.year}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.eventName || "Event Name"} (Arabic)</label>
                  <p className="text-secondary font-medium" dir="rtl">{event.name_ar || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.eventDescription || "Description"} (Arabic)</label>
                  <p className="text-gray-600 whitespace-pre-wrap text-sm" dir="rtl">{event.eventDescription_ar || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.location || "Location"}</label>
                  <p className="text-secondary font-medium">{event.location || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.targetType || "Target Type"}</label>
                  <p className="text-secondary font-medium">{event.targetTypeLabel || event.targetType || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.teamName || "Team Name"}</label>
                  <p className="text-secondary font-medium">{event.teamNameLabel || event.teamName || "-"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary/50 mb-1">{t.events?.eventStatus || "Event Status"}</label>
                  <p className="text-secondary font-medium">{event.eventStatus === "0" ? (t.events?.upcoming || "Upcoming") : (t.events?.completed || "Completed")}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div><span className="font-semibold">{t.events?.createdAt || "Created"}:</span> {formatDate(event.createdAt)}</div>
              <div><span className="font-semibold">{t.events?.updatedAt || "Updated"}:</span> {formatDate(event.updatedAt)}</div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <Link to="/events" className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                {t.events?.backToList || "Back to List"}
              </Link>
              <Link to={`/events/edit/${event.id}`} className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">
                {t.events?.editEvent || "Edit Event"}
              </Link>
            </div>
          </div>

          {/* Activities & Schedules */}
          <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-secondary mb-4">{t.events?.activitySchedule || "Activity Schedule"}</h3>
            {schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules.map((sched) => {
                  const hasWinner = (winnersByActivity[sched.activity_id]?.winners?.length || 0) > 0;
                  const isMarkedComplete = markedCompleteIds.includes(sched.activity_id);
                  const scheduleEnded = isActivityScheduleEnded(sched);
                  const act = sportActivities.find((a) => a.id === sched.activity_id);
                  return (
                    <div key={sched.id || `${sched.activity_id}-${sched.event_id}`} className={`border rounded-lg p-4 ${hasWinner ? "border-primary-green/30 bg-primary-green/5" : "border-gray-200 bg-gray-50/30"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-secondary text-sm">{sched.activityName || `Activity #${sched.activity_id}`}</h4>
                          {hasWinner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-green/8 text-primary-green">
                              Winner Set
                            </span>
                          )}
                          {act?.isTeam === "1" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600">
                              Team
                            </span>
                          )}
                        </div>
                        {hasWinner ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-green/8 text-primary-green">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed
                          </span>
                        ) : isMarkedComplete ? (
                          <button
                            onClick={() => handleSetWinner(sched.activity_id, sched.activityName || `Activity #${sched.activity_id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            <TrophyIcon />
                            Set Winner
                          </button>
                        ) : scheduleEnded ? (
                          <button
                            onClick={() => handleMarkComplete(sched.activity_id, sched.activityName || `Activity #${sched.activity_id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Complete
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Upcoming
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="block text-xs font-semibold text-gray-500 mb-0.5">{t.events?.startDate || "Start Date"}</span>
                          <p className="font-medium text-secondary">{sched.start_date ? formatDate(sched.start_date) : "-"}</p>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-gray-500 mb-0.5">{t.events?.endDate || "End Date"}</span>
                          <p className="font-medium text-secondary">{sched.end_date ? formatDate(sched.end_date) : "-"}</p>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-gray-500 mb-0.5">{t.events?.startTime || "Start Time"}</span>
                          <p className="font-medium text-secondary">{sched.start_time || "-"}</p>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-gray-500 mb-0.5">{t.events?.endTime || "End Time"}</span>
                          <p className="font-medium text-secondary">{sched.end_time || "-"}</p>
                        </div>
                        {sched.description && (
                          <div className="sm:col-span-2 lg:col-span-4">
                            <span className="block text-xs font-semibold text-gray-500 mb-0.5">{t.events?.description || "Description"}</span>
                            <p className="text-gray-600">{sched.description}</p>
                          </div>
                        )}
                      </div>
                      {hasWinner && winnersByActivity[sched.activity_id] && (
                        <div className="mt-3 pt-3 border-t border-primary-green/20">
                          <div className="flex items-center gap-2 mb-2">
                            <TrophyIcon />
                            <span className="text-xs font-semibold text-primary-green">Winner{winnersByActivity[sched.activity_id].winners.length > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {winnersByActivity[sched.activity_id].winners.map((w: any) => (
                              <span key={w.user_id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-green/8 text-primary-green">
                                {w.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : linkedActivities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-secondary text-sm">{act.name}</p>
                      <p className="text-xs text-gray-400">ID: {act.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">{t.events?.noActivities || "No activities linked to this event"}</p>
            )}
          </div>

        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Event Poster */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-secondary mb-3">{t.events?.eventPoster || "Event Poster"}</h4>
            {getImageUrl(event.image) ? (
              <img
                src={getImageUrl(event.image)!}
                alt={event.name}
                className="w-full rounded-lg border border-gray-200 object-cover max-h-72"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.querySelector(".fallback")?.classList.remove("hidden");
                }}
              />
            ) : null}
            {!getImageUrl(event.image) ? (
              <DefaultImagePlaceholder className="w-full h-48" />
            ) : (
              <div className="fallback hidden">
                <DefaultImagePlaceholder className="w-full h-48" />
              </div>
            )}
          </div>

          {/* Event Coordinators */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-secondary mb-3">{t.events?.eventCoordinators || "Event Coordinators"}</h4>
            {coordinatorsList.length > 0 ? (
              <div className="space-y-3">
                {coordinatorsList.map((coord, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      {(coord.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary truncate">{coord.name}</p>
                      {coord.email && <p className="text-xs text-gray-400 truncate">{coord.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">{t.events?.noCoordinators || "No coordinators assigned"}</p>
            )}
          </div>

          {/* Event Admins */}
          {adminsList.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-secondary mb-3">{t.events?.eventAdmins || "Event Admins"}</h4>
              <div className="flex flex-wrap gap-2">
                {adminsList.map((admin, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {admin.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Progress */}
          {schedules.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-secondary mb-3">Activity Progress</h4>
              <div className="space-y-3">
                {schedules.map((sched) => {
                  const done = completedActivityIds.includes(sched.activity_id);
                  return (
                    <div key={sched.activity_id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-primary-green/10 text-primary-green" : "bg-gray-100 text-gray-400"}`}>
                        {done ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{schedules.indexOf(sched) + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${done ? "text-primary-green" : "text-secondary"}`}>
                          {sched.activityName || `Activity #${sched.activity_id}`}
                        </p>
                      </div>
                      {done && (
                        <span className="text-[10px] font-semibold text-primary-green">Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-secondary">{completedActivityIds.length}/{schedules.length}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${schedules.length > 0 ? (completedActivityIds.length / schedules.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-secondary mb-3">{t.events?.location || "Location"}</h4>
            <p className="text-sm text-secondary font-medium mb-1">{event.location || t.events?.noLocation || "Location not specified"}</p>
            {event.lat != null && event.lng != null && (
              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps?q=${event.lat},${event.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.events?.openInGoogleMaps || "Open in Google Maps"}
                </a>
              </div>
            )}
          </div>

          {/* View Participant Button */}
          <button
            onClick={() => setShowParticipantModal(true)}
            disabled={participantsLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {participantsLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Participant ({participants.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Targeted Employees */}
      {event?.targetType === "ragular" && event?.targetedEmployees === "selected" && (
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-secondary">Targeted Employees</h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
              {selectedEmployeesList.length} Total
            </span>
          </div>
          {selectedEmployeesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : selectedEmployeesList.length > 0 ? (
            <DataTable
              data={selectedEmployeesList}
              columns={selectedEmployeeColumns}
              perPageOptions={[5, 10, 20]}
              className="flex-1"
            />
          ) : (
            <p className="text-gray-400 text-sm">No targeted employees found</p>
          )}
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-secondary">{t.events?.participants || "Participants"}</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                  {participants.length} {t.events?.total || "Total"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {event?.targetType === "competitive" ? (
                  <button
                    onClick={() => setShowAddTeamModal(true)}
                    disabled={addParticipantLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Team
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddParticipantModal(true)}
                    disabled={addParticipantLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Participant
                  </button>
                )}
                <button onClick={() => setShowParticipantModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {participantsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : participants.length > 0 ? (
                event?.targetType === "competitive" ? (
                  <div className="space-y-4">
                    {Object.entries(
                      participants.reduce((acc: Record<string, { team: typeof participants[0]["team"]; members: typeof participants }>, p) => {
                        const key = p.team?.name || "Ungrouped";
                        if (!acc[key]) acc[key] = { team: p.team, members: [] };
                        acc[key].members.push(p);
                        return acc;
                      }, {})
                    ).map(([teamName, group]) => (
                      <div key={teamName} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div role="button" tabIndex={0} onClick={() => toggleTeam(teamName)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTeam(teamName); } }} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <div className="flex items-center gap-2">
                            <svg className={`w-5 h-5 text-primary transition-transform ${expandedTeams.has(teamName) ? "" : "-rotate-90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="font-bold text-secondary">{teamName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              title="Remove team"
                              onClick={e => { e.stopPropagation(); handleDeleteTeam(group.team?.id ?? 0); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors cursor-pointer hover:bg-red-100"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {expandedTeams.has(teamName) && (<table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 bg-white">
                              <th className="p-2.5 text-left font-semibold text-gray-500 text-xs">Name</th>
                              <th className="p-2.5 text-left font-semibold text-gray-500 text-xs">Email</th>
                              <th className="p-2.5 text-left font-semibold text-gray-500 text-xs">Mobile</th>
                              <th className="p-2.5 text-center font-semibold text-gray-500 text-xs">Status</th>
                              <th className="p-2.5 text-center w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {group.members.map((p) => (
                              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                      {(p.user?.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-secondary text-sm">{p.user?.name || "-"}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-gray-400 text-sm">{p.user?.email || "-"}</td>
                                <td className="p-2.5 text-gray-400 text-sm">{p.user?.mobile || "-"}</td>
                                <td className="p-2.5 text-center">
                                  {(() => {
                                    const levelLabel: Record<string, string> = {
                                      branch: "Branch Mgr",
                                      section: "Section Mgr",
                                      department: "Dept Mgr",
                                      admin: "Admin",
                                    };
                                    const levelSuffix = p.currentApprovalLevel ? ` (${levelLabel[p.currentApprovalLevel] || p.currentApprovalLevel})` : "";
                                    let label = "Pending" + levelSuffix;
                                    let cls = "bg-yellow-50 text-yellow-700";
                                    if (p.workflowStatus === "fully_approved" || p.status === "1") {
                                      label = "Approved";
                                      cls = "bg-green-50 text-green-700";
                                    } else if (p.workflowStatus === "rejected" || p.status === "2") {
                                      label = "Rejected";
                                      cls = "bg-red-50 text-red-700";
                                    }
                                    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
                                  })()}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {p.status === "1" && (
                                      <button
                                        title="Cancel Registration"
                                        onClick={() => handleStatusChange(p.id, "2")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors cursor-pointer hover:bg-red-100"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                    {p.status === "2" && (
                                      <button
                                        title="Re-approve"
                                        onClick={() => handleStatusChange(p.id, "1")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors cursor-pointer hover:bg-green-100"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      title="Remove"
                                      onClick={() => setDeleteTarget(p.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors cursor-pointer hover:bg-red-100"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable
                    data={participants}
                    columns={participantColumns}
                    perPageOptions={[5, 10, 20, 50]}
                    className="flex-1"
                  />
                )
              ) : (
                <p className="text-gray-400 text-sm">{t.events?.noParticipants || "No participants registered yet"}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      <EmployeeSelectionModal
        open={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        selected={[]}
        onSave={handleAddParticipant}
        filterOptions={filterOptions}
      />

      {/* Add Team Modal */}
      <TeamSelectionModal
        open={showAddTeamModal}
        onClose={() => setShowAddTeamModal(false)}
        selected={[]}
        onSave={handleAddTeam}
        activityId={event?.activityId}
        excludeTeamIds={participants.map(p => p.team?.id).filter(Boolean) as number[]}
      />

      {/* Set Winner Modal */}
      <SetWinnerModal
        open={showWinnerModal}
        onClose={() => { setShowWinnerModal(false); setWinnerModalActivity(null); }}
        activityId={winnerModalActivity?.id || 0}
        activityName={winnerModalActivity?.name || ""}
        eventId={Number(id)}
        eventType={event?.targetType || "ragular"}
        onSuccess={fetchWinners}
      />

      {/* Delete Participant Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={t.participants?.confirmDeleteTitle || "Remove Participant"}
        message={t.participants?.deleteWarning || "This action cannot be undone."}
        confirmLabel={t.participants?.delete || "Remove"}
        cancelLabel={t.participants?.cancel || "Cancel"}
        onConfirm={handleDeleteParticipant}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        open={statusChangeTarget !== null}
        title={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? "Cancel Registration"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? "Re-approve Participant"
              : "Change Status"
        }
        message={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? "This participant is already approved. Are you sure you want to cancel their registration?"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? "This participant was rejected. Are you sure you want to re-approve them?"
              : "Are you sure you want to change this participant's status?"
        }
        confirmLabel={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? "Yes, Cancel"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? "Yes, Re-approve"
              : "Yes"
        }
        cancelLabel="Cancel"
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChangeTarget(null)}
        loading={statusChanging}
      />
    </div>
  );
};

export default ViewEvent;