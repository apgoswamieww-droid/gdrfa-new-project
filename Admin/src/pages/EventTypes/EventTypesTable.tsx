import { useEffect, useState, useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import { getEventTypesApi, deleteEventTypeApi, changeEventTypeStatusApi } from "../../api/event-types.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";

// ─── Icons ──────────────────────────────────────────────────────
const EditIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.17157 19.8284L19.8285 8.17157C20.3737 7.62632 20.6463 7.3537 20.7921 7.0596C21.0694 6.50005 21.0694 5.8431 20.7921 5.28354C20.6463 4.98945 20.3737 4.71682 19.8285 4.17157C19.2832 3.62632 19.0106 3.3537 18.7165 3.20796C18.1569 2.93068 17.5 2.93068 16.9404 3.20796C16.6463 3.3537 16.3737 3.62632 15.8285 4.17157L4.17157 15.8284C3.59351 16.4064 3.30448 16.6955 3.15224 17.063C3 17.4305 3 17.8393 3 18.6568V20.9999H5.34314C6.16065 20.9999 6.5694 20.9999 6.93694 20.8477C7.30448 20.6955 7.59351 20.4064 8.17157 19.8284Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21H18" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      {isActive ? t.eventType.active : t.eventType.inactive}
    </button>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export default function EventTypesTable({ searchTerm, onEdit, onRefresh }: { searchTerm: string; onEdit: (data: any) => void; onRefresh: () => void }) {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch Event Types function
  const fetchEventTypes = () => {
    setLoading(true);
    getEventTypesApi()
      .then((res) => {
        if (res?.data?.data) setData(res.data.data);
      })
      .catch((e) => {
        console.warn("Event Type fetch error:", e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((eventType) =>
      eventType.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === "1" ? "0" : "1";
    const loadingToast = toast.loading(t.eventType.updating);
    try {
      const res = await changeEventTypeStatusApi(row.id, newStatus);
      if (res.status) {
        toast.success(t.eventType.successUpdate, { id: loadingToast });
        fetchEventTypes();
      }
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast.error(error.message || t.eventType.errorFetch, { id: loadingToast });
    }
  };

  const handleDeleteEventType = (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">{t.eventType.confirmDelete}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.eventType.cancel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.eventType.deleting);
              try {
                await deleteEventTypeApi(id);
                toast.success(t.eventType.successDelete, { id: loadingToast });
                fetchEventTypes();
                onRefresh();
              } catch (error: any) {
                console.error("Failed to delete Event Type:", error);
                toast.error(error.message || t.eventType.errorFetch, { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.eventType.delete}
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
      label: t.eventType.id,
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => value,
    },
    {
      key: "name",
      label: t.eventType.name,
      sortable: true,
      className: "font-medium text-black 2xl:text-base/tight text-base/tight",
      render: (value) => value,
    },
    {
      key: "status",
      label: t.eventType.status,
      sortable: true,
      className: "text-center",
      render: (_, row) => <StatusBadge status={row.status} onClick={() => handleToggleStatus(row)} />,
    },
    {
      key: "createdAt",
      label: t.eventType.createdAt,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ];

  const actions = (row: any) => (
    <div className="flex items-center gap-1.5">
      <button
        title={t.eventType.edit}
        onClick={() => onEdit(row)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
      >
        <EditIcon />
      </button>
      <span className="text-primary text-base">|</span>
      <button
        title={t.eventType.delete}
        onClick={() => handleDeleteEventType(row.id)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"
      >
        <DeleteIcon />
      </button>
    </div>
  );

  if (loading) {
    return <div className="bg-white rounded-xl p-5 text-center text-gray-400">{t.eventType.loading}</div>;
  }

  if (error) {
    return <div className="bg-white rounded-xl p-5 text-center text-red-500">{t.eventType.errorFetch}</div>;
  }

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20, 50]}
      className="flex-1"
    />
  );
}
