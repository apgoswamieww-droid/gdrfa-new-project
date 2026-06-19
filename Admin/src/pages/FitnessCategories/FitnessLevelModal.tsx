import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";

interface FitnessLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const FitnessLevelModal = ({ isOpen, onClose, onSubmit, initialData }: FitnessLevelModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    min: "",
    max: "",
    points: "",
    label: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          min: initialData.min?.toString() || "",
          max: initialData.max?.toString() || "",
          points: initialData.points?.toString() || "",
          label: initialData.label || "",
        });
      } else {
        setFormData({
          min: "",
          max: "",
          points: "",
          label: "",
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.min === "") newErrors.min = "Min value is required";
    if (formData.max === "") newErrors.max = "Max value is required";
    if (formData.points === "") newErrors.points = "Points are required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        min: parseFloat(formData.min),
        max: parseFloat(formData.max),
        points: parseFloat(formData.points)
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary">{initialData ? "Edit Level" : "Add New Level"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <InputField
            label={t.fitness.label}
            placeholder="e.g. Level 1, Beginner"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
                label={t.fitness.min}
                type="number"
                placeholder="Min"
                value={formData.min}
                onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                error={errors.min}
                required
            />
            <InputField
                label={t.fitness.max}
                type="number"
                placeholder="Max"
                value={formData.max}
                onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                error={errors.max}
                required
            />
          </div>

          <InputField
            label={t.fitness.points}
            type="number"
            placeholder="Points"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            error={errors.points}
            required
          />

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

export default FitnessLevelModal;
