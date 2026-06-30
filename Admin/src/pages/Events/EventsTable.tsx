import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "../../component/Table/DataTable";
import { getEventsApi, deleteEventApi, changeEventStatusApi, updateEventStatusApi } from "../../api/events.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";
import { hasPermission, getAdminRoleId } from "../../utils/permissions";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

const getImageUrl = (path?: string) => {
  if (!path) return "";
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
};

// ─── Icons ──────────────────────────────────────────────────────
const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C7.27273 5 3.58333 7.94209 2 12C3.58333 16.0579 7.27273 19 12 19C16.7273 19 20.4167 16.0579 22 12C20.4167 7.94209 16.7273 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H11C8.79086 15 7 16.7909 7 19V21" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21V19C20.9998 17.9088 20.5832 16.8607 19.8396 16.08" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 21V19C3.00018 17.9088 3.41677 16.8607 4.16037 16.08" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.86 4.13C17.3022 4.46582 17.6684 4.88875 17.9368 5.37261C18.2053 5.85646 18.3692 6.39016 18.4178 6.94138C18.4663 7.4926 18.3982 8.04794 18.2182 8.57113C18.0381 9.09432 17.7503 9.57318 17.374 9.976" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.14 4.13C6.69781 4.46582 6.33158 4.88875 6.06316 5.37261C5.79473 5.85646 5.63084 6.39016 5.58227 6.94138C5.5337 7.4926 5.60178 8.04794 5.78183 8.57113C5.96187 9.09432 6.24969 9.57318 6.62601 9.976" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.17157 19.8284L19.8285 8.17157C20.3737 7.62632 20.6463 7.3537 20.7921 7.0596C21.0694 6.50005 21.0694 5.8431 20.7921 5.28354C20.6463 4.98945 20.3737 4.71682 19.8285 4.17157C19.2832 3.62632 19.0106 3.3537 18.7165 3.20796C18.1569 2.93068 17.5 2.93068 16.9404 3.20796C16.6463 3.3537 16.3737 3.62632 15.8285 4.17157L4.17157 15.8284C3.59351 16.4064 3.30448 16.6955 3.15224 17.063C3 17.4305 3 17.8393 3 18.6568V20.9999H5.34314C6.16065 20.9999 6.5694 20.9999 6.93694 20.8477C7.30448 20.6955 7.59351 20.4064 8.17157 19.8284Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21H18" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  const { t } = useTranslation();
  const isActive = status === "1";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/tight text-base/tight font-semibold transition-transform active:scale-95 cursor-pointer
      ${isActive ? "bg-primary-green/8 text-primary-green hover:bg-primary-green/10" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
      {isActive ? t.events?.active || "Active" : t.events?.inactive || "Inactive"}
    </button>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export default function EventsTable({ searchTerm, onRefresh }: { searchTerm: string; onRefresh: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusModalEvent, setStatusModalEvent] = useState<any | null>(null);

  const ADMIN_ROLE_ID = import.meta.env.VITE_ADMINROLEID || "3C440A49-C079-479E-9747-53296DEC4D29";
  const EVENT_COORDINATOR_ROLE_ID = import.meta.env.VITE_EVENTCOORDINATORROLEID || "93F59035-41A2-4A4A-A7D8-189EE28197E3";
  const currentRoleId = getAdminRoleId();
  const canApproveEvent = hasPermission("approve-event") || currentRoleId === ADMIN_ROLE_ID || currentRoleId === EVENT_COORDINATOR_ROLE_ID;

  const handleEventStatusChange = async (id: number, eventStatus: "0" | "1" | "2") => {
    setStatusModalEvent(null);
    const loadingToast = toast.loading("Updating event status...");
    try {
      const res = await updateEventStatusApi(id, eventStatus);
      if (res.status) {
        toast.success(res.message || "Event status updated", { id: loadingToast });
        fetchEvents();
      } else {
        toast.error(res.message || "Failed to update status", { id: loadingToast });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update event status", { id: loadingToast });
    }
  };

  const fetchEvents = () => {
    setLoading(true);
    getEventsApi()
      .then((res) => {
        if (res?.data?.data) setData(res.data.data);
      })
      .catch((e) => {
        console.warn("Events fetch error:", e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((event: any) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === "1" ? "0" : "1";
    const loadingToast = toast.loading(t.events?.updating || "Updating...");
    try {
      const res = await changeEventStatusApi(row.id, newStatus);
      if (res.status) {
        toast.success(t.events?.successUpdate || "Updated successfully!", { id: loadingToast });
        fetchEvents();
      }
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast.error(error.message || (t.events?.errorFetch || "Failed to fetch events"), { id: loadingToast });
    }
  };

  const handleDeleteEvent = (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">{t.events?.confirmDelete || "Are you sure you want to delete this event?"}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.events?.cancel || "Cancel"}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.events?.deleting || "Deleting...");
              try {
                await deleteEventApi(id);
                toast.success(t.events?.successDelete || "any deleted successfully!", { id: loadingToast });
                fetchEvents();
                onRefresh();
              } catch (error: any) {
                console.error("Failed to delete any:", error);
                toast.error(error.message || (t.events?.errorFetch || "Failed to fetch events"), { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.events?.delete || "Delete"}
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: {
        minWidth: '350px',
        borderRadius: '24px',
        padding: '16px'
      }
    });
  };

  const columns: Column<any>[] = [
    {
      key: "id",
      label: t.events?.id || "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => value,
    },
    {
      key: "name",
      label: t.events?.name || "any Name",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/tight text-base/tight",
      render: (_, row) => {
        const imageUrl = getImageUrl(row.image);
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {row.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <span>{row.name}</span>
          </div>
        );
      },
    },
    {
      key: "regStartDate",
      label: "Reg Start Date",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (value ? formatDate(value as string) : "-"),
    },
    {
      key: "regEndDate",
      label: "Reg End Date",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (value ? formatDate(value as string) : "-"),
    },
    {
      key: "targetType",
      label: "Target Type",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === "competitive" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
        }`}>
          {value === "competitive" ? "Team Event" : "Individual Event"}
        </span>
      ),
    },
    {
      key: "targetedEmployees",
      label: "Targeted Employee",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === "selected" ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
        }`}>
          {value === "selected" ? "Targeted Group" : value === "all" ? "All Employee" : "-"}
        </span>
      ),
    },
    {
      key: "eventActiveStatus",
      label: "Active Status",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === "2" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
        }`}>
          {value === "2" ? "Completed" : "In Progress"}
        </span>
      ),
    },
    {
      key: "eventStatus",
      label: "Event Status",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium relative",
      render: (value, row) => {
        const statusLabel = value === "0" ? "Pending" : value === "1" ? "Approved" : "Rejected";
        const statusColor = value === "0" ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : value === "1" ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200";
        return (
          <button
            onClick={() => setStatusModalEvent(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor} ${canApproveEvent ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            disabled={!canApproveEvent}
          >
            {statusLabel}
          </button>
        );
      },
    },
    {
      key: "status",
      label: t.events?.status || "Status",
      sortable: true,
      className: "",
      render: (_, row) => <StatusBadge status={row.status} onClick={() => handleToggleStatus(row)} />,
    },
  ];

  const isManageDisabled = (row: any) => {
    return row.eventActiveStatus === '2';
  };

  const actions = (row: any) => {
    const manageDisabled = isManageDisabled(row);
    return (
      <div className="flex items-center gap-1.5">
        <button
          title="View any"
          onClick={() => navigate(`/events/view/${row.id}`)}
          className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
        >
          <ViewIcon />
        </button>
        <span className="text-primary text-base">|</span>
        <button
          title={manageDisabled ? "Manage Activity & Players (disabled)" : "Manage Activity & Players"}
          disabled={manageDisabled}
          onClick={() => { if (!manageDisabled) navigate(`/events/${row.id}/activities`); }}
          className={`2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg transition-colors ${manageDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-light-blue/20 cursor-pointer hover:bg-light-blue/10"}`}
        >
          <ActivityIcon />
        </button>
        <span className="text-primary text-base">|</span>
        <button
          title={t.events?.edit || "Edit"}
          onClick={() => navigate(`/events/edit/${row.id}`)}
          className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
        >
          <EditIcon />
        </button>
        <span className="text-primary text-base">|</span>
        <button
          title={t.events?.delete || "Delete"}
          onClick={() => handleDeleteEvent(row.id)}
          className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"
        >
          <DeleteIcon />
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="bg-white rounded-xl p-5 text-center text-gray-400">{t.events?.loading || "Loading events..."}</div>;
  }

  if (error) {
    return <div className="bg-white rounded-xl p-5 text-center text-red-500">{t.events?.errorFetch || "Failed to fetch events"}</div>;
  }

  return (
    <div className="relative">
      <DataTable
        data={filteredData}
        columns={columns}
        actions={actions}
        perPageOptions={[5, 10, 20, 50]}
        className="flex-1"
      />

      {statusModalEvent && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setStatusModalEvent(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setStatusModalEvent(null)}>
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setStatusModalEvent(null)}
                className="absolute top-3 end-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Event Status</h3>
              <p className="text-sm text-gray-500 mb-4">{statusModalEvent.name}</p>
              <p className="text-xs text-gray-400 mb-4">
                Current Status: <span className="font-medium text-gray-700">
                  {statusModalEvent.eventStatus === "0" ? "Pending" : statusModalEvent.eventStatus === "1" ? "Approved" : "Rejected"}
                </span>
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleEventStatusChange(statusModalEvent.id, "1")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer text-sm font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  <div className="text-start">
                    <div>Approve</div>
                    <div className="text-xs text-green-600 font-normal">Activate this event for participation</div>
                  </div>
                </button>
                <button
                  onClick={() => handleEventStatusChange(statusModalEvent.id, "0")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors cursor-pointer text-sm font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                  <div className="text-start">
                    <div>Mark Pending</div>
                    <div className="text-xs text-yellow-600 font-normal">Set event back to pending review</div>
                  </div>
                </button>
                <button
                  onClick={() => handleEventStatusChange(statusModalEvent.id, "2")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer text-sm font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <div className="text-start">
                    <div>Reject</div>
                    <div className="text-xs text-red-600 font-normal">Reject and prevent event from proceeding</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
