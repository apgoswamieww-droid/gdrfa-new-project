import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Column } from "../../component/Table/DataTable";
import DataTable from "../../component/Table/DataTable";
import { formatDate } from "../../utils/dateUtils";
import { getTeamsApi, changeTeamStatusApi, getActivitiesApi } from "../../api/teams.api";
import type { Team } from "../../api/teams.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";

// ─── Icons ────────────────────────────────────────────────────────
const MembersIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.481 11.3499C15.803 11.4475 16.1445 11.5 16.4983 11.5C18.4313 11.5 19.9983 9.933 19.9983 8C19.9983 6.067 18.4313 4.5 16.4983 4.5C14.6834 4.5 13.1911 5.8814 13.0156 7.65013" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 19.5C17.5 16.7386 15.0376 14.5 12 14.5C8.96243 14.5 6.5 16.7386 6.5 19.5" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#0A2240" strokeWidth="1.5"/>
    <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#0A2240" strokeWidth="1.5"/>
  </svg>
);

const EditIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.17157 19.8284L19.8285 8.17157C20.3737 7.62632 20.6463 7.3537 20.7921 7.0596C21.0694 6.50005 21.0694 5.8431 20.7921 5.28354C20.6463 4.98945 20.3737 4.71682 19.8285 4.17157C19.2832 3.62632 19.0106 3.3537 18.7165 3.20796C18.1569 2.93068 17.5 2.93068 16.9404 3.20796C16.6463 3.3537 16.3737 3.62632 15.8285 4.17157L4.17157 15.8284C3.59351 16.4064 3.30448 16.6955 3.15224 17.063C3 17.4305 3 17.8393 3 18.6568V20.9999H5.34314C6.16065 20.9999 6.5694 20.9999 6.93694 20.8477C7.30448 20.6955 7.59351 20.4064 8.17157 19.8284Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21H18" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 5.5L18.5 9.5" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status, onClick }: { status: any; onClick?: () => void }) => {
  const { t } = useTranslation();
  
  // Extremely robust check for active status
  const isActive = 
    status === "1" || 
    status === 1 || 
    status === true || 
    String(status || "").toLowerCase().trim() === "1" || 
    String(status || "").toLowerCase().trim() === "active";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/tight text-base/tight font-semibold transition-transform active:scale-95 cursor-pointer
      ${isActive ? "bg-primary-green/8 text-primary-green hover:bg-primary-green/10" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
      {isActive ? t.team.active : t.team.inactive}
    </button>
  );
};

