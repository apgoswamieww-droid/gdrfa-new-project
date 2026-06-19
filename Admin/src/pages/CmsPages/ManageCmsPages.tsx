import { useState } from "react";
import { SportsActivityImg } from "../../assets/images/images";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import CmsPagesTable from "./CmsPagesTable";
import CmsPageModal from "./CmsPageModal";
import { createCmsPageApi, updateCmsPageApi, deleteCmsPageApi, toggleCmsPageStatusApi } from "../../api/cms.api";
import type { CmsPage } from "../../api/cms.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageCmsPages = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPage, setEditingPage] = useState<CmsPage | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateOrUpdatePage = async (data: any) => {
    const loadingToast = toast.loading(editingPage ? t.cms.updating : t.cms.creating);
    try {
      if (editingPage) {
        await updateCmsPageApi(editingPage.id, data);
        toast.success(t.cms.successUpdate, { id: loadingToast });
      } else {
        await createCmsPageApi(data);
        toast.success(t.cms.successCreate, { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingPage(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save CMS Page:", error);
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEditPage = (page: CmsPage) => {
    setEditingPage(page);
    setIsModalOpen(true);
  };

  const handleDeletePage = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1 text-start">
        <p className="font-bold text-secondary text-base">{t.cms.confirmDelete}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.cms.cancel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.cms.deleting);
              try {
                await deleteCmsPageApi(id);
                toast.success(t.cms.successDelete, { id: loadingToast });
                setRefreshKey((prev) => prev + 1);
              } catch (error: any) {
                console.error("Failed to delete CMS Page:", error);
                toast.error(error.message || t.cms.errorFetch, { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.cms.delete}
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
    const loadingToast = toast.loading(t.cms.updating);
    try {
      await toggleCmsPageStatusApi(id, newStatus);
      toast.success(t.cms.successUpdate, { id: loadingToast });
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    }
  };

  const openCreateModal = () => {
    setEditingPage(undefined);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          <SearchInput
            placeholder={t.cms.search}
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
            {t.cms.create}
          </PrimaryBtn>
        </div>
        <CmsPagesTable 
            key={refreshKey} 
            searchTerm={searchTerm} 
            onEdit={handleEditPage} 
            onDelete={handleDeletePage}
            onToggleStatus={handleToggleStatus}
        />
      </div>
      <div
        className="absolute bottom-0 -z-10 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-full max-w-[70%] mx-auto h-114.25 bg-bottom bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${SportsActivityImg})` }}
      ></div>

      <CmsPageModal
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setEditingPage(undefined);
        }}
        onSubmit={handleCreateOrUpdatePage}
        initialData={editingPage}
        title={editingPage ? t.cms.edit : t.cms.create}
      />
    </>
  );
};
export default ManageCmsPages;
