import { useState, useEffect } from "react";
import type { Column } from "../../component/Table/DataTable";
import DataTable from "../../component/Table/DataTable";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";
import { getFacilityRequestsApi, deleteFacilityRequestApi } from "../../api/facilityRequests.api";

// ─── Icons ───────────────────────────────────────────────────────
const ViewIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#0A2240" strokeWidth="1.5"/>
    <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#0A2240" strokeWidth="1.5"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="#7A2530" strokeWidth="1.5"/>
    <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.89805 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="#7A2530" strokeWidth="1.5"/>
    <path d="M9.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  switch (status) {
    case "1":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Approved
        </span>
      );
    case "2":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Rejected
        </span>
      );
    case "3":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Pending
        </button>
      );
  }
};

// ─── Facility Image ───────────────────────────────────────────────
const FacilityImage = ({ title, image }: { title?: string; image?: string }) => {
  if (image) {
    const imageUrl = `${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${image}`;
    return (
      <img src={imageUrl} alt={title || ""} className="w-10 h-10 rounded-lg object-cover shrink-0" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
};

interface FacilityRequest {
  id: number;
  facility_id: number;
  name: string;
  email: string;
  date: string;
  status: string;
  createdAt: string;
  title?: string;
  image?: string;
}

interface FacilityRequestsTableProps {
  searchTerm?: string;
  onView?: (row: FacilityRequest) => void;
  onStatusClick?: (id: number, name: string, facilityName: string) => void;
}

// ─── Main Component ──────────────────────────────────────────────
export default function FacilityRequestsTable({ searchTerm, onView, onStatusClick }: FacilityRequestsTableProps) {
  const [data, setData] = useState<FacilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getFacilityRequestsApi({
        start: (currentPage - 1) * itemsPerPage,
        length: itemsPerPage,
        search: searchTerm,
      });

      if (res?.status) {
        setData(res.data?.data || []);
        setTotalRecords(res.data?.recordsTotal || 0);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load facility requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  if (loading) {
    return <div className="bg-white rounded-xl p-5 text-center text-gray-400">Loading facility requests...</div>;
  }

  const handleDelete = async (id: number) => {
    const loadingToast = toast.loading("Deleting...");
    try {
      const res = await deleteFacilityRequestApi(id);
      if (res.status) {
        toast.success("Request deleted successfully!", { id: loadingToast });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete request", { id: loadingToast });
    }
  };

  const confirmDelete = (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">Are you sure you want to delete this request?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              await handleDelete(id);
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: { minWidth: '350px', borderRadius: '24px', padding: '16px' }
    });
  };

  const columns: Column<FacilityRequest>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-gray-500 text-sm font-medium",
      render: (value) => value,
    },
    {
      key: "title",
      label: "Facility",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <FacilityImage title={row.title} image={row.image} />
          <div>
            <div className="font-semibold text-gray-900 text-sm">{row.title || "-"}</div>
            <div className="text-xs text-gray-500">#{row.facility_id || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      label: "Requester",
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{row.name || "-"}</div>
          <div className="text-xs text-gray-500">{row.email || "-"}</div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Requested Date",
      sortable: true,
      className: "text-gray-600 text-sm",
      render: (value) => value ? formatDate(value as string, true) : "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (_, row) => (
        <StatusBadge 
          status={row.status} 
          onClick={() => onStatusClick?.(row.id, row.name, row.title || "Unknown Facility")} 
        />
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      className: "text-gray-600 text-sm whitespace-nowrap",
      render: (value) => value ? formatDate(value as string, false) : "-",
    },
  ];

  const actions = (row: FacilityRequest) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View"
        onClick={() => onView?.(row)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"
      >
        <ViewIcon />
      </button>
      <span className="text-primary text-base">|</span>
      <button
        title="Delete"
        onClick={() => confirmDelete(row.id)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"
      >
        <DeleteIcon />
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4 text-sm text-gray-500">Total requests: {totalRecords}</div>
      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        perPageOptions={[5, 10, 20, 50]}
        className="flex-1"
      />
    </div>
  );
}
