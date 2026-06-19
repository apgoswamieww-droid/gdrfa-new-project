import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getMediaApi } from "../../api/media.api";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const ViewMedia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMedia = async () => {
      try {
        const response = await getMediaApi(Number(id));
        if (response.status && response.data) {
          setMedia(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load media");
        navigate("/cms/media");
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading...</p>
      </div>
    );
  }

  if (!media) return null;

  const renderPreview = () => {
    if (!media.file_url) return <p className="text-gray-400 italic">No file</p>;
    if (media.fileType === "image") {
      return <img src={media.file_url} alt={media.title} className="w-full max-w-lg rounded-lg border border-gray-200 object-cover" />;
    }
    if (media.fileType === "video") {
      return <video src={media.file_url} className="w-full max-w-lg rounded-lg border border-gray-200" controls />;
    }
    return (
      <a
        href={media.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#364B9B] text-white rounded-lg text-sm font-bold hover:bg-[#364B9B]/90 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Open File
      </a>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cms/media" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Media</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">Media Details</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${media.status === "1" ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
            <span className={`w-2 h-2 rounded-full ${media.status === "1" ? "bg-primary-green" : "bg-red-500"}`} />
            {media.status === "1" ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Title (English)</label>
              <p className="text-secondary font-medium">{media.title}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Description (English)</label>
              <p className="text-gray-600">{media.description}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">File Type</label>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                media.fileType === "image" ? "bg-blue-50 text-blue-600" :
                media.fileType === "video" ? "bg-purple-50 text-purple-600" :
                "bg-amber-50 text-amber-600"
              }`}>
                {media.fileType}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Title (Arabic)</label>
              <p className="text-secondary font-medium" dir="rtl">{media.title_ar || "-"}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary/50 mb-1">Description (Arabic)</label>
              <p className="text-gray-600" dir="rtl">{media.description_ar || "-"}</p>
            </div>
          </div>
        </div>

        {media.tags && media.tags.length > 0 && (
          <div className="mt-6">
            <label className="block text-xs font-semibold text-secondary/50 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {media.tags.map((tag: any) => (
                <span key={tag.id} className="bg-[#364B9B]/10 text-[#364B9B] text-xs font-medium px-3 py-1.5 rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="block text-xs font-semibold text-secondary/50 mb-2">File Preview</label>
          {renderPreview()}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm text-gray-500">
          <div>
            <span className="font-semibold">Created:</span> {formatDate(media.createdAt)}
          </div>
          <div>
            <span className="font-semibold">Updated:</span> {formatDate(media.updatedAt)}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/cms/media"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back to List
          </Link>
          <Link
            to={`/cms/media/edit/${media.id}`}
            className="flex items-center justify-center font-bold text-sm rounded-lg px-4 py-1.5 bg-[#364B9B] text-white hover:bg-[#364B9B]/90 transition-colors cursor-pointer"
          >
            Edit Media
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewMedia;
