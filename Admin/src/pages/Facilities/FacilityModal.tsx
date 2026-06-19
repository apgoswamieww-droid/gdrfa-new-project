import { useEffect, useState, useRef } from "react";
import type { Facility } from "../../api/facilities.api";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { validateImageDimensions } from "../../utils/validateImage";

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: Facility;
  title: string;
}

const FacilityModal = ({ isOpen, onClose, onSubmit, initialData, title }: FacilityModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          title_ar: initialData.title_ar || "",
          description: initialData.description || "",
          description_ar: initialData.description_ar || "",
        });
        if (initialData.image) {
          setImagePreview(`${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${initialData.image}`);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({
          title: "",
          title_ar: "",
          description: "",
          description_ar: "",
        });
        setImagePreview(null);
        setImage(null);
      }
      setErrors({});
      setImageError("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title (EN) is required";
    if (!formData.title_ar.trim()) newErrors.title_ar = "Title (AR) is required";
    if (!formData.description.trim()) newErrors.description = "Description (EN) is required";
    if (!formData.description_ar.trim()) newErrors.description_ar = "Description (AR) is required";
    if (!initialData && !image) newErrors.image = "Image is required";
    if (imageError) newErrors.image = imageError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");

    const result = await validateImageDimensions(file, { minAspectRatio: 16 / 9 });

    if (!result.valid) {
      setImageError(result.error);
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("title_ar", formData.title_ar);
      data.append("description", formData.description);
      data.append("description_ar", formData.description_ar);
      // Status is handled via listing toggle, so we keep the current or default to '1'
      data.append("status", initialData?.status || "1");
      if (image) {
        data.append("image", image);
      }
      setSubmitting(true);
      try {
        await onSubmit(data);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start overflow-hidden">
        <div className="bg-white rounded-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-secondary">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Image Upload */}
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-24 h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Photo</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            {imageError && <p className="text-xs text-red-500 text-center max-w-60">{imageError}</p>}
            {errors.image && <p className="text-xs text-red-500 text-center">{errors.image}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Title (English)"
              placeholder="Facility name"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: "" });
              }}
              error={errors.title}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50 text-right">
                العنوان (بالعربية)
                <span className="text-red-500 mr-0.5">*</span>
              </label>
              <input
                className={`transition-all duration-200 bg-white border rounded-lg py-1.5 px-4 w-full focus:outline-none text-sm text-gray-700 placeholder-gray-400 text-right ${errors.title_ar ? "border-red-400 focus:ring-1 focus:ring-red-100" : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"}`}
                placeholder="اسم المنشأة"
                value={formData.title_ar}
                onChange={(e) => {
                  setFormData({ ...formData, title_ar: e.target.value });
                  if (errors.title_ar) setErrors({ ...errors, title_ar: "" });
                }}
              />
              {errors.title_ar && <p className="text-xs text-red-500 pr-1 text-right">{errors.title_ar}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50">Description (English) <span className="text-red-500">*</span></label>
              <textarea
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 min-h-20 resize-none transition-all ${errors.description ? "border-red-400" : "border-[#364B9B66]"}`}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: "" });
                }}
                placeholder="Details about the facility..."
              />
              {errors.description && <p className="text-xs text-red-500 ps-1">{errors.description}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50 text-right">الوصف (بالعربية) <span className="text-red-500">*</span></label>
              <textarea
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 min-h-20 resize-none transition-all text-right ${errors.description_ar ? "border-red-400" : "border-[#364B9B66]"}`}
                value={formData.description_ar}
                onChange={(e) => {
                  setFormData({ ...formData, description_ar: e.target.value });
                  if (errors.description_ar) setErrors({ ...errors, description_ar: "" });
                }}
                placeholder="تفاصيل حول المنشأة..."
              />
              {errors.description_ar && <p className="text-xs text-red-500 pr-1 text-right">{errors.description_ar}</p>}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-1.5 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex-1"
            >
              Cancel
            </button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : (initialData ? "Update Facility" : "Create Facility")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacilityModal;
