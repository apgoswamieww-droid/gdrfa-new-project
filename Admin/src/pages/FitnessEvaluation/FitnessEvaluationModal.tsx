import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import type { FitnessEvaluation } from "../../api/fitnessEvaluation.api";
import InputField from "../../component/Input/InputField";
import PrimaryBtn from "../../component/Button/PrimaryButton";

interface FitnessEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: FitnessEvaluation | null;
  title: string;
  mode: "upload" | "view" | "edit";
}

const FitnessEvaluationModal = ({ isOpen, onClose, onSubmit, initialData, title, mode }: FitnessEvaluationModalProps) => {
  const [formData, setFormData] = useState({
    rank: "",
    grp: "",
    employee_name: "",
    sector: "",
    fitness_status: "",
    year: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          rank: initialData.rank || "",
          grp: initialData.grp || "",
          employee_name: initialData.employee_name || "",
          sector: initialData.sector || "",
          fitness_status: initialData.fitness_status || "",
          year: initialData.year?.toString() || "",
        });
      } else {
        setFormData({ rank: "", grp: "", employee_name: "", sector: "", fitness_status: "", year: "" });
      }
      setParsedRecords([]);
      setParsing(false);
      setParseProgress(0);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [initialData, isOpen, mode]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseProgress(0);
    setParsedRecords([]);
    setErrors({});

    progressTimerRef.current = setInterval(() => {
      setParseProgress(prev => Math.min(prev + 10, 85));
    }, 200);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setParseProgress(90);

        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        setParseProgress(95);

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        setParseProgress(100);

        // Map Excel columns to our schema
        const records = jsonData.map((row: any) => ({
          rank: row.rank || row.Rank || row.RANK || null,
          grp: row.grp || row.Grp || row.GRP || row.Group || row.group || null,
          employee_name: row.employee_name || row.Employee_name || row.EmployeeName || row.employeeName || row["Employee Name"] || row.name || row.Name || null,
          sector: row.sector || row.Sector || row.SECTOR || null,
          fitness_status: row.fitness_status || row.Fitness_status || row.FitnessStatus || row.fitnessStatus || row["Fitness Status"] || null,
          year: row.year || row.Year || row.YEAR ? parseInt(String(row.year || row.Year || row.YEAR)) : null,
        }));

        setTimeout(() => {
          setParsedRecords(records);
          setParsing(false);
          setParseProgress(0);
        }, 300);
      } catch (err: any) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setParsing(false);
        setParseProgress(0);
        setErrors({ file: "Failed to parse Excel file: " + (err.message || "Invalid format") });
      }
    };
    reader.onerror = () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setParsing(false);
      setParseProgress(0);
      setErrors({ file: "Failed to read file" });
    };
    reader.readAsArrayBuffer(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (mode === "upload") {
      if (parsedRecords.length === 0) newErrors.file = "Please upload an Excel file with valid data";
    } else if (mode === "edit") {
      if (!formData.employee_name.trim()) newErrors.employee_name = "Employee name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === "upload") {
        onSubmit(parsedRecords);
      } else if (mode === "edit") {
        onSubmit({
          rank: formData.rank || null,
          grp: formData.grp || null,
          employee_name: formData.employee_name || null,
          sector: formData.sector || null,
          fitness_status: formData.fitness_status || null,
          year: formData.year ? parseInt(formData.year) : null,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderUploadMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-secondary/70 mb-1.5">Upload Excel File</label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
        </div>
        {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}

      {parsing && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Reading file...</span>
            <span className="text-primary font-bold">{parseProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${parseProgress}%` }}
            />
          </div>
        </div>
      )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-1">Expected Excel columns:</p>
        <code className="text-xs text-primary">id, rank, grp, employee_name, sector, fitness_status, year</code>
      </div>

      {!parsing && parsedRecords.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-secondary mb-2">
            Preview: {parsedRecords.length} record(s) found
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">#</th>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">GRP</th>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">Name</th>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">Sector</th>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">Status</th>
                  <th className="px-2 py-1 text-start font-semibold text-gray-500">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRecords.slice(0, 50).map((rec, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                    <td className="px-2 py-1 font-medium">{rec.grp || "-"}</td>
                    <td className="px-2 py-1">{rec.employee_name || "-"}</td>
                    <td className="px-2 py-1">{rec.sector || "-"}</td>
                    <td className="px-2 py-1">{rec.fitness_status || "-"}</td>
                    <td className="px-2 py-1">{rec.year || "-"}</td>
                  </tr>
                ))}
                {parsedRecords.length > 50 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-2 text-center text-gray-400 italic">
                      ... and {parsedRecords.length - 50} more records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderEditMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Rank"
          placeholder="Enter rank"
          value={formData.rank}
          onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
        />
        <InputField
          label="GRP"
          placeholder="Enter group"
          value={formData.grp}
          onChange={(e) => setFormData({ ...formData, grp: e.target.value })}
        />
      </div>
      <InputField
        label="Employee Name"
        placeholder="Enter employee name"
        value={formData.employee_name}
        onChange={(e) => {
          setFormData({ ...formData, employee_name: e.target.value });
          if (errors.employee_name) setErrors({ ...errors, employee_name: "" });
        }}
        error={errors.employee_name}
        required={mode === "edit"}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InputField
          label="Sector"
          placeholder="Enter sector"
          value={formData.sector}
          onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
        />
        <InputField
          label="Fitness Status"
          placeholder="e.g. Pass/Fail"
          value={formData.fitness_status}
          onChange={(e) => setFormData({ ...formData, fitness_status: e.target.value })}
        />
        <InputField
          label="Year"
          type="number"
          placeholder="e.g. 2026"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
        />
      </div>
    </div>
  );

  const renderViewMode = () => {
    const results = initialData?.results || [];
    const total = initialData?.total_points;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">ID</p>
            <p className="text-sm font-bold text-secondary">{initialData?.id || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Rank</p>
            <p className="text-sm font-bold text-secondary">{initialData?.rank || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">GRP</p>
            <p className="text-sm font-bold text-secondary">{initialData?.grp || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Employee Name</p>
            <p className="text-sm font-bold text-secondary">{initialData?.employee_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Sector</p>
            <p className="text-sm font-bold text-secondary">{initialData?.sector || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Fitness Status</p>
            <p className="text-sm font-bold text-secondary">{initialData?.fitness_status || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Year</p>
            <p className="text-sm font-bold text-secondary">{initialData?.year || "-"}</p>
          </div>
        </div>

        {results.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evaluation Results</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-start font-semibold text-gray-500 text-xs uppercase">Category</th>
                    <th className="px-3 py-2 text-start font-semibold text-gray-500 text-xs uppercase">Value</th>
                    <th className="px-3 py-2 text-end font-semibold text-gray-500 text-xs uppercase">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-secondary">{r.categoryName || r.slug || `Category #${r.fitness_category_id}`}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {r.value}
                        {r.unit_type === 'time' ? ' sec' : ''}
                      </td>
                      <td className="px-3 py-2 text-end font-semibold text-primary">{Number(r.result).toFixed(2).replace(/\.00$/, '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Points</p>
          <p className="text-lg font-bold text-primary">
            {total !== null && total !== undefined
              ? `${Number(total).toFixed(2).replace(/\.00$/, '')} pts`
              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Pending
                </span>
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-start overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-secondary">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {mode === "upload" && renderUploadMode()}
          {mode === "edit" && renderEditMode()}
          {mode === "view" && renderViewMode()}

          <div className="pt-4 flex gap-3">
            {mode !== "view" && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-1.5 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex-1"
                >
                  Cancel
                </button>
                <PrimaryBtn
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={submitting || (mode === "upload" && parsedRecords.length === 0)}
                >
                  {submitting 
                    ? "Saving..." 
                    : mode === "upload" 
                      ? `Upload ${parsedRecords.length > 0 ? `(${parsedRecords.length} records)` : ""}`
                      : "Update Evaluation"
                  }
                </PrimaryBtn>
              </>
            )}
            {mode === "view" && (
              <button
                type="button"
                onClick={onClose}
                className="flex justify-center items-center font-bold text-sm rounded-lg px-6 border border-gray-200 py-1.5 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer w-full"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessEvaluationModal;
