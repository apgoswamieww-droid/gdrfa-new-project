import { useState } from "react";
import { SportsActivityImg } from "../../assets/images/images";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import FaqsTable from "./FaqsTable";
import FaqModal from "./FaqModal";
import { createFaqApi, updateFaqApi, deleteFaqApi, toggleFaqStatusApi } from "../../api/faqs.api";
import type { Faq } from "../../api/faqs.api";
import toast from "react-hot-toast";
import SearchInput from "../../component/Input/SearchInput";

const ManageFaqs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFaq, setEditingFaq] = useState<Faq | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateOrUpdateFaq = async (data: any) => {
    const loadingToast = toast.loading(editingFaq ? "Updating FAQ..." : "Creating FAQ...");
    try {
      if (editingFaq) {
        await updateFaqApi(editingFaq.id, data);
        toast.success("FAQ updated successfully", { id: loadingToast });
      } else {
        await createFaqApi(data);
        toast.success("FAQ created successfully", { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingFaq(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save FAQ:", error);
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEditFaq = (faq: Faq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };

  const handleDeleteFaq = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">Are you sure you want to delete this FAQ?</p>
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
              const loadingToast = toast.loading("Deleting FAQ...");
              try {
                await deleteFaqApi(id);
                toast.success("FAQ deleted successfully", { id: loadingToast });
                setRefreshKey((prev) => prev + 1);
              } catch (error: any) {
                console.error("Failed to delete FAQ:", error);
                toast.error(error.message || "Failed to delete FAQ", { id: loadingToast });
              }
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

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "1" ? "0" : "1";
    const loadingToast = toast.loading("Updating status...");
    try {
      await toggleFaqStatusApi(id, newStatus);
      toast.success("Status updated successfully", { id: loadingToast });
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    }
  };

  const openCreateModal = () => {
    setEditingFaq(undefined);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          <SearchInput
            placeholder="Search FAQs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <PrimaryBtn className="w-fit" onClick={openCreateModal}>
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
            Add New FAQ
          </PrimaryBtn>
        </div>
        <FaqsTable 
            key={refreshKey} 
            searchTerm={searchTerm} 
            onEdit={handleEditFaq} 
            onDelete={handleDeleteFaq}
            onToggleStatus={handleToggleStatus}
        />
      </div>
      <div
        className="absolute bottom-0 -z-10 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-full max-w-[70%] mx-auto h-114.25 bg-bottom bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${SportsActivityImg})` }}
      ></div>

      <FaqModal
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setEditingFaq(undefined);
        }}
        onSubmit={handleCreateOrUpdateFaq}
        initialData={editingFaq}
        title={editingFaq ? "Edit FAQ" : "Add New FAQ"}
      />
    </>
  );
};
export default ManageFaqs;
