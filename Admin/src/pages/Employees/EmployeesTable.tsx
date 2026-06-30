import { useEffect, useState, useMemo } from "react";
import DataTable, { type Column } from "../../component/Table/DataTable";
import type { Employee } from "../../api/employees.api";
import { getEmployeesApi } from "../../api/employees.api";
import { formatDate } from "../../utils/dateUtils";

// ─── Icons ──────────────────
const ViewIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C5 5 1 12 1 12C1 12 5 19 12 19C19 19 23 12 23 12C23 12 19 5 12 5Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Main Component ───────────────
export default function EmployeesTable({ searchTerm, onView }: { 
  searchTerm: string; 
  onView: (data: Employee) => void; 
}) {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);

  const fetchEmployees = () => {
    setLoading(true);
    getEmployeesApi()
      .then((res) => {
        if (res.data) setData(res.data);
        setTotalRecords(res.total);
      })
      .catch((e) => {
        console.warn("Employees fetch error:", e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.mobile && emp.mobile.includes(searchTerm))
    );
  }, [data, searchTerm]);

  const columns: Column<Employee>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "text-center w-12 text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      className: "font-medium text-black 2xl:text-base/light text-base/light",
      render: (value) => value,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value,
    },
    {
      key: "mobile",
      label: "Mobile",
      sortable: true,
      className: "text-[#898B8E] 2xl:text-base/light text-base/light font-medium",
      render: (value) => value || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      className: "text-center",
      render: (_, row) => {
        const isActive = row.status === "Active";
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full 2xl:text-base/light text-base/light font-semibold ${isActive ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary-green" : "bg-red-500"}`} />
            {isActive ? "Active" : "Inactive"}
          </span>
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
  ];

  const actions = (row: Employee) => (
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
    return <div className="bg-white rounded-xl p-5 text-center text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="bg-white rounded-xl p-5 text-center text-red-500">Failed to load employees</div>;
  }

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      actions={actions}
      perPageOptions={[5, 10, 20, 50]}
      className="flex-1"
      totalRecords={totalRecords}
    />
  );
}
