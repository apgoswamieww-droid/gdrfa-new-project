import { useEffect, useState, useRef } from "react";
import type { CmsPage } from "../../api/cms.api";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import EditorField from "../../component/Editor/EditorField";

interface CmsPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: CmsPage;
  title: string;
}

const CmsPageModal = ({ isOpen, onClose, onSubmit, initialData, title }: CmsPageModalProps) => {
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    status: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const editorEnRef = useRef<any>(null);
  const editorArRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name_en: initialData.name_en || "",
          name_ar: initialData.name_ar || "",
          description_en: initialData.description_en || "",
          description_ar: initialData.description_ar || "",
          status: initialData.status || "1",
        });
      } else {
        setFormData({
          name_en: "",
          name_ar: "",
          description_en: "",
          description_ar: "",
          status: "1",
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name_en.trim()) newErrors.name_en = "Page Name (EN) is required";
    if (!formData.name_ar.trim()) newErrors.name_ar = "Page Name (AR) is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let descriptionEnData = "";
    let descriptionArData = "";

    try {
        if (editorEnRef.current) {
            const savedData = await editorEnRef.current.save();
            descriptionEnData = JSON.stringify(savedData);
        }
        if (editorArRef.current) {
            const savedData = await editorArRef.current.save();
            descriptionArData = JSON.stringify(savedData);
        }

        if (!descriptionEnData || descriptionEnData === '{"blocks":[]}') {
            setErrors(prev => ({ ...prev, description_en: "Description (EN) is required" }));
            return;
        }
        if (!descriptionArData || descriptionArData === '{"blocks":[]}') {
            setErrors(prev => ({ ...prev, description_ar: "Description (AR) is required" }));
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                description_en: descriptionEnData,
                description_ar: descriptionArData,
            });
        } finally {
            setSubmitting(false);
        }
    } catch (error) {
        console.error("Error saving editor data:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start overflow-hidden">
        <div className="bg-white rounded-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-secondary">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                label="Page Name (English)"
                placeholder="Page Name"
                value={formData.name_en}
                onChange={(e) => {
                    setFormData({ ...formData, name_en: e.target.value });
                    if (errors.name_en) setErrors({ ...errors, name_en: "" });
                }}
                error={errors.name_en}
                required
                />
                <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-secondary/50 text-right">
                    اسم الصفحة (بالعربية)
                    <span className="text-red-500 mr-0.5">*</span>
                </label>
                <input
                    className={`transition-all duration-200 bg-white border rounded-full py-1.5 px-4 w-full focus:outline-none text-sm text-gray-700 placeholder-gray-400 text-right ${errors.name_ar ? "border-red-400 focus:ring-1 focus:ring-red-100" : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"}`}
                    placeholder="اسم الصفحة"
                    value={formData.name_ar}
                    onChange={(e) => {
                    setFormData({ ...formData, name_ar: e.target.value });
                    if (errors.name_ar) setErrors({ ...errors, name_ar: "" });
                    }}
                />
                {errors.name_ar && <p className="text-xs text-red-500 pr-1 text-right">{errors.name_ar}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="block text-xs font-semibold text-secondary/50">Description (English) <span className="text-red-500">*</span></label>
                    <EditorField
                        holder="editor-cms-en"
                        initialData={formData.description_en ? JSON.parse(formData.description_en) : null}
                        onReady={(editor) => { editorEnRef.current = editor; }}
                        placeholder="Description..."
                        error={errors.description_en}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="block text-xs font-semibold text-secondary/50 text-right">الوصف (بالعربية) <span className="text-red-500">*</span></label>
                    <EditorField
                        holder="editor-cms-ar"
                        initialData={formData.description_ar ? JSON.parse(formData.description_ar) : null}
                        onReady={(editor) => { editorArRef.current = editor; }}
                        placeholder="الوصف..."
                        error={errors.description_ar}
                    />
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
                {submitting ? "Saving..." : (initialData ? "Update Page" : "Create Page")}
                </PrimaryBtn>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CmsPageModal;
