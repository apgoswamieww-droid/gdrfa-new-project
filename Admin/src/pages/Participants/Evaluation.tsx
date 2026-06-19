import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getParticipantByIdApi } from "../../api/participants.api";
import type { Participant } from "../../api/participants.api";
import { getFitnessCategoriesApi, storeEvaluationApi, getUserEvaluationsApi, calculateScoresApi } from "../../api/evaluation.api";
import type { FitnessCategory, Evaluation as EvaluationType } from "../../api/evaluation.api";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";

function secondsToMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return String(seconds ?? "");
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const getImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
};

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

const inferGender = (user: any): string | undefined => {
  if (user.sex === "1" || user.sex === 1 || user.gender?.toLowerCase() === "male") return "male";
  if (user.sex === "2" || user.sex === 2 || user.gender?.toLowerCase() === "female") return "female";
  return undefined;
};

const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  const clean = dob.replace(/\s/g, '');
  const parts = clean.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const today = new Date();
    let age = today.getFullYear() - y;
    const md = today.getMonth() - m;
    if (md < 0 || (md === 0 && today.getDate() < d)) age--;
    return age;
  }
  return null;
};

const Evaluation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [categories, setCategories] = useState<FitnessCategory[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<Record<number, { value: string; points: number }>>({});
  const [comments, setComments] = useState("");
  const [gender, setGender] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [liveScores, setLiveScores] = useState<Record<number, number>>({});
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const computedAge = useMemo(() => {
    const apiAge = participant?.user?.age;
    if (apiAge != null && !isNaN(apiAge)) return apiAge;
    return calculateAge(dob);
  }, [participant?.user?.age, dob]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [participantRes, categoriesRes] = await Promise.all([
        getParticipantByIdApi(Number(id)),
        getFitnessCategoriesApi()
      ]);

      if (participantRes.status && participantRes.data) {
        setParticipant(participantRes.data);

        const inferred = inferGender(participantRes.data.user);
        if (inferred) setGender(inferred);

        if (participantRes.data.user.dob) {
          const rawDob = participantRes.data.user.dob;
          const dobStr = typeof rawDob === 'string' ? rawDob : String(rawDob);
          const clean = dobStr.replace(/\s/g, '');
          setDob(clean.includes("T") ? clean.split("T")[0] : clean);
        }

        const historyRes = await getUserEvaluationsApi(participantRes.data.user.id);
        if (historyRes.status && historyRes.data) {
          setEvaluations(historyRes.data);
        }
      }
      if (categoriesRes.status && categoriesRes.data) {
        setCategories(categoriesRes.data);
        const initialValues: Record<number, { value: string; points: number }> = {};
        categoriesRes.data.forEach((cat: any) => {
          initialValues[cat.id] = { value: "", points: 0 };
        });
        setFormValues(initialValues);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
      navigate("/participant-requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

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
        res.data.scores.forEach((s: any) => { map[s.category_id] = s.points; });
        setLiveScores(map);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    scoreTimerRef.current = setTimeout(() => {
      calculateLiveScores(gender, dob, formValues);
    }, 400);
    return () => {
      if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    };
  }, [gender, dob]);

  const scheduleScoreCalc = (vals: Record<number, { value: string; points: number }>) => {
    if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    scoreTimerRef.current = setTimeout(() => {
      calculateLiveScores(gender, dob, vals);
    }, 400);
  };

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
      return Object.values(liveScores).reduce((acc, curr) => acc + curr, 0);
    }
    return Object.values(formValues).reduce((acc, curr) => acc + curr.points, 0);
  }, [formValues, liveScores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;

    const hasValues = Object.values(formValues).some(v => v.value !== "");
    if (!hasValues) {
      toast.error("Please enter at least one evaluation value");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        user_id: participant.user.id,
        comments,
        categories: Object.entries(formValues)
          .filter(([_, v]) => v.value !== "")
          .map(([categoryId, v]) => ({
            id: Number(categoryId),
            value: v.value,
          })),
      };

      if (gender) payload.gender = gender;
      if (dob) payload.dob = dob;

      const res = await storeEvaluationApi(payload);
      if (res.status) {
        toast.success(res.message || "Evaluation saved successfully");
        setComments("");
        const initialValues: Record<number, { value: string; points: number }> = {};
        categories.forEach(cat => {
          initialValues[cat.id] = { value: "", points: 0 };
        });
        setFormValues(initialValues);

        const historyRes = await getUserEvaluationsApi(participant.user.id);
        if (historyRes.status && historyRes.data) {
          setEvaluations(historyRes.data);
        }
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

  if (!participant) return null;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/participant-requests" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Participants</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: Summary ── */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Participant Summary">
            <div className="flex flex-col items-center text-center p-4">
              {participant.user.image ? (
                <img
                  src={getImageUrl(participant.user.image)!}
                  alt={participant.user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm mb-4"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-4 border-4 border-gray-50 shadow-sm">
                  {participant.user.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <h4 className="text-lg font-bold text-secondary">{participant.user.name}</h4>
              <p className="text-sm text-gray-500">{participant.user.email}</p>
              <div className="mt-4 w-full pt-4 border-t border-gray-100 space-y-2 text-left">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>Event:</span>
                  <span className="text-secondary normal-case">{participant.event.name}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>Activity:</span>
                  <span className="text-secondary normal-case">{participant.sportActivity?.name || "-"}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>Gender:</span>
                  <span className="text-secondary normal-case">{gender === "male" ? "Male" : gender === "female" ? "Female" : "Not specified"}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>DOB:</span>
                  <span className="text-secondary normal-case">{dob || "-"}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>Job Title:</span>
                  <span className="text-secondary normal-case">{participant.user.jobTitle || "-"}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Evaluation Score">
            <div className="text-center p-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Points</p>
              <div className="text-5xl font-black text-primary">{totalPoints.toFixed(2).replace(/\.00$/, '')}</div>
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
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-secondary/50">Gender:</span>
                    <span className="font-bold text-secondary capitalize">{gender || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-secondary/50">DOB:</span>
                    <span className="font-bold text-secondary">{dob || "Not set"}</span>
                  </div>
                  {computedAge != null && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-secondary/50">Age:</span>
                      <span className="font-bold text-primary">{computedAge} years</span>
                    </div>
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
                        {liveScores[cat.id] !== undefined && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded min-w-[48px] text-center">
                            {liveScores[cat.id]} pts
                          </span>
                        )}
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

            <SectionCard title="Comments & Observations">
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional notes or observations here..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </SectionCard>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/participant-requests")}
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

      <EvaluationHistory evaluations={evaluations} formatDate={formatDate} />
    </div>
  );
};

const EvaluationHistory = ({ evaluations, formatDate }: { evaluations: EvaluationType[]; formatDate: (d: string) => string }) => (
  <SectionCard title="Evaluation History" icon={
    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  }>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
      {evaluations.length > 0 ? (
        evaluations.map((evalItem) => (
          <div key={evalItem.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-secondary">{formatDate(evalItem.createdAt)}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary">
                {evalItem.total_points} PTS
              </span>
            </div>

            {evalItem.results && evalItem.results.length > 0 && (
              <div className="mb-2 space-y-1">
                {evalItem.results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-secondary font-medium">{r.categoryName || `Category #${r.fitness_category_id}`}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-gray-400">{r.unit_type === "time" ? secondsToMMSS(Number(r.value)) : r.value}</span>
                      <span className="font-bold text-primary">{r.result} pts</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {evalItem.comments && (
              <p className="text-[11px] text-gray-500 italic mb-1 truncate">
                "{evalItem.comments}"
              </p>
            )}
            <div className="text-[10px] text-gray-400">
              By: {evalItem.examiner_name || "Admin"}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-gray-400 text-xs italic">
          No previous evaluations.
        </div>
      )}
    </div>
  </SectionCard>
);

export default Evaluation;
