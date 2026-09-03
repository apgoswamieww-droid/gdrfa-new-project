import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";
import toast from "react-hot-toast";

interface SocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: any;
  title: string;
}

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
  } catch (e) {
    return false;
  }
};

const SocialLinksModal = ({ isOpen, onClose, onSubmit, initialData, title }: SocialLinksModalProps) => {
  const { t } = useTranslation();
  const [link, setLink] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLink(initialData.link || "");
        setImagePreview(initialData.image_url || null);
      } else {
        setLink("");
        setImage(null);
        setImagePreview(null);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = (field?: string) => {
    const newErrors: Record<string, string> = {};
    if (!link.trim()) {
      newErrors.link = t.socialLinks.linkRequired;
    } else if (!isValidUrl(link.trim())) {
      newErrors.link = t.socialLinks.invalidLink;
    }
    if (!initialData && !image) {
      newErrors.image = t.socialLinks.iconRequired;
    }

    if (field) {
      setErrors((prev) => ({ ...prev, [field]: newErrors[field] || "" }));
    } else {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
    if (errors.link) {
      setErrors((prev) => ({ ...prev, link: "" }));
    }
  };

  const handleBlur = (field: string) => {
    validate(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formData = new FormData();
      formData.append("link", link.trim());
      if (image) {
        formData.append("image", image);
      }
      setSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(t.socialLinks.iconInvalid);
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t.socialLinks.iconSize);
      e.target.value = "";
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
      <div className="w-full max-w-[500px] bg-white rounded-xl p-4 shadow-md text-start my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
          <InputField
            label={t.socialLinks.link}
            placeholder={t.socialLinks.linkPlaceholder}
            value={link}
            onChange={handleFieldChange}
            onBlur={() => handleBlur("link")}
            error={errors.link}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">{t.socialLinks.icon}</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <div className="relative group pointer-events-none">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border bg-white" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs pointer-events-none">
                    {t.socialLinks.change}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">{t.socialLinks.uploadIcon}</span>
                  <span className="text-[10px] text-secondary/50">PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
            {errors.image && <p className="text-[10px] text-red-500 ps-1">{errors.image}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.socialLinks.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.socialLinks.saving || "Saving...") : t.socialLinks.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocialLinksModal;
