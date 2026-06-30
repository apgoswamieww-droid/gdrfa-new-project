import { useState, useEffect } from "react";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";
import { getYearsApi } from "../../api/events.api";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, id?: number) => void;
  initialData?: any | null;
  title: string;
}

const EventModal = ({ isOpen, onClose, onSubmit, initialData, title }: EventModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({
    name: "",
    name_ar: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    numberOfHour: undefined,
    location: "",
    year: undefined,
    eventDescription: "",
    eventDescription_ar: "",
    ageRange: "",
    eventCoordinators: "",
    activityId: "",
    teamName: "",
    targetType: "",
    status: "1",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [years, setYears] = useState<Array<{ id: number; year: number }>>([]);
  const [loading, setLoading] = useState(false);

  // Load years on mount
  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await getYearsApi();
        if (res.data) {
          setYears(res.data);
        }
      } catch (error) {
        console.error("Error loading years:", error);
      }
    };
    if (isOpen) {
      loadYears();
    }
  }, [isOpen]);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          name_ar: initialData.name_ar || "",
          startDate: initialData.startDate ? initialData.startDate.split('T')[0] : "",
          endDate: initialData.endDate ? initialData.endDate.split('T')[0] : "",
          startTime: initialData.startTime || "",
          endTime: initialData.endTime || "",
          numberOfHour: initialData.numberOfHour,
          location: initialData.location || "",
          year: initialData.year,
          eventDescription: initialData.eventDescription || "",
          eventDescription_ar: initialData.eventDescription_ar || "",
          ageRange: initialData.ageRange || "",
          eventCoordinators: initialData.eventCoordinators || "",
          activityId: initialData.activityId || "",
          teamName: initialData.teamName || "",
          targetType: initialData.targetType || "",
          status: initialData.status || "1",
        });
      } else {
        setFormData({
          name: "",
          name_ar: "",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          numberOfHour: undefined,
          location: "",
          year: undefined,
          eventDescription: "",
          eventDescription_ar: "",
          ageRange: "",
          eventCoordinators: "",
          activityId: "",
          teamName: "",
          targetType: "",
          status: "1",
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Event name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Event name must be at least 3 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        await onSubmit(formData, initialData?.id);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
      <div className="w-full max-w-2xl bg-white rounded-xl p-4 shadow-md text-start max-h-[90vh] overflow-y-auto">
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
          {/* English Name */}
          <InputField
            label={t.events?.name || "Event Name (English)"}
            placeholder="Enter event name"
            name="name"
            value={formData.name ?? ""}
            onChange={handleChange}
            error={errors.name}
            required
          />

          {/* Arabic Name */}
          <InputField
            label={t.events?.nameAr || "Event Name (Arabic)"}
            placeholder="اسم الفعالية"
            name="name_ar"
            value={formData.name_ar ?? ""}
            onChange={handleChange}
          />

          {/* Year */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              {t.events?.year || "Year"} <span className="text-red-500">*</span>
            </label>
            <select
              name="year"
              value={formData.year || ""}
              onChange={handleChange}
              className={`w-full px-4 py-1.5 rounded-lg border transition-colors ${errors.year
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-white hover:border-gray-300 focus:border-primary"
                } focus:outline-none`}
            >
              <option value="">{t.events?.selectYear || "Select Year"}</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </select>
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
          </div>

          {/* Location */}
          <InputField
            label={t.events?.location || "Location"}
            placeholder="Enter event location"
            name="location"
            value={formData.location ?? ""}
            onChange={handleChange}
            error={errors.location}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <InputField
              label={t.events?.startDate || "Start Date"}
              type="date"
              name="startDate"
              value={formData.startDate ?? ""}
              onChange={handleChange}
              error={errors.startDate}
              required
            />

            {/* End Date */}
            <InputField
              label={t.events?.endDate || "End Date"}
              type="date"
              name="endDate"
              value={formData.endDate ?? ""}
              onChange={handleChange}
              error={errors.endDate}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <InputField
              label={t.events?.startTime || "Start Time"}
              type="time"
              name="startTime"
              value={formData.startTime ?? ""}
              onChange={handleChange}
            />

            {/* End Time */}
            <InputField
              label={t.events?.endTime || "End Time"}
              type="time"
              name="endTime"
              value={formData.endTime ?? ""}
              onChange={handleChange}
            />
          </div>

          {/* Number of Hours */}
          <InputField
            label={t.events?.numberOfHour || "Number of Hours"}
            type="number"
            name="numberOfHour"
            value={String(formData.numberOfHour ?? "")}
            onChange={handleChange}
            min="0"
            step="0.5"
          />

          {/* Age Range */}
          <InputField
            label={t.events?.ageRange || "Age Range"}
            placeholder="e.g., 18-25"
            name="ageRange"
            value={formData.ageRange ?? ""}
            onChange={handleChange}
          />

          {/* Description (English) */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              {t.events?.description || "Description (English)"}
            </label>
            <textarea
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleChange}
              placeholder="Enter event description"
              rows={3}
              className="w-full px-4 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:border-primary focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Description (Arabic) */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              {t.events?.descriptionAr || "Description (Arabic)"}
            </label>
            <textarea
              name="eventDescription_ar"
              value={formData.eventDescription_ar}
              onChange={handleChange}
              placeholder="وصف الفعالية"
              rows={3}
              className="w-full px-4 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:border-primary focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              {t.events?.status || "Status"}
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="1">{t.events?.active || "Active"}</option>
              <option value="0">{t.events?.inactive || "Inactive"}</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex lg:gap-1.5 gap-1 justify-center items-center font-bold 2xl:text-[0.84vw]/normal lg:text-base/normal text-sm/normal rounded-lg lg:px-4 px-2.5 border border-gray-200 lg:py-1.5 py-1.5 text-gray-600 hover:bg-gray-50 transition ease-in-out duration-300 cursor-pointer flex-1"
            >
              {t.events?.cancel || "Cancel"}
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={loading}>
              {loading ? (t.events?.saving || "Saving...") : (t.events?.save || "Save")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
