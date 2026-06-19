import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import Selectfield from "../../component/Input/Selectfield";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { getActivitiesApi, getStaffApi } from "../../api/teams.api";
import type { Team } from "../../api/teams.api";
import { useTranslation } from "../../hooks/useTranslation";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: Team;
  title: string;
}

const TeamModal = ({ isOpen, onClose, onSubmit, initialData, title }: TeamModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [activity, setActivity] = useState("");
  const [numberOfMembers, setNumberOfMembers] = useState<number>(0);
  const [staffMembers, setStaffMembers] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState("0");
  
  const [activities, setActivities] = useState<{ value: string; label: string }[]>([]);
  const [staffList, setStaffList] = useState<{ value: string; label: string }[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actRes, staffRes] = await Promise.all([getActivitiesApi(), getStaffApi()]);
        if (actRes.status) {
          setActivities(actRes.data.map((a: any) => ({ value: a.id.toString(), label: a.name })));
        }
        if (staffRes.status) {
          setStaffList(staffRes.data.map((s: any) => ({ 
            value: s.userDomain, 
            label: s.nameEn || s.nameAr || s.emailAddress 
          })));
        }
      } catch (error) {
        console.error("Error fetching modal data:", error);
      }
    };

    if (isOpen) {
      fetchData();
      if (initialData) {
        setName(initialData.name);
        setActivity(initialData.activity);
        setNumberOfMembers(initialData.numberOfMembers);
        setStaffMembers(initialData.staffMembers ? initialData.staffMembers.split(",") : []);
        setStatus(initialData.status);
        setImagePreview(initialData.image ? `${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${initialData.image}` : null);
      } else {
        setName("");
        setActivity("");
        setNumberOfMembers(0);
        setStaffMembers([]);
        setImage(null);
        setImagePreview(null);
        setStatus("1");
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Team Name is required";
    if (!activity) newErrors.activity = "Activity is required";
    if (numberOfMembers <= 0) newErrors.numberOfMembers = "Number of members must be greater than 0";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("activity", activity);
      formData.append("numberOfMembers", numberOfMembers.toString());
      formData.append("staffMembers", staffMembers.join(","));
      formData.append("status", status);
      if (image) {
        formData.append("image", image);
      }
      if (initialData) {
          formData.append("id", initialData.id.toString());
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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
              label={t.team.name}
              placeholder={t.team.placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Selectfield
              label={t.team.activity}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              options={[{ value: "", label: "Select Activity" }, ...activities]}
              error={errors.activity}
              required
            />

            <InputField
              label={t.team.members}
              type="number"
              placeholder="Enter number of members"
              value={String(numberOfMembers ?? "")}
              onChange={(e) => setNumberOfMembers(parseInt(e.target.value) || 0)}
              error={errors.numberOfMembers}
              required
            />

            <Selectfield
              label={t.team.status}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "1", label: t.team.active },
                { value: "0", label: t.team.inactive },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">
              {t.team.staff} <span className="text-[10px] font-normal opacity-70">{t.team.staffHint}</span>
            </label>
            <select
              multiple
              value={staffMembers}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setStaffMembers(values);
              }}
              className="appearance-none transition-all duration-200 bg-white border border-[#364B9B66] rounded-lg py-2 w-full focus:outline-none text-sm text-gray-700 h-28 px-4"
            >
              {staffList.map((staff) => (
                <option key={staff.value} value={staff.value}>
                  {staff.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-secondary/50">{t.team.image}</label>
            <div className="relative border-2 border-dashed border-[#364B9B66] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs">
                    Change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg className="w-8 h-8 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-secondary">Click to upload</span>
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
              {t.team.cancel}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (t.team.saving || "Saving...") : t.team.save}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;
