import { useState } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import HomeSliderTable from "./HomeSliderTable";
import HomeSliderModal from "./HomeSliderModal";
import { createHomeSliderApi, updateHomeSliderApi, deleteHomeSliderApi } from "../../api/homeSlider.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageHomeSlider = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSlider, setEditingSlider] = useState<any | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateOrUpdate = async (formData: FormData) => {
    const loadingToast = toast.loading(editingSlider ? t.homeSlider.updating : t.homeSlider.creating);
    try {
      if (editingSlider) {
        await updateHomeSliderApi(editingSlider.id, formData);
        toast.success(t.homeSlider.successUpdate, { id: loadingToast });
      } else {
        await createHomeSliderApi(formData);
        toast.success(t.homeSlider.successCreate, { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingSlider(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save home slider:", error);
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEdit = (slider: any) => {
    setEditingSlider(slider);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">{t.homeSlider.confirmDelete}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.homeSlider.cancel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.homeSlider.deleting);
              try {
                await deleteHomeSliderApi(id);
                toast.success(t.homeSlider.successDelete, { id: loadingToast });
                setRefreshKey((prev) => prev + 1);
              } catch (error: any) {
                console.error("Failed to delete home slider:", error);
                toast.error(error.message || "Failed to delete home slider", { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.homeSlider.delete}
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: { minWidth: '350px', borderRadius: '24px', padding: '16px' }
    });
  };

  const openCreateModal = () => {
    setEditingSlider(undefined);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between mb-5">
          <SearchInput
            placeholder={t.homeSlider.search}
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
            {t.homeSlider.create}
          </PrimaryBtn>
        </div>
        <HomeSliderTable
          key={refreshKey}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <HomeSliderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlider(undefined);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingSlider}
        title={editingSlider ? t.homeSlider.edit : t.homeSlider.create}
      />
    </>
  );
};
export default ManageHomeSlider;
