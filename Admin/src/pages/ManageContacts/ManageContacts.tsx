import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "../../component/Table/DataTable";
import { getContactsApi, deleteContactApi } from "../../api/contact.api";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateUtils";
import SearchInput from "../../component/Input/SearchInput";

const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const ManageContacts = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchContacts = async () => {
    try {
      const params = searchTerm ? { search: searchTerm } : undefined;
      const response = await getContactsApi(params);
      if (response.status) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch contacts");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [searchTerm, refreshKey]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const handleDelete = (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">Are you sure you want to delete this contact?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t_toast.id)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t_toast.id);
            const loadingToast = toast.loading("Deleting...");
            try {
              await deleteContactApi(id);
              toast.success("any deleted successfully", { id: loadingToast });
              setRefreshKey(k => k + 1);
            } catch (error: any) {
              toast.error(error.message || "Failed to delete", { id: loadingToast });
            }
          }} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">Delete</button>
        </div>
      </div>
    ), { duration: 6000, position: "top-center", style: { minWidth: '350px', borderRadius: '24px', padding: '16px' } });
  };

  const columns: Column<any>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
      render: (value) => <span className="font-medium text-black">{value as string}</span>,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium",
    },
    {
      key: "message",
      label: "Message",
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium max-w-xs",
      render: (value) => {
        const msg = value as string;
        return <span className="truncate block">{msg?.length > 80 ? msg.slice(0, 80) + "..." : msg || "-"}</span>;
      },
    },
    {
      key: "createdAt",
      label: "Received At",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/tight text-base/tight font-medium whitespace-nowrap",
      render: (value) => formatDate(value as string),
    },
  ];

  const actions = (row: any) => (
    <div className="flex items-center gap-1.5">
      <button
        title="View"
        onClick={() => navigate(`/cms/contacts/view/${row.id}`)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-[#364B9B]/10 transition-colors cursor-pointer hover:bg-[#364B9B]/20"
      >
        <ViewIcon />
      </button>
      <span className="text-primary text-base">|</span>
      <button
        title="Delete"
        onClick={() => handleDelete(row.id)}
        className="2xl:min-w-10 min-w-8 2xl:w-10 w-8 2xl:h-10 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"
      >
        <DeleteIcon />
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex sm:flex-row flex-col gap-3 justify-between mb-5">
        <SearchInput
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        key={refreshKey}
        data={filteredData}
        columns={columns}
        actions={actions}
        perPageOptions={[5, 10, 20, 50]}
        className="flex-1"
      />
    </div>
  );
};

export default ManageContacts;
