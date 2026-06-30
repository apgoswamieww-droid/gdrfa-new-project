import { useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import type { Participant } from "../../api/participants.api";

import { formatDate } from "../../utils/dateUtils";

// ─── Icons ──────────────────
const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C5 5 1 12 1 12C1 12 5 19 12 19C19 19 23 12 23 12C23 12 19 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EvaluationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

export default function ParticipantsTable({ 
  data, 
  onView, 
  onStatusChange,
  onEvaluate,
  onDelete
}: { 
  data: Participant[]; 
  onView: (data: Participant) => void;
  onStatusChange: (id: number, status: string) => void;
  onEvaluate?: (data: Participant) => void;
  onDelete?: (id: number) => void;
}) {
  const columns: Column<Participant>[] = useMemo(() => [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => String(value ?? ""),
    },
    {
      key: "user",
      label: "Participant",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light",
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-gray-500">{user.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "event",
      label: "Event",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (event: any) => event.name,
    },
    {
      key: "team",
      label: "Team",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (team: any) => team?.name || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (value, row) => {
        const p = row as Participant;
        const levelLabel: Record<string, string> = {
          section: "Section Mgr",
          department: "Dept Mgr",
          admin: "Admin",
        };
        const levelSuffix = p.currentApprovalLevel ? ` (${levelLabel[p.currentApprovalLevel] || p.currentApprovalLevel})` : "";

        let statusClass = "bg-yellow-50 text-yellow-600";
        let statusLabel = "Pending" + levelSuffix;
        let dotClass = "bg-yellow-500";

        if (p.workflowStatus === "fully_approved" || value === "1") {
          statusClass = "bg-green-50 text-green-600";
          statusLabel = "Approved";
          dotClass = "bg-green-500";
        } else if (p.workflowStatus === "rejected" || value === "2") {
          statusClass = "bg-red-50 text-red-600";
          statusLabel = "Rejected";
          dotClass = "bg-red-500";
        }

        const flowStages = ["section", "department", "admin"];
        const currentIdx = flowStages.indexOf(p.currentApprovalLevel || "");

        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {statusLabel}
            </span>
            {(p.status === "0" || p.workflowStatus === "in_progress") && currentIdx >= 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                {flowStages.map((stage, i) => (
                  <span key={stage} className={`flex items-center gap-0.5 ${i <= currentIdx ? "text-primary font-semibold" : "text-gray-300"}`}>
                    {i > 0 && <span className="mx-0.5">→</span>}
                    {levelLabel[stage]}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Requested At",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ], []);

  const actions = (row: Participant) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View Details"
        onClick={() => onView(row)}
        className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors cursor-pointer hover:bg-green-100"
      >
        <ViewIcon />
      </button>
      
      {onEvaluate && (
        <button
          title="Add Evaluation"
          onClick={() => onEvaluate(row)}
          className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors cursor-pointer hover:bg-blue-100"
        >
          <EvaluationIcon />
        </button>
      )}

      {row.status === "0" && (
        <>
          <button
            title="Approve"
            onClick={() => onStatusChange(row.id, "1")}
            className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors cursor-pointer hover:bg-primary/20"
          >
            <CheckIcon />
          </button>
          <button
            title="Reject"
            onClick={() => onStatusChange(row.id, "2")}
            className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
          >
            <XIcon />
          </button>
        </>
      )}
      {row.status === "1" && (
        <button
          title="Cancel Registration"
          onClick={() => onStatusChange(row.id, "2")}
          className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
        >
          <XIcon />
        </button>
      )}
      {row.status === "2" && (
        <button
          title="Re-approve"
          onClick={() => onStatusChange(row.id, "1")}
          className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors cursor-pointer hover:bg-primary/20"
        >
          <CheckIcon />
        </button>
      )}

      {onDelete && (
        <button
          title="Remove Participant"
          onClick={() => onDelete(row.id)}
          className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20]}
      className="flex-1"
    />
  );
}
