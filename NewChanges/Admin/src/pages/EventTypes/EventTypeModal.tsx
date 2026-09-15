import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";


interface EventTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; name_ar?: string }, id?: number) => void;
  initialData?: { id: number; name: string; name_ar?: string } | null;
  title: string;
}

const EventTypeModal = ({ isOpen, onClose, onSubmit, initialData, title }: EventTypeModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setNameAr(initialData?.name_ar || "");
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const val = name.trim();
    if (!val) {
      setError("Event Type Name is required");
      return false;
    }
    if (val.length < 3) {
      setError("Event Type Name must be at least 3 characters long");
      return false;
    }
    if (/<[^>]*>/g.test(val)) {
      setError("HTML tags are not allowed");
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
        await onSubmit({ name: name.trim(), name_ar: nameAr.trim() }, initialData?.id);
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
            label={t.eventType.name}
            placeholder={t.eventType.placeholder}
            value={name}
            onChange={handleNameChange}
            error={error}
            required
          />

          <InputField
            label={t.eventType.nameAr}
            placeholder={t.eventType.placeholderAr}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.eventType.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? t.eventType.saving : t.eventType.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventTypeModal;
