import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: any;
  title: string;
}

const SponsorModal = ({ isOpen, onClose, onSubmit, initialData, title }: SponsorModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setWebsiteUrl(initialData.website_url || "");
        setLogoPreview(initialData.logo_url || null);
      } else {
        setName("");
        setWebsiteUrl("");
        setLogo(null);
        setLogoPreview(null);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "any name is required";
    if (!websiteUrl.trim()) newErrors.websiteUrl = "Website URL is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("website_url", websiteUrl.trim());
      if (logo) {
        formData.append("logo", logo);
      }
      setSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t.sponsor.name}
              placeholder={t.sponsor.placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <InputField
              label={t.sponsor.websiteUrl}
              placeholder={t.sponsor.websitePlaceholder}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              error={errors.websiteUrl}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">{t.sponsor.logo}</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {logoPreview ? (
                <div className="relative group pointer-events-none">
                  <img src={logoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs pointer-events-none">
                    Change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">Click to upload logo</span>
                  <span className="text-[10px] text-secondary/50">PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.sponsor.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.sponsor.saving || "Saving...") : t.sponsor.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorModal;
