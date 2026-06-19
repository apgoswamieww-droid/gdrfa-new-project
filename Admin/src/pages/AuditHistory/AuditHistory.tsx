import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import { getApprovalHistoryApi } from "../../api/approvalHistory.api";
import SearchInput from "../../component/Input/SearchInput";
import { useTranslation } from "../../hooks/useTranslation";

interface ApprovalRecord {
  id: number;
  participate_id: number;
  approval_level: string;
  approver_id: string;
  approver_name: string;
  status: string;
  assigned_date: string;
  action_date: string | null;
  comment: string | null;
  event_id: number;
  activity_id: number | null;
  event_name_en: string;
  event_name_ar: string;
}

const levelLabels: Record<string, string> = {
  section: "Section Manager",
  department: "Department Manager",
  admin: "Admin",
  admin_override: "Admin Override",
};

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-yellow-50 text-yellow-600" },
    approved: { label: "Approved", cls: "bg-primary-green/8 text-primary-green" },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-50 text-gray-500" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
};

const AuditHistory = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApprovalHistoryApi({
        status: statusFilter || undefined,
      });
      if (res.status) {
        setData(res.data.data || []);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filteredData = data.filter(row =>
    !searchTerm ||
    row.event_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.event_name_ar.includes(searchTerm) ||
    row.approver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<ApprovalRecord>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] text-sm font-medium",
      render: (v) => v,
    },
    {
      key: "event_name_en",
      label: "Event",
      sortable: true,
      className: "font-medium text-black text-sm",
      render: (_v, row) => row.event_name_en || row.event_name_ar || `#${row.event_id}`,
    },
    {
      key: "approval_level",
      label: "Approval Level",
      sortable: true,
      className: "text-sm",
      render: (v) => (
        <span className="capitalize text-sm font-medium text-secondary">
          {levelLabels[v as string] || v}
        </span>
      ),
    },
    {
      key: "approver_name",
      label: "Approver",
      sortable: true,
      className: "text-[#898B8E] text-sm font-medium",
      render: (v) => v || "—",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (v) => statusBadge(v as string),
    },
    {
      key: "assigned_date",
      label: "Assigned Date",
      sortable: true,
      className: "text-[#898B8E] text-sm font-medium whitespace-nowrap",
      render: (v) =>
        v ? new Date(v as string).toLocaleDateString() : "—",
    },
    {
      key: "action_date",
      label: "Action Date",
      sortable: true,
      className: "text-[#898B8E] text-sm font-medium whitespace-nowrap",
      render: (v) =>
        v ? new Date(v as string).toLocaleDateString() : "—",
    },
    {
      key: "comment",
      label: "Comment",
      sortable: false,
      className: "text-[#898B8E] text-sm font-medium max-w-[200px] truncate",
      render: (v) => v || "—",
    },
  ];

  return (
    <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <h1 className="text-xl font-bold text-secondary">Approval History</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search by event name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="w-full sm:w-40 text-sm">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); fetchHistory(); }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          data={filteredData}
          columns={columns}
          perPageOptions={[10, 20, 50, 100]}
          className="flex-1"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AuditHistory;
