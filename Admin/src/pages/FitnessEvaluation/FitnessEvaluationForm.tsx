import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getFitnessEvaluationApi, updateFitnessEvaluationResultsApi, lookupUserByGrpApi, updateEvaluationResultApi, deleteEvaluationSessionApi, type FitnessEvaluation, type FitnessEvaluationResult } from "../../api/fitnessEvaluation.api";
import { getFitnessCategoriesApi, calculateScoresApi } from "../../api/evaluation.api";
import type { FitnessCategory } from "../../api/evaluation.api";
import toast from "react-hot-toast";
import ConfirmModal from "../../component/ConfirmModal/ConfirmModal";

function secondsToMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return String(seconds ?? "");
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function displayValue(value: string, unitType?: string): string {
  if (!value) return "";
  if (unitType === "time") {
    if (value.includes(":")) return value;
    const secs = Number(value);
    return isNaN(secs) ? value : secondsToMMSS(secs);
  }
  return value;
}

const SectionCard = ({ title, subtitle, icon, children, className }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${className || ""}`}>
    {(title || icon) && (
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="rounded-lg bg-primary/10 p-2">{icon}</div>}
        <div>
          <h3 className="text-base font-bold text-secondary">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    )}
    {children}
  </div>
);

const FitnessEvaluationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<FitnessEvaluation | null>(null);
  const [categories, setCategories] = useState<FitnessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<Record<number, { value: string; points: number }>>({});
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [showManualFields, setShowManualFields] = useState(false);
  const [liveScores, setLiveScores] = useState<Record<number, number>>({});
  const [editingResultId, setEditingResultId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editScore, setEditScore] = useState("");
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const skipPrefillRef = useRef(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const handleEditResult = async (resultId: number) => {
    const r = evaluation?.results?.find(x => x.id === resultId);
    if (!r) return;
    setEditingResultId(resultId);
    setEditValue(displayValue(r.value, r.unit_type));
    setEditScore(String(r.result));
  };

  const handleRecalcEdit = async () => {
    if (!editingResultId) return;
    const r = evaluation?.results?.find(x => x.id === editingResultId);
    if (!r) return;
    if (!gender || !dob) {
      toast.error("Please set Gender and DOB in Scoring Configuration first");
      return;
    }
    try {
      const res = await calculateScoresApi({
        gender,
        dob,
        values: [{ category_id: r.fitness_category_id, value: editValue }],
      });
      if (res.status && res.data?.scores?.[0]) {
        let pts = Number(res.data.scores[0].points);
        if (pts === 0) {
          const raw = parseFloat(editValue);
          if (!isNaN(raw) && raw > 0 && r.unit_type !== 'time') {
            pts = Math.round(raw);
          }
        }
        setEditScore(String(pts));
        toast.success(`Recalculated: ${pts} pts`);
      } else {
        toast.error("Recalculation returned no scores");
      }
    } catch (err: any) {
      toast.error(err.message || "Recalculation failed");
    }
  };

  const handleSaveEdit = async (resultId: number) => {
    try {
      const res = await updateEvaluationResultApi(resultId, {
        value: editValue,
        result: parseFloat(editScore) || 0,
      });
      if (res.status) {
        toast.success("Result updated");
        const refreshed = await getFitnessEvaluationApi(Number(id));
        if (refreshed.status && refreshed.data) setEvaluation(refreshed.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setEditingResultId(null);
      setEditValue("");
      setEditScore("");
    }
  };

  const handleDeleteSession = async (resultIds: number[]) => {
    setConfirmModal({
      open: true,
      title: "Delete Session",
      message: "Are you sure you want to delete this entire evaluation session? All results will be removed.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
        try {
          const res = await deleteEvaluationSessionApi(Number(id), resultIds);
          if (res.status) {
            toast.success(res.message || "Session deleted");
            const refreshed = await getFitnessEvaluationApi(Number(id));
            if (refreshed.status && refreshed.data) setEvaluation(refreshed.data);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to delete session");
        }
      }
    });
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      const [evalRes, categoriesRes] = await Promise.all([
        getFitnessEvaluationApi(Number(id)),
        getFitnessCategoriesApi()
      ]);

      if (evalRes.status && evalRes.data) {
        setEvaluation(evalRes.data);

        // Lookup user details from grp (user domain)
        try {
          const lookupRes = await lookupUserByGrpApi(Number(id));
          if (lookupRes.status && lookupRes.data) {
            if (lookupRes.data.gender) setGender(lookupRes.data.gender);
            if (lookupRes.data.dob) setDob(lookupRes.data.dob);
          } else if (lookupRes.status && !lookupRes.data) {
            console.warn('[lookupUserByGrp] No user data:', lookupRes.message);
            toast.error('User details not available in Your CIAM system');
            setShowManualFields(true);
          }
        } catch (err: any) {
          console.warn('[lookupUserByGrp] Error:', err.message);
          toast.error('User lookup failed: ' + err.message);
        }
      }

      if (categoriesRes.status && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
      navigate("/fitness-evaluation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const calculateLiveScores = async (g: string, d: string, vals: Record<number, { value: string; points: number }>) => {
    if (!g || !d) {
      setLiveScores({});
      return;
    }
    const filled = Object.entries(vals)
      .filter(([_, v]) => v.value !== "")
      .map(([catId, v]) => ({ category_id: Number(catId), value: v.value }));
    if (filled.length === 0) {
      setLiveScores({});
      return;
    }
    try {
      const res = await calculateScoresApi({ gender: g, dob: d, values: filled });
      if (res.status && res.data?.scores) {
        const map: Record<number, number> = {};
        res.data.scores.forEach((s: any) => { map[s.category_id] = Number(s.points); });
        setLiveScores(map);
      }
    } catch {
      // silent
    }
  };

  const scheduleScoreCalc = (vals: Record<number, { value: string; points: number }>) => {
    if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    scoreTimerRef.current = setTimeout(() => {
      calculateLiveScores(gender, dob, vals);
    }, 400);
  };

  // Pre-fill form from existing results once data is loaded
  useEffect(() => {
    if (skipPrefillRef.current) {
      skipPrefillRef.current = false;
      return;
    }
    let initialValues: Record<number, { value: string; points: number }> = {};
    if (categories.length > 0) {
      categories.forEach(cat => {
        initialValues[cat.id] = { value: "", points: 0 };
      });
    }
    setFormValues(initialValues);

    // Trigger score calculation if gender/dob already available
    if (gender && dob && Object.values(initialValues).some(v => v.value !== "")) {
      scheduleScoreCalc(initialValues);
    }
  }, [evaluation, categories]);

  useEffect(() => {
    calculateLiveScores(gender, dob, formValues);
  }, [gender, dob]);

  const handleValueChange = (categoryId: number, value: string) => {
    const newValues = {
      ...formValues,
      [categoryId]: { value, points: 0 }
    };
    setFormValues(newValues);
    scheduleScoreCalc(newValues);
  };

  const totalPoints = useMemo(() => {
    const liveKeys = Object.keys(liveScores);
    if (liveKeys.length > 0) {
      return Object.values(liveScores).reduce((acc, curr) => acc + Number(curr), 0);
    }
    return Object.values(formValues).reduce((acc, curr) => acc + Number(curr.points), 0);
  }, [formValues, liveScores]);

  const groupedResults = useMemo(() => {
    if (!evaluation?.results || evaluation.results.length === 0) return [];
    const groups: { key: string; resultIds: number[]; label: string; results: FitnessEvaluationResult[]; total: number }[] = [];
    const map = new Map<string, FitnessEvaluationResult[]>();
    evaluation.results.forEach(r => {
      const d = new Date(r.createdAt ?? "");
      const key = `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    const sortedKeys = Array.from(map.keys()).sort().reverse();
    sortedKeys.forEach((key, i) => {
      const items = map.get(key)!;
      const total = items.reduce((s, r) => s + Number(r.result), 0);
      groups.push({ key, resultIds: items.map(r => r.id), label: i === 0 ? "Current Results" : `Previous — ${key}`, results: items, total });
    });
    return groups;
  }, [evaluation?.results]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const hasValues = Object.values(formValues).some(v => v.value !== "");
    if (!hasValues) {
      toast.error("Please enter at least one evaluation value");
      return;
    }

    if (!gender || !dob) {
      toast.error("Please set Gender and DOB in Scoring Configuration before saving");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        categories: Object.entries(formValues)
          .filter(([_, v]) => v.value !== "")
          .map(([categoryId, v]) => ({
            id: Number(categoryId),
            value: v.value,
          })),
      };

      payload.gender = gender;
      payload.dob = dob;

      const res = await updateFitnessEvaluationResultsApi(Number(id), payload);
      if (res.status) {
        toast.success(res.message || "Evaluation updated successfully");
        skipPrefillRef.current = true;
        const refreshed = await getFitnessEvaluationApi(Number(id));
        if (refreshed.status && refreshed.data) {
          setEvaluation(refreshed.data);
        }
        const empty = Object.fromEntries(
          categories.map(cat => [cat.id, { value: "", points: 0 }])
        );
        setFormValues(empty);
        setLiveScores({});
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading...</p>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/fitness-evaluation" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Fitness Evaluations</span>
        </Link>
      </div>

      {/* ── Imported Data Summary ── */}
      <SectionCard title="Employee Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Name</p>
            <p className="text-sm font-bold text-secondary">{evaluation.employee_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Rank</p>
            <p className="text-sm font-bold text-secondary">{evaluation.rank || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">GRP</p>
            <p className="text-sm font-bold text-secondary">{evaluation.grp || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Sector</p>
            <p className="text-sm font-bold text-secondary">{evaluation.sector || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Year</p>
            <p className="text-sm font-bold text-secondary">{evaluation.year || "-"}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: Score + Gender/DOB ── */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Evaluation Score">
            <div className="text-center p-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Points</p>
              <div className="text-5xl font-black text-primary">{totalPoints.toFixed(2).replace(/\.00$/, '')}</div>
            </div>
          </SectionCard>

          <SectionCard title="Scoring Configuration">
            <div className="space-y-3">
              {showManualFields ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</span>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="text-sm font-bold text-secondary capitalize border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">DOB</span>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="text-sm font-bold text-secondary border border-gray-200 rounded-lg px-2 py-1 bg-white" />
                  </div>
                </>
              ) : (
                <>
                  {gender ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</span>
                      <span className="text-sm font-bold text-secondary capitalize">{gender}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender</span>
                      <span className="text-sm text-gray-400">Not available</span>
                    </div>
                  )}
                  {dob ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">DOB</span>
                      <span className="text-sm font-bold text-secondary">{dob}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">DOB</span>
                      <span className="text-sm text-gray-400">Not available</span>
                    </div>
                  )}
                </>
              )}
              {gender && dob && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                  Scores auto-calculated from age & gender
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN: Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard
              title="Fitness Categories"
              subtitle="Enter the results for each fitness test"
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                  {showManualFields ? (
                    <>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-secondary/50">Gender:</span>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="font-bold text-secondary capitalize border border-gray-200 rounded-lg px-2 py-1 bg-white text-sm">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-secondary/50">DOB:</span>
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="font-bold text-secondary border border-gray-200 rounded-lg px-2 py-1 bg-white text-sm" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-secondary/50">Gender:</span>
                        <span className="font-bold text-secondary capitalize">{gender || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-secondary/50">DOB:</span>
                        <span className="font-bold text-secondary">{dob || "Not set"}</span>
                      </div>
                    </>
                  )}
                  {gender && dob && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      Scores auto-calculated from age & gender
                    </div>
                  )}
                </div>

                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-secondary mb-1">
                          {cat.name}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${cat.unit_type === "time" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                            {cat.unit_type === "time" ? "Time (MM:SS)" : "Count"}
                          </span>
                        </label>
                        <p className="text-xs text-gray-400">
                          {cat.unit_type === "time"
                            ? "Enter time in MM:SS format (e.g. 12:30)"
                            : "Enter the number completed"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type={cat.unit_type === "time" ? "text" : "number"}
                            step={cat.unit_type === "time" ? undefined : "any"}
                            placeholder={cat.unit_type === "time" ? "MM:SS" : "0"}
                            value={formValues[cat.id]?.value || ""}
                            onChange={(e) => handleValueChange(cat.id, e.target.value)}
                            className="w-40 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        {liveScores[cat.id] !== undefined ? (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded min-w-[48px] text-center">
                            {liveScores[cat.id]} pts
                          </span>
                        ) : formValues[cat.id]?.value !== "" ? (
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded min-w-[48px] text-center">
                            {formValues[cat.id]?.points || "..."}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm italic">No active fitness categories found.</p>
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/fitness-evaluation")}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || categories.length === 0}
                className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Evaluation"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Evaluation History (full width, one card = one session) ── */}
      {groupedResults.length > 0 && (
        <SectionCard title="Evaluation History" icon={
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }>
          <div className="grid grid-cols-3 gap-3">
            {groupedResults.map((group, gi) => (
              <div key={group.key} className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-secondary">{gi === 0 ? "Latest" : group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-primary">{group.total.toFixed(2).replace(/\.00$/, '')} pts</span>
                    <button onClick={() => handleDeleteSession(group.resultIds)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5" title="Delete session">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  {group.results.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-50/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-semibold text-gray-600 truncate">{r.categoryName || `Cat #${r.fitness_category_id}`}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-gray-500">{displayValue(r.value, r.unit_type)}</span>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{r.result} pts</span>
                        <button onClick={() => handleEditResult(r.id)} className="text-gray-400 hover:text-blue-600 transition-colors p-0.5" title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {editingResultId && group.results.some(r => r.id === editingResultId) && (
                  <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 px-1.5 py-0.5 text-[11px] border border-blue-200 rounded"
                        placeholder="Value"
                      />
                      <input
                        type="number"
                        value={editScore}
                        onChange={e => setEditScore(e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-[11px] border border-blue-200 rounded"
                        placeholder="Pts"
                      />
                      <button onClick={() => handleSaveEdit(editingResultId)} className="text-green-600 hover:text-green-700 p-0.5" title="Save">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      {gender && dob && <button onClick={handleRecalcEdit} className="text-orange-500 hover:text-orange-600 p-0.5" title="Recalculate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                      </button>}
                      <button onClick={() => setEditingResultId(null)} className="text-gray-400 hover:text-gray-600 p-0.5" title="Cancel">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default FitnessEvaluationForm;
