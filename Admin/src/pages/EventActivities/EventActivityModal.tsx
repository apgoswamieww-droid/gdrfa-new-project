import { useState, useEffect, useRef } from "react";
import InputField from "../../component/Input/InputField";
import Selectfield from "../../component/Input/Selectfield";
import PrimaryBtn from "../../component/Button/PrimaryButton";


interface EventActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; activityType: number; isTeam?: string }, id?: number) => void;
  initialData?: { id: number; name: string; activityType: number; isTeam: string } | null;
  title: string;
  activityTypes: { id: number; name: string }[];
}

const EventActivityModal = ({ isOpen, onClose, onSubmit, initialData, title, activityTypes }: EventActivityModalProps) => {
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState<number | "">("");
  const [isTeam, setIsTeam] = useState("0");
  const [errors, setErrors] = useState<{ name?: string; activityType?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setActivityType(initialData?.activityType || "");
      setIsTeam(initialData?.isTeam || "0");
      setErrors({});
      // Focus on name input after modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; activityType?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Activity Name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Activity Name must be at least 3 characters long";
    }
    
    if (!activityType) {
      newErrors.activityType = "Event Type is required";
    }
    
    setErrors(newErrors);
    // Focus on first field with error
    if (newErrors.name) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      try {
        await onSubmit({ 
          name: name.trim(), 
          activityType: activityType as number,
          isTeam 
        }, initialData?.id);
      } finally {
        setSubmitting(false);
      }
    }
  };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
            <div className="w-full max-w-[450px] bg-white rounded-xl p-4 shadow-md text-start max-h-[90vh] overflow-y-auto">
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
              label="Activity Name"
              placeholder="Enter Activity name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              required
              ref={nameInputRef}
            />
          </div>

          <div>
            <Selectfield
              label="Event Type"
              value={activityType}
              onChange={(e) => {
                const val = Number(e.target.value);
                setActivityType(isNaN(val) ? "" : val);
                if (errors.activityType) setErrors(prev => ({ ...prev, activityType: undefined }));
              }}
              options={[
                { value: "", label: "Select Event Type" },
                ...activityTypes.map(type => ({ value: type.id, label: type.name }))
              ]}
              error={errors.activityType}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isTeam"
              checked={isTeam === "1"}
              onChange={(e) => setIsTeam(e.target.checked ? "1" : "0")}
              className="w-4 h-4"
            />
            <label htmlFor="isTeam" className="text-sm font-medium">Is Team Activity?</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              Cancel
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventActivityModal;
