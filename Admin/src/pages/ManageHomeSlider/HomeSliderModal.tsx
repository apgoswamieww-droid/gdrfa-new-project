import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";

interface HomeSliderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: any;
  title: string;
}

const HomeSliderModal = ({ isOpen, onClose, onSubmit, initialData, title }: HomeSliderModalProps) => {
  const { t } = useTranslation();
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitleEn(initialData.title);
        setTitleAr(initialData.title_ar || "");
        setDescEn(initialData.short_description);
        setDescAr(initialData.short_description_ar || "");
        setMediaPreview(initialData.media_url || null);
      } else {
        setTitleEn("");
        setTitleAr("");
        setDescEn("");
        setDescAr("");
        setMedia(null);
        setMediaPreview(null);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!titleEn.trim()) newErrors.titleEn = "English title is required";
    if (!descEn.trim()) newErrors.descEn = "English description is required";
    if (!initialData && !media) newErrors.media = "Media file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formData = new FormData();
      formData.append("title", titleEn.trim());
      formData.append("title_ar", titleAr.trim());
      formData.append("short_description", descEn.trim());
      formData.append("short_description_ar", descAr.trim());
      if (media) {
        formData.append("media_path", media);
      }
      setSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
      <div className="w-full max-w-[600px] bg-white rounded-xl p-4 shadow-md text-start my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-secondary">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t.homeSlider.title}
              placeholder={t.homeSlider.titlePlaceholder}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              error={errors.titleEn}
              required
            />
            <InputField
              label={t.homeSlider.titleAr}
              placeholder={t.homeSlider.titleArPlaceholder}
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              error={errors.titleAr}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t.homeSlider.shortDescription}
              placeholder={t.homeSlider.descPlaceholder}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              error={errors.descEn}
              required
            />
            <InputField
              label={t.homeSlider.shortDescriptionAr}
              placeholder={t.homeSlider.descArPlaceholder}
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              error={errors.descAr}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">{t.homeSlider.media}</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {mediaPreview ? (
                <div className="relative group pointer-events-none">
                  {media && media.type.startsWith("video/") || initialData?.media_type === "video" && !media ? (
                    <video src={mediaPreview} className="w-32 h-24 rounded-lg object-cover border" muted />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-32 h-24 rounded-lg object-cover border" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs pointer-events-none">
                    Change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">Click to upload image or video</span>
                  <span className="text-[10px] text-secondary/50">Images up to 20MB, Videos up to 100MB</span>
                </div>
              )}
            </div>
            {errors.media && <p className="text-red-500 text-xs">{errors.media}</p>}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p><strong>Image:</strong> Must be exactly <strong>1440x800</strong> pixels, max 20MB.</p>
              <p><strong>Video:</strong> Must be <strong>wide/landscape</strong> orientation, max 100MB.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.homeSlider.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.homeSlider.saving || "Saving...") : t.homeSlider.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeSliderModal;
