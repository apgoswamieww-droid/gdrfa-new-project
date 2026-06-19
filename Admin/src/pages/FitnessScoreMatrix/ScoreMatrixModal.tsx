import { useEffect, useMemo, useState } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { getFitnessCategoriesApi, getAgeGroupsApi } from "../../api/fitness.api";

function secondsToMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mmssToSeconds(value: string): number | null {
  const str = value.trim();
  const parts = str.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s) && m >= 0 && s >= 0 && s < 60) return m * 60 + s;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function isValidTimeOrNumber(value: string): boolean {
  if (!value.trim()) return false;
  const asSeconds = mmssToSeconds(value);
  return asSeconds !== null;
}

interface ScoreMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  title: string;
}

const ScoreMatrixModal = ({ isOpen, onClose, onSubmit, initialData, title }: ScoreMatrixModalProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category_id: "",
    gender: "male",
    age_group_id: "",
    score: "",
    min_value: "",
    max_value: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find(c => c.id === Number(formData.category_id));
  const isTimeBased = selectedCategory?.unit_type === "time";

  // Derive display values for time inputs
  const minTimeDisplay = useMemo(() => {
    if (!isTimeBased || !formData.min_value) return "";
    const num = parseFloat(formData.min_value);
    return isNaN(num) ? formData.min_value : secondsToMMSS(num);
  }, [isTimeBased, formData.min_value]);

  const maxTimeDisplay = useMemo(() => {
    if (!isTimeBased || !formData.max_value) return "";
    const num = parseFloat(formData.max_value);
    return isNaN(num) ? formData.max_value : secondsToMMSS(num);
  }, [isTimeBased, formData.max_value]);

  useEffect(() => {
    if (isOpen) {
      getFitnessCategoriesApi({ length: 100 }).then(res => {
        if (res.status) setCategories(Array.isArray(res.data) ? res.data : (res.data.data || []));
      });
      getAgeGroupsApi({}).then(res => {
        if (res.status) setAgeGroups(Array.isArray(res.data) ? res.data : (res.data.data || []));
      });
      if (initialData) {
        setFormData({
          category_id: initialData.category_id?.toString() || "",
          gender: initialData.gender || "male",
          age_group_id: initialData.age_group_id?.toString() || "",
          score: initialData.score?.toString() || "",
          min_value: initialData.min_value?.toString() || "",
          max_value: initialData.max_value?.toString() || "",
        });
      } else {
        setFormData({ category_id: "", gender: "male", age_group_id: "", score: "", min_value: "", max_value: "" });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (!formData.age_group_id) newErrors.age_group_id = "Age group is required";
    if (!formData.score) newErrors.score = "Score is required";

    const rawMin = formData.min_value.trim();
    const rawMax = formData.max_value.trim();
    if (!rawMin) newErrors.min_value = "Min value is required";
    if (!rawMax) newErrors.max_value = "Max value is required";

    if (isTimeBased && rawMin && rawMax) {
      if (!isValidTimeOrNumber(rawMin)) newErrors.min_value = "Use MM:SS or seconds";
      if (!isValidTimeOrNumber(rawMax)) newErrors.max_value = "Use MM:SS or seconds";
      if (!newErrors.min_value && !newErrors.max_value) {
        const minSec = mmssToSeconds(rawMin)!;
        const maxSec = mmssToSeconds(rawMax)!;
        if (minSec >= maxSec) newErrors.max_value = "Max must be greater than Min";
      }
    } else if (!isTimeBased && rawMin && rawMax) {
      const minN = parseFloat(rawMin);
      const maxN = parseFloat(rawMax);
      if (!isNaN(minN) && !isNaN(maxN) && minN >= maxN) newErrors.max_value = "Max must be greater than Min";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let finalMin = formData.min_value.trim();
      let finalMax = formData.max_value.trim();

      if (isTimeBased) {
        const minSec = mmssToSeconds(finalMin);
        const maxSec = mmssToSeconds(finalMax);
        if (minSec !== null) finalMin = String(minSec);
        if (maxSec !== null) finalMax = String(maxSec);
      }

      await onSubmit({
        category_id: Number(formData.category_id),
        gender: formData.gender,
        age_group_id: Number(formData.age_group_id),
        score: Number(formData.score),
        min_value: finalMin,
        max_value: finalMax,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    const cat = categories.find(c => c.id === Number(value));
    const timeBased = cat?.unit_type === "time";

    // If switching to/from time-based, reset values to avoid confusion
    if (timeBased !== isTimeBased) {
      setFormData(prev => ({
        ...prev,
        category_id: value,
        min_value: "",
        max_value: "",
      }));
    } else {
      setFormData(prev => ({ ...prev, category_id: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.category_id ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">Select category...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.unit_type})</option>)}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Gender *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Female</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Age Group *</label>
            <select
              value={formData.age_group_id}
              onChange={(e) => setFormData({ ...formData, age_group_id: e.target.value })}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.age_group_id ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">Select age group...</option>
              {ageGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.group_name || `${ag.age_from} - ${ag.age_to}`}</option>)}
            </select>
            {errors.age_group_id && <p className="text-red-500 text-xs mt-1">{errors.age_group_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Score (Points) *</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 10"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.score ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.score && <p className="text-red-500 text-xs mt-1">{errors.score}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isTimeBased ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Min Time (MM:SS) *</label>
                  <div>
                    <input
                      type="text"
                      placeholder="13:50"
                      value={minTimeDisplay}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sec = mmssToSeconds(val);
                        setFormData(prev => ({ ...prev, min_value: sec !== null ? String(sec) : val }));
                      }}
                      className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.min_value ? "border-red-300" : "border-gray-200"}`}
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formData.min_value && !isNaN(parseFloat(formData.min_value))
                        ? `= ${secondsToMMSS(parseFloat(formData.min_value))}`
                        : "Enter MM:SS"}
                    </p>
                  </div>
                  {errors.min_value && <p className="text-red-500 text-xs mt-1">{errors.min_value}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Max Time (MM:SS) *</label>
                  <div>
                    <input
                      type="text"
                      placeholder="14:00"
                      value={maxTimeDisplay}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sec = mmssToSeconds(val);
                        setFormData(prev => ({ ...prev, max_value: sec !== null ? String(sec) : val }));
                      }}
                      className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.max_value ? "border-red-300" : "border-gray-200"}`}
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formData.max_value && !isNaN(parseFloat(formData.max_value))
                        ? `= ${secondsToMMSS(parseFloat(formData.max_value))}`
                        : "Enter MM:SS"}
                    </p>
                  </div>
                  {errors.max_value && <p className="text-red-500 text-xs mt-1">{errors.max_value}</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Min Value *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formData.min_value}
                    onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.min_value ? "border-red-300" : "border-gray-200"}`}
                  />
                  {errors.min_value && <p className="text-red-500 text-xs mt-1">{errors.min_value}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Max Value *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formData.max_value}
                    onChange={(e) => setFormData({ ...formData, max_value: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.max_value ? "border-red-300" : "border-gray-200"}`}
                  />
                  {errors.max_value && <p className="text-red-500 text-xs mt-1">{errors.max_value}</p>}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-1.5 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex-1">Cancel</button>
            <PrimaryBtn type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : (initialData ? "Update" : "Create")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoreMatrixModal;
