import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";

interface KpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string }) => void;
  initialData?: { name: string };
  title: string;
}

const KpiModal = ({ isOpen, onClose, onSubmit, initialData, title }: KpiModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    if (!name.trim()) {
      setError("KPI Name is required");
      return false;
    }
    if (name.trim().length < 3) {
      setError("KPI Name must be at least 3 characters long");
      return false;
    }
    setError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      try {
        await onSubmit({ name: name.trim() });
      } finally {
        setSubmitting(false);
      }
    }
  };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
            <div className="w-full max-w-[400px] bg-white rounded-xl p-4 shadow-md text-start max-h-[90vh] overflow-y-auto">
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
            label={t.kpi.name}
            placeholder={t.kpi.placeholder}
            value={name}
            onChange={handleNameChange}
            error={error}
            required
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.kpi.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {t.kpi.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiModal;
