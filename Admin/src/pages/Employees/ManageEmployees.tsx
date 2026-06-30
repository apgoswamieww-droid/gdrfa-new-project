import { useState } from "react";
import EmployeesTable from "./EmployeesTable";
import EmployeeViewModal from "./EmployeeViewModal";
import SearchInput from "../../component/Input/SearchInput";

const ManageEmployees = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, _setRefreshKey] = useState(0);

  const [viewData, setViewData] = useState<{ 
    id: string; 
    name: string; 
    email: string; 
    mobile?: string; 
    role_name?: string; 
    status: string; 
    createdAt: string 
  } | null>(null);

  const handleView = (data: { 
    id: string; 
    name: string; 
    email: string; 
    mobile?: string; 
    role_name?: string; 
    status: string; 
    createdAt: string 
  }) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          <SearchInput
            placeholder="Search for Employees.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <EmployeesTable
          key={refreshKey}
          searchTerm={searchTerm}
          onView={handleView}
        />
      </div>

      {isViewModalOpen && viewData && (
        <EmployeeViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewData(null);
          }}
          data={viewData}
        />
      )}
    </>
  );
};

export default ManageEmployees;
