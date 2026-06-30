import { useEffect, useState } from "react";
import type { Faq } from "../../api/faqs.api";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Faq;
  title: string;
}

const FaqModal = ({ isOpen, onClose, onSubmit, initialData, title }: FaqModalProps) => {
  const [formData, setFormData] = useState({
    question: "",
    question_ar: "",
    answer: "",
    answer_ar: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          question: initialData.question || "",
          question_ar: initialData.question_ar || "",
          answer: initialData.answer || "",
          answer_ar: initialData.answer_ar || "",
        });
      } else {
        setFormData({
          question: "",
          question_ar: "",
          answer: "",
          answer_ar: "",
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.question.trim()) newErrors.question = "Question (EN) is required";
    if (!formData.question_ar.trim()) newErrors.question_ar = "Question (AR) is required";
    if (!formData.answer.trim()) newErrors.answer = "Answer (EN) is required";
    if (!formData.answer_ar.trim()) newErrors.answer_ar = "Answer (AR) is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      try {
        await onSubmit(formData);
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
          <div className="grid grid-cols-1 gap-3">
            <InputField
              label="Question (English)"
              placeholder="Question"
              value={formData.question}
              onChange={(e) => {
                setFormData({ ...formData, question: e.target.value });
                if (errors.question) setErrors({ ...errors, question: "" });
              }}
              error={errors.question}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50 text-right">
                السؤال (بالعربية)
                <span className="text-red-500 mr-0.5">*</span>
              </label>
              <input
                className={`transition-all duration-200 bg-white border rounded-full py-1.5 px-4 w-full focus:outline-none text-sm text-gray-700 placeholder-gray-400 text-right ${errors.question_ar ? "border-red-400 focus:ring-1 focus:ring-red-100" : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"}`}
                placeholder="السؤال"
                value={formData.question_ar}
                onChange={(e) => {
                  setFormData({ ...formData, question_ar: e.target.value });
                  if (errors.question_ar) setErrors({ ...errors, question_ar: "" });
                }}
              />
              {errors.question_ar && <p className="text-xs text-red-500 pr-1 text-right">{errors.question_ar}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50">Answer (English) <span className="text-red-500">*</span></label>
              <textarea
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 min-h-20 resize-none transition-all ${errors.answer ? "border-red-400" : "border-[#364B9B66]"}`}
                value={formData.answer}
                onChange={(e) => {
                  setFormData({ ...formData, answer: e.target.value });
                  if (errors.answer) setErrors({ ...errors, answer: "" });
                }}
                placeholder="Answer..."
              />
              {errors.answer && <p className="text-xs text-red-500 ps-1">{errors.answer}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary/50 text-right">الإجابة (بالعربية) <span className="text-red-500">*</span></label>
              <textarea
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/10 min-h-20 resize-none transition-all text-right ${errors.answer_ar ? "border-red-400" : "border-[#364B9B66]"}`}
                value={formData.answer_ar}
                onChange={(e) => {
                  setFormData({ ...formData, answer_ar: e.target.value });
                  if (errors.answer_ar) setErrors({ ...errors, answer_ar: "" });
                }}
                placeholder="الإجابة..."
              />
              {errors.answer_ar && <p className="text-xs text-red-500 pr-1 text-right">{errors.answer_ar}</p>}
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
              {submitting ? "Saving..." : (initialData ? "Update FAQ" : "Create FAQ")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqModal;
