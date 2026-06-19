import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getFitnessCategoryByIdApi } from "../../api/fitness.api";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const ViewFitnessCategory = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategory = async () => {
    if (!id) return;
    try {
      const response = await getFitnessCategoryByIdApi(id);
      if (response.status && response.data) {
        setCategory(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || t.fitness.errorFetch);
      navigate("/masters/fitness-categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">{t.fitness.loading}</p>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3 text-start">
        <Link to="/masters/fitness-categories" className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold text-sm">Back to Fitness Categories</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-start">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">{category.name}</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${category.status === "1" ? "bg-primary-green/8 text-primary-green" : "bg-red-50 text-red-600"}`}>
              <span className={`w-2 h-2 rounded-full ${category.status === "1" ? "bg-primary-green" : "bg-red-500"}`} />
              {category.status === "1" ? t.fitness.active : t.fitness.inactive}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Name</label>
            <p className="text-secondary font-bold text-base">{category.name}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Slug</label>
            <p className="text-secondary font-bold text-base font-mono">{category.slug || "-"}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <label className="block text-xs font-semibold text-secondary/50 mb-1">Unit Type</label>
            <p className="text-secondary font-bold text-base">
              <span className={`px-2 py-1 rounded text-xs font-bold ${category.unit_type === "time" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                {category.unit_type === "time" ? "Time" : "Count"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Score matrix entries for this category can be managed from the{" "}
            <Link to="/eval/fitness-score-matrix" className="text-primary font-semibold hover:underline">
              Score Matrix
            </Link>{" "}
            page.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
          <div className="flex gap-3">
            <span><span className="font-semibold">Created:</span> {formatDate(category.createdAt)}</span>
            <span><span className="font-semibold">Updated:</span> {formatDate(category.updatedAt)}</span>
          </div>
          <Link to="/masters/fitness-categories" className="font-bold text-primary hover:underline">
            {t.fitness.backToList}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewFitnessCategory;
