import { useEffect, useState, useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import type { AdminUser } from "../../api/adminUsers.api";
import { getAdminUsersApi, changeAdminUserStatusApi } from "../../api/adminUsers.api";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateUtils";
import { useTranslation } from "../../hooks/useTranslation";

// ─── Icons ──────────────────
const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C5 5 1 12 1 12C1 12 5 19 12 19C19 19 23 12 23 12C23 12 19 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Status Badge ──────────────────
const StatusBadge = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  const { t } = useTranslation();
  const isActive = status === "1";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/light text-base/light font-semibold transition-transform active:scale-95 cursor-pointer
      ${isActive ? "bg-primary-green/8 text-primary-green hover:bg-primary-green/10" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
      {isActive ? t.adminUser.active : t.adminUser.inactive}
    </button>
  );
};

// ─── Main Component ───────────────
export default function AdminUsersTable({ searchTerm, onView, onEdit: _onEdit }: { 
  searchTerm: string; 
  onView: (data: AdminUser) => void; 
  onEdit?: (data: AdminUser) => void;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    getAdminUsersApi()
      .then((users) => {
        if (users) setData(users);
      })
      .catch((e) => {
        console.warn("Admin users fetch error:", e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.mobile && user.mobile.includes(searchTerm))
    );
  }, [data, searchTerm]);

  const handleToggleStatus = async (row: AdminUser) => {
    const newStatus = row.status === "1" ? "0" : "1";
    const loadingToast = toast.loading("Updating...");
    try {
      await changeAdminUserStatusApi(row.id, newStatus);
      toast.success("Status updated successfully", { id: loadingToast });
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "id",
      label: t.adminUser.id,
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value,
    },
    {
      key: "name",
      label: t.adminUser.name,
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light",
      render: (value) => value,
    },
    {
      key: "email",
      label: t.adminUser.email,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value,
    },
    {
      key: "mobile",
      label: t.adminUser.mobile,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value || "-",
    },
    {
      key: "role_name",
      label: t.adminUser.role,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value || "-",
    },
    {
      key: "status",
      label: t.adminUser.status,
      sortable: true,
      className: "text-center",
      render: (_, row) => <StatusBadge status={row.status} onClick={() => handleToggleStatus(row)} />,
    },
    {
      key: "createdAt",
      label: t.adminUser.createdAt,
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ];

  const actions = (row: AdminUser) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View"
        onClick={() => onView(row)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-green-50 transition-colors cursor-pointer hover:bg-green-100"
      >
        <ViewIcon />
      </button>
    </div>
  );

  if (loading) {
    return <div className="bg-white rounded-xl p-5 text-center text-gray-400">{t.adminUser.loading}</div>;
  }

  if (error) {
    return <div className="bg-white rounded-xl p-5 text-center text-red-500">{t.adminUser.errorFetch}</div>;
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
