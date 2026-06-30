import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getBlogApi } from "../../api/blog.api";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";
import EditorJsRenderer from "../../component/Editor/EditorJsRenderer";
import toast from "react-hot-toast";

const ViewBlog = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        const response = await getBlogApi(Number(id));
        if (response.status && response.data) {
          setBlog(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load blog post");
        navigate("/cms/blog");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.blog.loading}</p>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cms/blog" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to any Posts</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">any Details</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${blog.status === "1" ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
              <span className={`w-2 h-2 rounded-full ${blog.status === "1" ? "bg-primary-green" : "bg-red-500"}`} />
              {blog.status === "1" ? t.blog.active : t.blog.inactive}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Title (English)</label>
              <p className="text-secondary font-medium">{blog.title}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Description (English)</label>
              <p className="text-gray-600">{blog.shortDescription}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Content (English)</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <EditorJsRenderer data={blog.content} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Title (Arabic)</label>
              <p className="text-secondary font-medium" dir="rtl">{blog.title_ar || "-"}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Description (Arabic)</label>
              <p className="text-gray-600" dir="rtl">{blog.shortDescription_ar || "-"}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Content (Arabic)</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100" dir="rtl">
                <EditorJsRenderer data={blog.content_ar} />
              </div>
            </div>
          </div>
        </div>

        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-6">
            <label className="block text-xs font-semibold text-secondary/50 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag: any) => (
                <span key={tag.id} className="bg-[#364B9B]/10 text-[#364B9B] text-xs font-medium px-3 py-1.5 rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {blog.media_url && (
          <div className="mt-6">
            <label className="block text-xs font-semibold text-secondary/50 mb-2">Media</label>
            <img src={blog.media_url} alt={blog.title} className="w-full max-w-lg rounded-lg border border-gray-200 object-cover" />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-500">
          <div>
            <span className="font-semibold">Created:</span> {formatDate(blog.createdAt)}
          </div>
          <div>
            <span className="font-semibold">Updated:</span> {formatDate(blog.updatedAt)}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/cms/blog"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back to List
          </Link>
          <Link
            to={`/cms/blog/edit/${blog.id}`}
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 bg-[#364B9B] text-white hover:bg-[#364B9B]/90 transition-colors cursor-pointer"
          >
            Edit any
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewBlog;
