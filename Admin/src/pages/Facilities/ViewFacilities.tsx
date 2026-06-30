import { useState, useEffect } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import FacilitiesTable from "./FacilitiesTable";
import FacilityModal from "./FacilityModal";
import {
  getFacilitiesApi,
  createFacilityApi,
  updateFacilityApi,
  deleteFacilityApi,
} from "../../api/facilities.api";
import { changeStatusApi } from "../../api/request";
import type { Facility } from "../../api/facilities.api";
import toast from "react-hot-toast";
import SearchInput from "../../component/Input/SearchInput";

const ViewFacilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Facility | undefined>(
    undefined,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFacilities = async () => {
    try {
      const res = await getFacilitiesApi({
        search: searchTerm,
        start: 0,
        length: 100,
      });
      if (res.status) {
        setFacilities(res.data.data);
      }
    } catch (error: any) {
        toast.error(error.message || "Failed to load facilities");
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [searchTerm, refreshKey]);

  const handleSubmit = async (formData: FormData) => {
    const loadingToast = toast.loading(
      editingData ? "Updating..." : "Creating...",
    );
    try {
      if (editingData) {
        await updateFacilityApi(editingData.id, formData);
        toast.success("Facility updated successfully!", { id: loadingToast });
      } else {
        await createFacilityApi(formData);
        toast.success("Facility created successfully!", { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingData(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", {
        id: loadingToast,
      });
    }
  };

  const handleEdit = (data: Facility) => {
    setEditingData(data);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this facility?"))
      return;

    const loadingToast = toast.loading("Deleting...");
    try {
      await deleteFacilityApi(id);
      toast.success("Facility deleted successfully!", { id: loadingToast });
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete facility", {
        id: loadingToast,
      });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "1" ? "0" : "1";
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await changeStatusApi("Facilities", id, newStatus);
      if (res.status) {
        toast.success("Status updated successfully!", { id: loadingToast });
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="p-4 2xl:space-y-8 space-y-6 flex flex-col h-full text-start">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <SearchInput
          placeholder="Search by facility title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <PrimaryBtn
          className="w-fit"
          onClick={() => {
            setEditingData(undefined);
            setIsModalOpen(true);
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.08203 9.99972C2.08203 6.26772 2.08203 4.40175 3.2414 3.24238C4.40077 2.08301 6.26675 2.08301 9.9987 2.08301C13.7306 2.08301 15.5966 2.08301 16.756 3.24238C17.9154 4.40175 17.9154 6.26772 17.9154 9.99972C17.9154 13.7316 17.9154 15.5976 16.756 16.757C15.5966 17.9164 13.7306 17.9164 9.9987 17.9164C6.26675 17.9164 4.40077 17.9164 3.2414 16.757C2.08203 15.5976 2.08203 13.7316 2.08203 9.99972Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.0013 6.66699V13.3337M13.3346 10.0004H6.66797"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add New Facility
        </PrimaryBtn>
      </div>

      <div className="flex-1 min-h-0">
        <FacilitiesTable
          data={facilities}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <FacilityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingData(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingData}
        title={editingData ? "Edit Facility" : "Create New Facility"}
      />
    </div>
  );
};

export default ViewFacilities;
