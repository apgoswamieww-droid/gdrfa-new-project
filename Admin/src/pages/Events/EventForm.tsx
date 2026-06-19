import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from "@react-google-maps/api";
import InputField from "../../component/Input/InputField";
import Selectfield from "../../component/Input/Selectfield";
import { useTranslation } from "../../hooks/useTranslation";
import { getYearsApi, getEventCoordinatorsApi } from "../../api/events.api";
import toast from "react-hot-toast";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

interface EventFormProps {
  initialData?: any | null;
  onSubmit: (data: any, imageFile?: File | null) => Promise<void>;
}

const AGE_RANGES = ["18-25", "26-30", "31-35", "36-40", "41 and above"];
const LIBRARIES: ("places" | "drawing" | "geometry")[] = ["places"];
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

const EventForm = ({ initialData, onSubmit }: EventFormProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [formData, setFormData] = useState<any>({
    name: "",
    name_ar: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    numberOfHour: undefined,
    location: "",
    lat: undefined,
    lng: undefined,
    year: undefined,
    eventDescription: "",
    eventDescription_ar: "",
    ageRange: "",
    eventCoordinators: "",
    image: "",
    status: "1",
    regStartDate: "",
    regEndDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [years, setYears] = useState<Array<{ id: number; year: number }>>([]);
  const [coordinators, setCoordinators] = useState<Array<{ id: string; name: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY || "AIzaSyA1mtSPftXjFT8mTaLgOwFk2wfx1yRvb2c",
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [yearsRes, coordRes] = await Promise.all([
          getYearsApi(),
          getEventCoordinatorsApi(),
        ]);
        if (yearsRes.data) setYears(yearsRes.data);
        if (coordRes.data) setCoordinators(coordRes.data);
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
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
        lat: initialData.lat !== undefined && initialData.lat !== null ? Number(initialData.lat) : undefined,
        lng: initialData.lng !== undefined && initialData.lng !== null ? Number(initialData.lng) : undefined,
        year: initialData.year,
        eventDescription: initialData.eventDescription || "",
        eventDescription_ar: initialData.eventDescription_ar || "",
        ageRange: initialData.ageRange || "",
        eventCoordinators: initialData.eventCoordinators || "",
        image: initialData.image || "",
        status: initialData.status || "1",
        regStartDate: initialData.regStartDate ? initialData.regStartDate.split('T')[0] : "",
        regEndDate: initialData.regEndDate ? initialData.regEndDate.split('T')[0] : "",
      });
      if (initialData.image) {
        setImagePreview(`${IMAGE_BASE_URL}${initialData.image.startsWith("/") ? initialData.image.slice(1) : initialData.image}`);
      } else {
        setImagePreview(null);
      }
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t.events?.nameRequired || "Event name is required";
    }

    if (!formData.name_ar?.trim()) {
      newErrors.name_ar = t.events?.nameArRequired || "Arabic event name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = t.events?.startDateRequired || "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = t.events?.endDateRequired || "End date is required";
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = t.events?.endDateAfterStart || "End date must be after start date";
    }

    if (formData.regStartDate && formData.regEndDate && new Date(formData.regEndDate) <= new Date(formData.regStartDate)) {
      newErrors.regEndDate = t.events?.regEndDateBeforeStart || "Registration end date must be after registration start date";
    }

    if (formData.regStartDate && formData.startDate && new Date(formData.startDate) < new Date(formData.regStartDate)) {
      newErrors.startDate = t.events?.startDateAfterRegStart || "Event start date cannot be earlier than registration start date";
    }

    if (formData.regEndDate && formData.startDate && new Date(formData.startDate) < new Date(formData.regEndDate)) {
      newErrors.startDate = t.events?.startDateAfterRegEnd || "Event start date must be on or after registration end date";
    }

    if (formData.regEndDate && formData.endDate && new Date(formData.endDate) < new Date(formData.regEndDate)) {
      newErrors.endDate = t.events?.endDateAfterRegEnd || "Event end date cannot be earlier than registration end date";
    }

    if (!formData.startTime) {
      newErrors.startTime = t.events?.startTimeRequired || "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = t.events?.endTimeRequired || "End time is required";
    }

    if (!formData.numberOfHour) {
      newErrors.numberOfHour = t.events?.hoursRequired || "Number of hours is required";
    }

    if (!formData.eventDescription?.trim()) {
      newErrors.eventDescription = t.events?.descriptionRequired || "Description is required";
    }

    if (!formData.eventDescription_ar?.trim()) {
      newErrors.eventDescription_ar = t.events?.descriptionArRequired || "Arabic description is required";
    }

    if (!formData.eventCoordinators || formData.eventCoordinators.length === 0) {
      newErrors.eventCoordinators = t.events?.coordinatorsRequired || "At least one coordinator is required";
    }

    if (!formData.location?.trim()) {
      newErrors.location = t.events?.locationRequired || "Location is required";
    }

    if (!formData.year) {
      newErrors.year = t.events?.yearRequired || "Year is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t.events?.validationError || "Please fix the errors in the form before saving.");
      return false;
    }

    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };

      if ((name === "startTime" || name === "endTime") && updated.startTime && updated.endTime) {
        const [startH, startM] = updated.startTime.split(":").map(Number);
        const [endH, endM] = updated.endTime.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        let diffMinutes = endMinutes - startMinutes;
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        const hours = Math.round((diffMinutes / 60) * 10) / 10;
        updated.numberOfHour = hours > 0 ? hours : undefined;
      }

      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value ? Number(value) : undefined,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoordinatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev: any) => ({
      ...prev,
      eventCoordinators: selected.join(","),
    }));
    if (errors.eventCoordinators) {
      setErrors((prev) => ({ ...prev, eventCoordinators: "" }));
    }
  };

  // Google Maps Handlers
  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || "";

        setFormData((prev: any) => ({
          ...prev,
          location: address,
          lat,
          lng
        }));

        if (errors.location) {
          setErrors(prev => ({ ...prev, location: "" }));
        }
      }
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse Geocoding
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setFormData((prev: any) => ({
            ...prev,
            location: results[0].formatted_address,
            lat,
            lng
          }));
          if (errors.location) {
            setErrors(prev => ({ ...prev, location: "" }));
          }
        } else {
          setFormData((prev: any) => ({
            ...prev,
            lat,
            lng
          }));
        }
      });
    }
  }, [errors.location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData, imageFile);
    }
  };

  const handleDateChange = (name: "startDate" | "endDate" | "regStartDate" | "regEndDate", dates: Date[]) => {
    if (dates.length > 0) {
      const dateStr = dates[0].toLocaleDateString('en-CA'); // YYYY-MM-DD
      setFormData((prev: any) => ({ ...prev, [name]: dateStr }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: "" }));
      }
    }
  };

  const isLatValid = formData.lat !== undefined && formData.lat !== null && isFinite(Number(formData.lat));
  const isLngValid = formData.lng !== undefined && formData.lng !== null && isFinite(Number(formData.lng));
  const hasValidCoords = isLatValid && isLngValid;
  const mapCenter = hasValidCoords
    ? { lat: Number(formData.lat), lng: Number(formData.lng) }
    : { lat: 25.276987, lng: 55.296249 }; // Dubai center

  return (
    <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
      {/* ===== Event Banner ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Banner & Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 p-5 text-center">
            <h5 className="font-bold text-secondary mb-4 text-start">
              {t.events?.eventBanner || "Event Banner"}
            </h5>
            <div className="relative inline-block w-full">
              <img
                id="imagePreview"
                src={imagePreview || ""}
                alt="Preview"
                className="rounded-xl shadow-sm object-cover w-full border"
                style={{ height: "200px" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-sm rounded-full shadow"
                style={{ position: "absolute", bottom: "-8px", right: "8px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-gray-400 text-xs mt-3 mb-0">
              {t.events?.defaultBanner || "Default banner will be used if no image is selected"}
            </p>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h5 className="font-bold text-secondary mb-4">
              <svg className="inline me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              {t.events?.configuration || "Configuration"}
            </h5>

            <div className="mb-4">
              <Selectfield
                label={t.events?.year || "Plan Year"}
                name="year"
                value={formData.year || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev: any) => ({
                    ...prev,
                    year: val ? Number(val) : undefined,
                  }));
                  if (errors.year) setErrors((prev) => ({ ...prev, year: "" }));
                }}
                options={[
                  { value: "", label: t.events?.selectYear || "Select Year" },
                  ...years.map((y) => ({ value: y.year, label: y.year.toString() })),
                ]}
                error={errors.year}
                required
              />
            </div>

            <div className="mb-4">
              <Selectfield
                label={t.events?.ageRange || "Age Range"}
                name="ageRange"
                value={formData.ageRange || ""}
                onChange={handleChange}
                options={[
                  { value: "", label: t.events?.selectAgeRange || "Select Age Range" },
                  ...AGE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
                error={errors.ageRange}
              />
            </div>

            <div className="mb-0">
              <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                {t.events?.eventCoordinators || "Event Coordinators"} <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                value={formData.eventCoordinators ? formData.eventCoordinators.split(",") : []}
                onChange={handleCoordinatorChange}
                className={`appearance-none transition-all duration-200 bg-white border rounded-lg py-2 w-full focus:outline-none text-sm text-gray-700 h-28 px-4 ${errors.eventCoordinators
                    ? "border-red-400 focus:ring-1 focus:ring-red-100"
                    : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"
                  }`}
              >
                {coordinators.map((coord) => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name}
                  </option>
                ))}
              </select>
              {errors.eventCoordinators && <p className="text-xs text-red-500 ps-1 mt-1">{errors.eventCoordinators}</p>}
              <p className="text-gray-400 text-[10px] mt-1 opacity-70">{t.events?.holdCtrl || "(Hold Ctrl/Cmd to select multiple)"}</p>
            </div>
          </div>
        </div>

        {/* Right Column - General Information & Location */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h5 className="font-bold text-secondary mb-4 pb-3 border-b">
              {t.events?.generalInfo || "General Information"}
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <InputField
                label={t.events?.name || "Event Name (English)"}
                placeholder="Enter event name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <InputField
                label={t.events?.nameAr || "Event Name (Arabic)"}
                placeholder="اسم الفعالية"
                name="name_ar"
                value={formData.name_ar || ""}
                onChange={handleChange}
                error={errors.name_ar}
                required
              />
            </div>

           

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.regStartDate || "Registration Start Date"}
                </label>
                <Flatpickr
                  value={formData.regStartDate}
                  onChange={(dates) => handleDateChange("regStartDate", dates)}
                  options={{
                    dateFormat: "Y-m-d",
                    minDate: "today",
                    allowInput: true,
                  }}
                  className={`w-full px-4 py-1.5 rounded-lg border text-sm transition-colors ${errors.regStartDate
                      ? "border-red-400 focus:ring-1 focus:ring-red-100 bg-red-50"
                      : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10 bg-white"
                    } focus:outline-none`}
                  placeholder="Select Registration Start Date"
                />
                {errors.regStartDate && <p className="text-xs text-red-500 ps-1 mt-1">{errors.regStartDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.regEndDate || "Registration End Date"}
                </label>
                <Flatpickr
                  value={formData.regEndDate}
                  onChange={(dates) => handleDateChange("regEndDate", dates)}
                  options={{
                    dateFormat: "Y-m-d",
                    minDate: formData.regStartDate || "today",
                    allowInput: true,
                  }}
                  className={`w-full px-4 py-1.5 rounded-lg border text-sm transition-colors ${errors.regEndDate
                      ? "border-red-400 focus:ring-1 focus:ring-red-100 bg-red-50"
                      : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10 bg-white"
                    } focus:outline-none`}
                  placeholder="Select Registration End Date"
                />
                {errors.regEndDate && <p className="text-xs text-red-500 ps-1 mt-1">{errors.regEndDate}</p>}
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.startDate || "Start Date"} <span className="text-red-500">*</span>
                </label>
                <Flatpickr
                  value={formData.startDate}
                  onChange={(dates) => handleDateChange("startDate", dates)}
                  options={{
                    dateFormat: "Y-m-d",
                    minDate: formData.regEndDate || undefined,
                    allowInput: true,
                  }}
                  className={`w-full px-4 py-1.5 rounded-lg border text-sm transition-colors ${errors.startDate
                      ? "border-red-400 focus:ring-1 focus:ring-red-100 bg-red-50"
                      : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10 bg-white"
                    } focus:outline-none`}
                  placeholder="Select Start Date"
                />
                {errors.startDate && <p className="text-xs text-red-500 ps-1 mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.endDate || "End Date"} <span className="text-red-500">*</span>
                </label>
                <Flatpickr
                  value={formData.endDate}
                  onChange={(dates) => handleDateChange("endDate", dates)}
                  options={{
                    dateFormat: "Y-m-d",
                    minDate: formData.startDate || formData.regEndDate || undefined,
                    allowInput: true,
                  }}
                  className={`w-full px-4 py-1.5 rounded-lg border text-sm transition-colors ${errors.endDate
                      ? "border-red-400 focus:ring-1 focus:ring-red-100 bg-red-50"
                      : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10 bg-white"
                    } focus:outline-none`}
                  placeholder="Select End Date"
                />
                {errors.endDate && <p className="text-xs text-red-500 ps-1 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.startTime || "Start Time"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-1.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 transition-colors ${errors.startTime
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#364B9B66] focus:ring-primary/10"
                    }`}
                />
                {errors.startTime && <p className="text-xs text-red-500 ps-1 mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.endTime || "End Time"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-1.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 transition-colors ${errors.endTime
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#364B9B66] focus:ring-primary/10"
                    }`}
                />
                {errors.endTime && <p className="text-xs text-red-500 ps-1 mt-1">{errors.endTime}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.numberOfHour || "Total Hours"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfHour"
                  value={formData.numberOfHour ?? ""}
                  onChange={handleNumberChange}
                  min="0.5"
                  step="0.5"
                  placeholder="0"
                  className={`w-full px-4 py-1.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 transition-colors ${errors.numberOfHour
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#364B9B66] focus:ring-primary/10"
                    }`}
                />
                {errors.numberOfHour && <p className="text-xs text-red-500 ps-1 mt-1">{errors.numberOfHour}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                {t.events?.description || "Event Description (English)"} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="eventDescription"
                value={formData.eventDescription || ""}
                onChange={handleChange}
                placeholder="Describe the event..."
                rows={4}
                className={`w-full px-4 py-1.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 transition-colors resize-none ${errors.eventDescription
                    ? "border-red-400 focus:ring-red-100"
                    : "border-[#364B9B66] focus:ring-primary/10"
                  }`}
              />
              {errors.eventDescription && <p className="text-xs text-red-500 ps-1 mt-1">{errors.eventDescription}</p>}
            </div>

            <div className="mb-0">
              <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                {t.events?.descriptionAr || "Event Description (Arabic)"} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="eventDescription_ar"
                value={formData.eventDescription_ar || ""}
                onChange={handleChange}
                placeholder="وصف الفعالية"
                rows={4}
                dir="rtl"
                className={`w-full px-4 py-1.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 transition-colors resize-none ${errors.eventDescription_ar
                    ? "border-red-400 focus:ring-red-100"
                    : "border-[#364B9B66] focus:ring-primary/10"
                  }`}
              />
              {errors.eventDescription_ar && <p className="text-xs text-red-500 ps-1 mt-1">{errors.eventDescription_ar}</p>}
            </div>
          </div>

          {/* Venue & Location */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h5 className="font-bold text-secondary mb-4">
              <svg className="inline me-2 text-red-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {t.events?.venueLocation || "Venue & Location"}
            </h5>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                {t.events?.location || "Location Name"} <span className="text-red-500">*</span>
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    placeholder="Search for a location"
                    className={`w-full px-4 py-1.5 rounded-lg border text-sm transition-colors ${errors.location
                        ? "border-red-400 focus:ring-1 focus:ring-red-100 bg-red-50"
                        : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10 bg-white"
                      } focus:outline-none`}
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                  placeholder="Loading maps..."
                  disabled
                  className="w-full px-4 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                />
              )}
              {errors.location && <p className="text-xs text-red-500 ps-1 mt-1">{errors.location}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.latitude || "Latitude"}
                </label>
                <input
                  type="number"
                  name="lat"
                  value={formData.lat ?? ""}
                  onChange={handleNumberChange}
                  step="any"
                  placeholder="25.276987"
                  className="w-full px-4 py-1.5 rounded-lg border border-[#364B9B66] bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary/50 mb-1.5">
                  {t.events?.longitude || "Longitude"}
                </label>
                <input
                  type="number"
                  name="lng"
                  value={formData.lng ?? ""}
                  onChange={handleNumberChange}
                  step="any"
                  placeholder="55.296249"
                  className="w-full px-4 py-1.5 rounded-lg border border-[#364B9B66] bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 transition-colors"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden" style={{ height: "350px" }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={13}
                  onClick={onMapClick}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                  }}
                >
                  {isLatValid && isLngValid && (
                    <Marker position={{ lat: Number(formData.lat), lng: Number(formData.lng) }} />
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>{t.events?.loadingMap || "Loading Map..."}</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 opacity-70">
              {t.events?.mapInstructions || "Click on the map to select a location, or search for an address above."}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EventForm;