// ─── Avatar ────────────────────────────────────────────────────────
const TeamAvatar = ({ name, image }: { name: string; image?: string | null }) => {
  if (image) {
    const baseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/").replace(/\/$/, "");
    const imagePath = image.startsWith("/") ? image : `/${image}`;
    const imageUrl = `${baseUrl}${imagePath}`;
    return (
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-12 min-w-12 h-12 rounded-full object-cover shrink-0" 
        onError={(e) => {
           (e.target as HTMLImageElement).style.display = 'none';
           (e.target as HTMLImageElement).parentElement?.classList.add('bg-[#eef0f8]');
        }}
      />
    );
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-12 min-w-12 h-12 rounded-full bg-[#eef0f8] flex items-center justify-center text-[11px] font-bold text-secondary shrink-0">
      {initials}
    </div>
  );
};

interface TeamTableProps {
    searchTerm?: string;
    onEdit: (team: Team) => void;
    onDelete: (id: number) => void;
}

// ─── Main Component ────────────────────────────────────────────────
export default function TeamTable({ searchTerm, onEdit, onDelete }: TeamTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<{ value: string; label: string }[]>([]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // 1. Fetch Teams
      const response = await getTeamsApi({ search: searchTerm });
      console.log("Teams API Response:", response);

      if (response.status) {
        let teamsArray: Team[] = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          // Case: ApiResponse<Team[]>
          teamsArray = response.data;
        } else if (response.data && typeof response.data === "object") {
          // Case: ApiResponse<TeamListResponse> where TeamListResponse has a data property
          const dataObj = response.data as any;
          if (Array.isArray(dataObj.data)) {
            teamsArray = dataObj.data;
          } else if (Array.isArray(dataObj)) {
             teamsArray = dataObj;
          }
        }
        
        setData(teamsArray);
      }

      // 2. Fetch Activities separately (don't block teams if this fails)
      try {
        const actRes = await getActivitiesApi();
        if (actRes.status && Array.isArray(actRes.data)) {
          setActivities(actRes.data.map((a: any) => ({ value: a.id.toString(), label: a.name })));
        }
      } catch (actError) {
        console.warn("Failed to fetch activities:", actError);
      }
    } catch (error: any) {
      console.error("Failed to fetch teams:", error);
      toast.error(error.message || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const getActivityName = (activityId: string) => {
    const activity = activities.find((a) => a.value === activityId);
    return activity ? activity.label : activityId;
  };

  const handleToggleStatus = async (row: Team) => {
    const currentStatus = String(row.status);
    const newStatus = currentStatus === "1" ? "0" : "1";
    const loadingToast = toast.loading("Updating...");
    try {
      const res = await changeTeamStatusApi(row.id, newStatus);
      if (res.status) {
        toast.success("Status updated successfully", { id: loadingToast });
        fetchTeams();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [searchTerm]);

  const columns: Column<Team>[] = [
    {
      key: "id",
      label: t.team.id,
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (value && typeof value === "object" ? (value as { id: string; name: string }).name : String(value ?? "")),
    },
    {
      key: "name",
      label: t.team.info,
      sortable: true,
      render: (_, r: any) => {
        const teamName = r.name || r.team_name || "-";
        const teamImage = r.image || r.team_image || r.logo;
        const activity = r.activityNames || r.activity_names || r.activity || r.activity_id || "-";
        
        return (
          <div className="flex items-center gap-2">
            <TeamAvatar name={teamName} image={teamImage} />
            <div>
              <div className="font-medium text-black 2xl:text-base/tight text-base/tight">{teamName}</div>
              <div className="text-sm font-medium text-gray-400">{getActivityName(String(activity))}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "teamManager",
      label: t.team.manager,
      sortable: true,
      className: "text-black font-medium 2xl:text-base/tight text-base/tight",
      render: (_, r: any) => {
        // Handle direct string or staffNames array
        if (r.teamManager || r.team_manager || r.manager) {
          return r.teamManager || r.team_manager || r.manager;
        }
        if (Array.isArray(r.staffNames)) {
          return r.staffNames.map((s: any) => s.nameEn || s.nameAr || s.name).join(", ");
        }
        if (Array.isArray(r.staff_names)) {
          return r.staff_names.map((s: any) => s.nameEn || s.nameAr || s.name).join(", ");
        }
        return "-";
      },
    },
    {
      key: "numberOfMembers",
      label: t.team.members,
      sortable: true,
      className: "text-center",
      render: (value, r: any) => {
        const count = value ?? r.number_of_members ?? r.members_count ?? r.total_members ?? r.capacity ?? 0;
        return (
          <span className="flex items-center justify-center w-12 2xl:h-9 h-8 rounded-full bg-light-blue/20 text-light-blue 2xl:text-base/tight text-base/tight font-medium mx-auto">
            {count}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: t.team.createdAt,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium whitespace-nowrap",
      render: (value, r: any) => formatDate((value || r.created_at || r.date_added) as string),
    },
    {
      key: "status",
      label: t.team.status,
      sortable: true,
      className: "text-center",
      render: (value, row: any) => {
        const actualStatus = value !== undefined ? value : (row.status ?? row.team_status ?? row.is_active ?? row.active);
        return <StatusBadge status={actualStatus} onClick={() => handleToggleStatus(row)} />;
      },
    },
  ];

  const actions = (row: Team) => (
    <div className="flex items-center gap-1.5">
      {/* Members */}
      <button 
        title="View Members" 
        onClick={() => navigate(`/teams/${row.id}/members`)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
      >
        <MembersIcon />
      </button>
      <span className="text-primary text-base">|</span>

      {/* View */}
      <button title={t.common.view} onClick={() => navigate(`/teams/${row.id}`)} className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10">
        <ViewIcon />
      </button>
      <span className="text-primary text-base">|</span>

      {/* Edit */}
      <button 
        title={t.team.edit} 
        onClick={() => onEdit(row)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
      >
        <EditIcon />
      </button>
      <span className="text-primary text-base">|</span>

      {/* Delete */}
      <button 
        title={t.team.delete} 
        onClick={() => onDelete(row.id)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"
      >
        <DeleteIcon />
      </button>
    </div>
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20, 50]}
      className="flex-1"
      loading={loading}
    />
  );
}
