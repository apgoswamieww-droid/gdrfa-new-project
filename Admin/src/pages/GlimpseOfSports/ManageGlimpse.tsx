import { useState } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import GlimpseTable from "./GlimpseTable";
import GlimpseModal from "./GlimpseModal";
import { createGlimpseApi, updateGlimpseApi, deleteGlimpseApi } from "../../api/glimpse.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageGlimpse = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGlimpse, setEditingGlimpse] = useState<any | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateOrUpdate = async (formData: FormData) => {
    const loadingToast = toast.loading(editingGlimpse ? t.glimpse.updating : t.glimpse.creating);
    try {
      if (editingGlimpse) {
        await updateGlimpseApi(editingGlimpse.id, formData);
        toast.success(t.glimpse.successUpdate, { id: loadingToast });
      } else {
        await createGlimpseApi(formData);
        toast.success(t.glimpse.successCreate, { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingGlimpse(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save glimpse:", error);
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEdit = (glimpse: any) => {
    setEditingGlimpse(glimpse);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">{t.glimpse.confirmDelete}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.glimpse.cancel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.glimpse.deleting);
              try {
                await deleteGlimpseApi(id);
                toast.success(t.glimpse.successDelete, { id: loadingToast });
                setRefreshKey((prev) => prev + 1);
              } catch (error: any) {
                console.error("Failed to delete glimpse:", error);
                toast.error(error.message || "Failed to delete image", { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.glimpse.delete}
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
    setEditingGlimpse(undefined);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between mb-5">
          <SearchInput
            placeholder={t.glimpse.search}
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
            {t.glimpse.create}
          </PrimaryBtn>
        </div>
        <GlimpseTable
          key={refreshKey}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <GlimpseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGlimpse(undefined);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingGlimpse}
        title={editingGlimpse ? t.glimpse.edit : t.glimpse.create}
      />
    </>
  );
};

export default ManageGlimpse;
