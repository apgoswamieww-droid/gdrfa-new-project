import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "../../component/Table/DataTable";
import { getMediaListApi } from "../../api/media.api";
import { changeStatusApi } from "../../api/request";
import toast from "react-hot-toast";

import { formatDate } from "../../utils/dateUtils";

const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#0A2240" strokeWidth="1.5" />
    <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#0A2240" strokeWidth="1.5" />
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

const FileTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    image: "bg-blue-50 text-blue-600",
    video: "bg-purple-50 text-purple-600",
    document: "bg-amber-50 text-amber-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[type] || "bg-gray-50 text-gray-600"}`}>
      {type}
    </span>
  );
};

const StatusBadge = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  const isActive = status === "1";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/tight text-base/tight font-semibold transition-transform active:scale-95 cursor-pointer
      ${isActive ? "bg-primary-green/8 text-primary-green hover:bg-primary-green/10" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
      {isActive ? "Active" : "Inactive"}
    </button>
  );
};

const MediaPreview = ({ row }: { row: any }) => {
  if (!row.file_url) return <span className="text-gray-400">-</span>;
  if (row.fileType === "image") {
    return <img src={row.file_url} alt={row.title} className="w-16 h-12 rounded-lg object-cover" />;
  }
  if (row.fileType === "video") {
    return <video src={row.file_url} className="w-16 h-12 rounded-lg object-cover" muted />;
  }
  return (
    <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
      {row.file.split('.').pop()?.toUpperCase()}
    </div>
  );
};

interface MediaTableProps {
  searchTerm?: string;
  onDelete: (id: number) => void;
}

export default function MediaTable({ searchTerm, onDelete }: MediaTableProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);

  const fetchMedia = async () => {
    try {
      const response = await getMediaListApi({ search: searchTerm });
      if (response.status) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch media");
    }
  };

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === "1" ? "0" : "1";
    const loadingToast = toast.loading("Updating...");
    try {
      const res = await changeStatusApi("Media", row.id, newStatus);
      if (res.status) {
        toast.success("Status updated successfully", { id: loadingToast });
        fetchMedia();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.title_ar || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const columns: Column<any>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => Array.isArray(value) ? value.map(t => t.name).join(", ") : String(value ?? ""),
    },
    {
      key: "file",
      label: "Preview",
      className: "text-center",
      render: (_, row) => <MediaPreview row={row} />,
    },
    {
      key: "title",
      label: "Title (EN)",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => <span className="font-medium text-black">{value as string}</span>,
    },
    {
      key: "title_ar",
      label: "Title (AR)",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => (value as string) || "-",
    },
    {
      key: "fileType",
      label: "Type",
      className: "text-center",
      render: (value) => <FileTypeBadge type={value as string} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (_, row) => <StatusBadge status={row.status} onClick={() => handleToggleStatus(row)} />,
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ];

  const actions = (row: any) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View"
        onClick={() => navigate(`/cms/media/view/${row.id}`)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-[#364B9B]/10 transition-colors cursor-pointer hover:bg-[#364B9B]/20"
      >
        <ViewIcon />
      </button>
      <span className="text-primary text-base">|</span>
      <button
        title="Edit"
        onClick={() => navigate(`/cms/media/edit/${row.id}`)}
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
      data={filteredData}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20, 50]}
      className="flex-1"
    />
  );
}
