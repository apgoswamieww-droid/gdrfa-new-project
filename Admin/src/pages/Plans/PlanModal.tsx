import { useState, useEffect, useRef } from "react";
import InputField from "../../component/Input/InputField";
import Selectfield from "../../component/Input/Selectfield";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { year: string; kpi: number }, id?: number) => void;
  initialData?: { id: number; year: string; kpi: number } | null;
  title: string;
  kpiOptions: { id: number; name: string }[];
}

const PlanModal = ({ isOpen, onClose, onSubmit, initialData, title, kpiOptions }: PlanModalProps) => {
  const { t } = useTranslation();
  const [year, setYear] = useState("");
  const [kpi, setKpi] = useState("");
  const [errors, setErrors] = useState<{ year?: string; kpi?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const yearInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setYear(initialData?.year?.toString() || "");
      setKpi(initialData?.kpi?.toString() || "");
      setErrors({});
      setTimeout(() => {
        yearInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { year?: string; kpi?: string } = {};
    
    if (!year.trim()) {
      newErrors.year = "Year is required";
    } else if (!/^\d{4}$/.test(year.trim())) {
      newErrors.year = "Please enter a valid year (e.g., 2026)";
    }
    
    if (!kpi || kpi === "") {
      newErrors.kpi = "KPI is required";
    }
    
    setErrors(newErrors);
    if (newErrors.year) {
      setTimeout(() => yearInputRef.current?.focus(), 0);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      try {
        await onSubmit({ 
          year: year.trim(), 
          kpi: Number(kpi)
        }, initialData?.id);
      } finally {
        setSubmitting(false);
      }
    }
  };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
            <div className="w-full max-w-[400px] bg-white rounded-xl p-4 shadow-md text-start max-h-[90vh] overflow-y-auto custom-scrollbar">
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
          <div>
            <InputField
              label={t.plan.year || "Year"}
              type="text"
              placeholder={t.plan.enterYear || "Enter year (e.g., 2026)"}
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                if (errors.year) setErrors(prev => ({ ...prev, year: undefined }));
              }}
              error={errors.year}
              required
              ref={yearInputRef}
            />
          </div>

          <div>
            <Selectfield
              label={t.plan.kpi || "KPI"}
              value={kpi}
              onChange={(e) => {
                setKpi(e.target.value);
                if (errors.kpi) setErrors(prev => ({ ...prev, kpi: undefined }));
              }}
              options={[
                { value: "", label: t.plan.selectKpi || "Select KPI" },
                ...kpiOptions.map(k => ({ value: k.id, label: k.name }))
              ]}
              error={errors.kpi}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.plan.cancel || "Cancel"}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.plan.saving || "Saving...") : (t.plan.save || "Save")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanModal;
