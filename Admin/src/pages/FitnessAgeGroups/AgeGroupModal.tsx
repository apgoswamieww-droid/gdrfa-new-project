import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";

interface AgeGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  title: string;
}

const AgeGroupModal = ({ isOpen, onClose, onSubmit, initialData, title }: AgeGroupModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age_from: "",
    age_to: "",
    group_name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          age_from: initialData.age_from?.toString() || "",
          age_to: initialData.age_to?.toString() || "",
          group_name: initialData.group_name || "",
        });
      } else {
        setFormData({ age_from: "", age_to: "", group_name: "" });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.age_from) newErrors.age_from = "Age from is required";
    if (!formData.age_to) newErrors.age_to = "Age to is required";
    if (Number(formData.age_from) < 0) newErrors.age_from = "Age cannot be negative";
    if (Number(formData.age_to) <= Number(formData.age_from)) newErrors.age_to = "Age to must be greater than age from";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        age_from: Number(formData.age_from),
        age_to: Number(formData.age_to),
        group_name: formData.group_name.trim() || undefined,
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
            label="Group Name (optional)"
            placeholder="e.g. Young Adults"
            value={formData.group_name}
            onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Age From"
              type="number"
              placeholder="18"
              value={formData.age_from}
              onChange={(e) => setFormData({ ...formData, age_from: e.target.value })}
              error={errors.age_from}
              required
            />
            <InputField
              label="Age To"
              type="number"
              placeholder="25"
              value={formData.age_to}
              onChange={(e) => setFormData({ ...formData, age_to: e.target.value })}
              error={errors.age_to}
              required
            />
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
              {submitting ? "Saving..." : (initialData ? t.fitness.save : t.fitness.create)}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgeGroupModal;
