import { useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import type { Facility } from "../../api/facilities.api";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";

// ─── Icons ──────────────────
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

export default function FacilitiesTable({ 
  data, 
  onEdit, 
  onDelete,
  onToggleStatus
}: { 
  data: Facility[]; 
  onEdit: (data: Facility) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: string) => void;
}) {
  const { t } = useTranslation();

  const columns: Column<Facility>[] = useMemo(() => [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value,
    },
    {
      key: "image",
      label: "Image",
      className: "w-20",
      render: (value) => (
        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
          {value ? (
            <img 
              src={`${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${value}`} 
              alt="Facility" 
              className="w-full h-full object-cover" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "title",
      label: "Title (EN)",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light min-w-40",
      render: (value) => value,
    },
    {
      key: "title_ar",
      label: "Title (AR)",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light min-w-40 text-right",
      render: (value) => value,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (value, row) => {
        const isActive = value === "1";
        return (
          <button
            onClick={() => onToggleStatus(row.id, String(value))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/light text-base/light font-semibold transition-transform active:scale-95 cursor-pointer
            ${isActive ? "bg-primary-green/8 text-primary-green hover:bg-primary-green/10" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
            {isActive ? "Active" : "Inactive"}
          </button>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ], [t, onToggleStatus]);

  const actions = (row: Facility) => (
    <div className="flex items-center gap-1.5">
      <button
        title="Edit"
        onClick={() => onEdit(row)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
      >
        <EditIcon />
      </button>
      <span className="text-primary text-base">|</span>
      <button
        title="Delete"
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
      perPageOptions={[5, 10, 20]}
      className="flex-1"
    />
  );
}
