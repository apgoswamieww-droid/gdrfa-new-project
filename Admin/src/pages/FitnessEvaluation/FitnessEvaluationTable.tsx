import { useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import type { FitnessEvaluation } from "../../api/fitnessEvaluation.api";

// ─── Icons ──────────────────
const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C5 5 1 12 1 12C1 12 5 19 12 19C19 19 23 12 23 12C23 12 19 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function FitnessEvaluationTable({
  data,
  onView,
  onEdit,
  onDelete,
  loading,
  totalRecords,
}: {
  data: FitnessEvaluation[];
  onView: (row: FitnessEvaluation) => void;
  onEdit: (row: FitnessEvaluation) => void;
  onDelete: (row: FitnessEvaluation) => void;
  loading?: boolean;
  totalRecords?: number;
}) {
  const columns: Column<FitnessEvaluation>[] = useMemo(() => [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => String(value ?? ""),
    },
    {
      key: "grp",
      label: "GRP",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light",
      render: (value) => String(value ?? ""),
    },
    {
      key: "employee_name",
      label: "Name",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light",
      render: (value) => String(value ?? ""),
    },
    {
      key: "total_points",
      label: "Evaluation Result",
      sortable: true,
      className: "text-center",
      render: (value) => {
        if (value !== null && value !== undefined) {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {Number(value).toFixed(2).replace(/\.00$/, '')} pts
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            Pending
          </span>
        );
      },
    },
    {
      key: "year",
      label: "Year",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => String(value ?? ""),
    },
  ], []);

  const actions = (row: FitnessEvaluation) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View Details"
        onClick={() => onView(row)}
        className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors cursor-pointer hover:bg-green-100"
      >
        <ViewIcon />
      </button>
      <button
        title="Edit"
        onClick={() => onEdit(row)}
        className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors cursor-pointer hover:bg-blue-100"
      >
        <EditIcon />
      </button>
      <button
        title="Delete"
        onClick={() => onDelete(row)}
        className="min-w-8 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors cursor-pointer hover:bg-red-100"
      >
        <TrashIcon />
      </button>
    </div>
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20]}
      className="flex-1"
      loading={loading}
      totalRecords={totalRecords}
    />
  );
}
