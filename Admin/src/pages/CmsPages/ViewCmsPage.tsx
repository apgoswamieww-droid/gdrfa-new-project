import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCmsPageByIdApi } from "../../api/cms.api";
import type { CmsPage } from "../../api/cms.api";
import { formatDate } from "../../utils/dateUtils";
import EditorJsRenderer from "../../component/Editor/EditorJsRenderer";
import toast from "react-hot-toast";

const ViewCmsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPage = async () => {
      try {
        const response = await getCmsPageByIdApi(id);
        if (response.status && response.data) {
          setPage(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load CMS Page");
        navigate("/cms/pages");
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading CMS Page...</p>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 text-start">
        <Link to="/cms/pages" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to CMS Pages</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-start">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">CMS Page Details</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${page.status === "1" ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
              <span className={`w-2 h-2 rounded-full ${page.status === "1" ? "bg-primary-green" : "bg-red-500"}`} />
              {page.status === "1" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4 text-start">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Page Name (English)</label>
              <p className="text-secondary font-medium">{page.name_en}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Slug</label>
              <p className="text-gray-600">{page.slug}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Description (English)</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-40">
                <EditorJsRenderer data={page.description_en} />
              </div>
            </div>
          </div>

          <div className="space-y-4 text-right" dir="rtl">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">اسم الصفحة (بالعربية)</label>
              <p className="text-secondary font-medium">{page.name_ar || "-"}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">الرابط الثابت</label>
              <p className="text-gray-600">{page.slug}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">الوصف (بالعربية)</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-40">
                <EditorJsRenderer data={page.description_ar} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-500">
          <div>
            <span className="font-semibold">Created:</span> {formatDate(page.createdAt)}
          </div>
          <div>
            <span className="font-semibold">Updated:</span> {formatDate(page.updatedAt)}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/cms/pages"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back to List
          </Link>
          <button
            onClick={() => toast.success("Use the edit button from the list to modify this page.")}
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 bg-[#0A2240] text-white hover:bg-[#0A2240]/90 transition-colors cursor-pointer"
          >
            Edit Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCmsPage;
