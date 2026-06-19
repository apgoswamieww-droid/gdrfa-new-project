import { useState, useRef } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { bulkImportScoreMatrixApi, getFitnessCategoriesApi } from "../../api/fitness.api";
import toast from "react-hot-toast";

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

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkImportModal = ({ isOpen, onClose, onSuccess }: BulkImportModalProps) => {
  const [entries, setEntries] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const convertTimeValues = async (rows: any[]): Promise<any[]> => {
    // Fetch category unit_types to know which values to convert
    const res = await getFitnessCategoriesApi({ length: 100 });
    const catMap: Record<string, string> = {};
    if (res.status) {
      const cats = Array.isArray(res.data) ? res.data : (res.data.data || []);
      cats.forEach((c: any) => {
        catMap[c.id] = c.unit_type;
        catMap[c.slug] = c.unit_type;
        catMap[c.name?.toLowerCase()] = c.unit_type;
      });
    }
    return rows.map(row => {
      const unitType = catMap[row.category_id] || catMap[row.category_slug] || catMap[row.category_name?.toLowerCase()];
      const r = { ...row };
      if (unitType === "time") {
        if (r.min_value && String(r.min_value).includes(":")) {
          const sec = mmssToSeconds(String(r.min_value));
          if (sec !== null) r.min_value = String(sec);
        }
        if (r.max_value && String(r.max_value).includes(":")) {
          const sec = mmssToSeconds(String(r.max_value));
          if (sec !== null) r.max_value = String(sec);
        }
      }
      return r;
    });
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["category_id", "gender", "age_group_id", "score", "min_value", "max_value"];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
      return [];
    }

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i]; });
      return obj;
    }).filter(e => e.category_id && e.gender && e.age_group_id);
  };

  const parseJSON = (text: string): any[] => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      toast.error("JSON must be an array of entries");
      return [];
    } catch {
      toast.error("Invalid JSON format");
      return [];
    }
  };

  const detectAndParse = (text: string): any[] => {
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) return parseJSON(trimmed);
    return parseCSV(trimmed);
  };

  const handleFileUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEntries(e.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    const parsed = detectAndParse(entries);
    if (parsed.length === 0) {
      toast.error("No valid entries found to import");
      return;
    }
    setSubmitting(true);
    try {
      const converted = await convertTimeValues(parsed);
      const res = await bulkImportScoreMatrixApi(converted);
      if (res.status) {
        const errList = res.data?.errors;
        const summary = errList && errList.length > 0
          ? `${res.message}. Errors: ${errList.map((e: any) => `Row ${e.row}: ${e.message}`).join("; ")}`
          : res.message;
        toast.success(summary, { duration: errList?.length ? 15000 : 4000 });
        if (errList && errList.length > 0) {
          console.warn("Bulk import errors:", errList);
        }
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Import failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-secondary">Bulk Import Score Matrix</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a CSV/JSON file or paste data directly</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Upload CSV/JSON File</label>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary font-semibold hover:underline">Choose File</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Or paste data (CSV or JSON)</label>
            <textarea
              value={entries}
              onChange={(e) => setEntries(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-mono"
              placeholder={`CSV format:\ncategory_id,gender,age_group_id,score,min_value,max_value\n1,male,1,10,15,20\n1,male,1,8,10,14\n\nFor time-based categories, use seconds or MM:SS:\n1,male,1,10,600,750\n1,male,1,8,10:00,12:30\n\nOr JSON:\n[{"category_id":1,"gender":"male","age_group_id":1,"score":10,"min_value":"15","max_value":"20"}]`}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Expected columns:</p>
            <code className="text-xs text-primary">category_id, gender, age_group_id, score, min_value, max_value</code>
            <p className="text-xs text-gray-400 mt-1">Alternatively use: category_slug, category_name, age_from, age_to instead of IDs</p>
            <p className="text-xs text-gray-400">For time-based categories, min_value / max_value accept MM:SS format (auto-converted to seconds)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-2 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
            <PrimaryBtn className="flex-1" onClick={handleSubmit} disabled={submitting || !entries.trim()}>
              {submitting ? "Importing..." : `Import ${entries.trim() ? (detectAndParse(entries).length || '...') : 0} entries`}
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
