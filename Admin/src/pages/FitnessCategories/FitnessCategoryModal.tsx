import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";

interface FitnessCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  title: string;
}

const FitnessCategoryModal = ({ isOpen, onClose, onSubmit, initialData, title }: FitnessCategoryModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    unit_type: "count",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          slug: initialData.slug || "",
          unit_type: initialData.unit_type || "count",
        });
      } else {
        setFormData({ name: "", slug: "", unit_type: "count" });
      }
      setErrors({});
      setSlugManuallyEdited(false);
    }
  }, [initialData, isOpen]);

  const autoGenerateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slugManuallyEdited ? prev.slug : autoGenerateSlug(value),
    }));
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.unit_type) newErrors.unit_type = "Unit type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "_"),
        unit_type: formData.unit_type,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <InputField
            label={t.fitness.name}
            placeholder="e.g. Pushups"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            required
          />

          <InputField
            label="Slug"
            placeholder="e.g. pushups"
            value={formData.slug}
            onChange={(e) => { setFormData({ ...formData, slug: e.target.value }); setSlugManuallyEdited(true); }}
            error={errors.slug}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Unit Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="unit_type"
                  value="count"
                  checked={formData.unit_type === "count"}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium text-gray-700">Count</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="unit_type"
                  value="time"
                  checked={formData.unit_type === "time"}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium text-gray-700">Time</span>
              </label>
            </div>
            {errors.unit_type && <p className="text-red-500 text-xs mt-1">{errors.unit_type}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-1.5 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex-1"
            >
              {t.fitness.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.fitness.saving || "Saving...") : (initialData ? t.fitness.save : t.fitness.create)}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FitnessCategoryModal;
