import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import BlogTable from "./BlogTable";
import { deleteBlogApi } from "../../api/blog.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageBlog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="font-bold text-secondary text-base text-start">{t.blog.confirmDelete}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t_toast.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t.blog.cancel}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t_toast.id);
              const loadingToast = toast.loading(t.blog.deleting);
              try {
                await deleteBlogApi(id);
                toast.success(t.blog.successDelete, { id: loadingToast });
                setRefreshKey((prev) => prev + 1);
              } catch (error: any) {
                console.error("Failed to delete blog post:", error);
                toast.error(error.message || "Failed to delete blog post", { id: loadingToast });
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t.blog.delete}
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: { minWidth: '350px', borderRadius: '24px', padding: '16px' }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex sm:flex-row flex-col gap-3 justify-between mb-5">
        <SearchInput
          placeholder={t.blog.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <PrimaryBtn className="w-fit" onClick={() => navigate("/cms/blog/create")}>
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
          {t.blog.create}
        </PrimaryBtn>
      </div>
      <BlogTable
        key={refreshKey}
        searchTerm={searchTerm}
        onDelete={handleDelete}
      />
    </div>
  );
};
export default ManageBlog;
