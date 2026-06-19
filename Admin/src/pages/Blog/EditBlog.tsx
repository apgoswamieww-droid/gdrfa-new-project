import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import EditorField from "../../component/Editor/EditorField";
import TagsInput from "../../component/TagsInput/TagsInput";
import { getBlogApi, updateBlogApi } from "../../api/blog.api";
import { useTranslation } from "../../hooks/useTranslation";
import toast from "react-hot-toast";

function parseContent(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

const EditBlog = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [contentEnInit, setContentEnInit] = useState<Record<string, unknown> | null>(null);
  const [contentArInit, setContentArInit] = useState<Record<string, unknown> | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const editorEnRef = useRef<any>(null);
  const editorArRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        const response = await getBlogApi(Number(id));
        if (response.status && response.data) {
          const blog = response.data;
          setTitleEn(blog.title);
          setTitleAr(blog.title_ar || "");
          setDescEn(blog.shortDescription);
          setDescAr(blog.shortDescription_ar || "");
          setContentEnInit(parseContent(blog.content));
          setContentArInit(parseContent(blog.content_ar));
          setTags(blog.tags ? blog.tags.map((t: any) => t.name) : []);
          setMediaPreview(blog.media_url || null);
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!titleEn.trim()) newErrors.titleEn = "English title is required";
    if (!titleAr.trim()) newErrors.titleAr = "Arabic title is required";
    if (!descEn.trim()) newErrors.descEn = "English description is required";
    if (!descAr.trim()) newErrors.descAr = "Arabic description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const loadingToast = toast.loading(t.blog.updating);
    try {
      let contentEnData = "";
      let contentArData = "";

      const contentErrors: Record<string, string> = {};

      if (editorEnRef.current) {
        const savedData = await editorEnRef.current.save();
        if (!savedData.blocks || savedData.blocks.length === 0) {
          contentErrors.contentEn = "English content is required";
        } else {
          contentEnData = JSON.stringify(savedData);
        }
      } else {
        contentErrors.contentEn = "English content is required";
      }

      if (editorArRef.current) {
        const savedData = await editorArRef.current.save();
        if (!savedData.blocks || savedData.blocks.length === 0) {
          contentErrors.contentAr = "Arabic content is required";
        } else {
          contentArData = JSON.stringify(savedData);
        }
      } else {
        contentErrors.contentAr = "Arabic content is required";
      }

      if (Object.keys(contentErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...contentErrors }));
        setSubmitting(false);
        toast.dismiss(loadingToast);
        return;
      }

      const formData = new FormData();
      formData.append("title", titleEn.trim());
      formData.append("title_ar", titleAr.trim());
      formData.append("shortDescription", descEn.trim());
      formData.append("shortDescription_ar", descAr.trim());
      formData.append("content", contentEnData);
      formData.append("content_ar", contentArData);
      formData.append("tags", JSON.stringify(tags));
      if (media) formData.append("media", media);
      await updateBlogApi(Number(id), formData);
      toast.success(t.blog.successUpdate, { id: loadingToast });
      navigate("/cms/blog");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio < 1.3) {
          setErrors(prev => ({ ...prev, media: "Image must be wide/landscape (not square or portrait)" }));
          setMedia(null);
          setMediaPreview(null);
          URL.revokeObjectURL(objectUrl);
        } else {
          setMedia(file);
          setMediaPreview(objectUrl);
          setErrors(prev => {
            const { media: _, ...rest } = prev;
            return rest;
          });
        }
      };
      img.onerror = () => {
        setErrors(prev => ({ ...prev, media: "Invalid image file" }));
        setMedia(null);
        setMediaPreview(null);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.blog.loading}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/cms/blog" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Blog Posts</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary">{t.blog.edit}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t.blog.title}
              placeholder={t.blog.titlePlaceholder}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              error={errors.titleEn}
              required
            />
            <InputField
              label={t.blog.titleAr}
              placeholder={t.blog.titleArPlaceholder}
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              error={errors.titleAr}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t.blog.shortDescription}
              placeholder={t.blog.descPlaceholder}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              error={errors.descEn}
              required
            />
            <InputField
              label={t.blog.shortDescriptionAr}
              placeholder={t.blog.descArPlaceholder}
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              error={errors.descAr}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-secondary/50">{t.blog.content}</label>
              <EditorField
                holder="editor-en-edit"
                initialData={contentEnInit}
                onReady={(editor) => { editorEnRef.current = editor; }}
                placeholder={t.blog.contentPlaceholder}
                error={errors.contentEn}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-secondary/50">{t.blog.contentAr}</label>
              <EditorField
                holder="editor-ar-edit"
                initialData={contentArInit}
                onReady={(editor) => { editorArRef.current = editor; }}
                placeholder={t.blog.contentArPlaceholder}
                error={errors.contentAr}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">Tags</label>
            <TagsInput
              value={tags}
              onChange={setTags}
              placeholder="Type tag and press Enter"
              error={errors.tags}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">{t.blog.mediaLabel}</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleMediaChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {mediaPreview ? (
                <div className="relative group pointer-events-none">
                  <img src={mediaPreview} alt="Preview" className="w-32 h-24 rounded-lg object-cover border" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs pointer-events-none">
                    Change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">Click to upload image</span>
                  <span className="text-[10px] text-secondary/50">Images up to 20MB</span>
                </div>
              )}
            </div>
            {errors.media && <p className="text-red-500 text-xs">{errors.media}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              to="/cms/blog"
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.blog.cancel}
            </Link>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : t.blog.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlog;
