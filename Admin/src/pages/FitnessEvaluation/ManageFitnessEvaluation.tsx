import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SearchInput from "../../component/Input/SearchInput";
import ConfirmModal from "../../component/ConfirmModal/ConfirmModal";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import { useTranslation } from "../../hooks/useTranslation";
import {
  getFitnessEvaluationsApi,
  getFitnessEvaluationApi,
  storeFitnessEvaluationsApi,
  deleteFitnessEvaluationApi,
  getFitnessEvaluationYearsApi,
  type FitnessEvaluation,
} from "../../api/fitnessEvaluation.api";
import FitnessEvaluationTable from "./FitnessEvaluationTable";
import FitnessEvaluationModal from "./FitnessEvaluationModal";

const ManageFitnessEvaluation = () => {
  const { t, language } = useTranslation();
  const isArabic = language === "ar";
  const fallback = (english: string, arabic: string) => (isArabic ? arabic : english);
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<FitnessEvaluation[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [years, setYears] = useState<{ year: number }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"upload" | "view">("upload");
  const [modalTitle, setModalTitle] = useState("");
  const [selectedEval, setSelectedEval] = useState<FitnessEvaluation | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<FitnessEvaluation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await getFitnessEvaluationsApi({
        search: searchTerm,
        year: yearFilter,
        start: 0,
        length: 500,
      });
      if (res.status) {
        setEvaluations(res.data.data || []);
        setTotalRecords(res.data.total || 0);
      }
    } catch (error: any) {
      toast.error(error.message || t.fitnessEvaluation.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const res = await getFitnessEvaluationYearsApi();
      if (res.status) {
        setYears(res.data || []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [searchTerm, yearFilter, refreshKey]);

  useEffect(() => {
    fetchYears();
  }, []);

  // ── Upload ──
  const handleUploadClick = () => {
    setSelectedEval(null);
    setModalMode("upload");
    setModalTitle(t.fitnessEvaluation.uploadTitle);
    setModalOpen(true);
  };

  const handleUploadSubmit = async (records: any[]) => {
    try {
      const res = await storeFitnessEvaluationsApi(records);
      if (res.status) {
        const errList = res.data?.errors;
        const summary = errList && errList.length > 0
          ? `${res.message}. Errors: ${errList.map((e: any) => `Row ${e.row}: ${e.message}`).join("; ")}`
          : res.message;
        toast.success(summary, { duration: errList?.length ? 15000 : 4000 });
        if (errList?.length > 0) {
          console.warn("Import errors:", errList);
        }
        setModalOpen(false);
        setRefreshKey(prev => prev + 1);
        // Refresh years after successful import
        fetchYears();
      } else {
        toast.error(res.message || fallback("Import failed", "فشل الاستيراد"));
      }
    } catch (error: any) {
      toast.error(error.message || fallback("Import failed", "فشل الاستيراد"));
    }
  };

  // ── View ──
  const handleView = async (row: FitnessEvaluation) => {
    try {
      const res = await getFitnessEvaluationApi(row.id);
      if (res.status) {
        setSelectedEval(res.data);
      } else {
        setSelectedEval(row);
      }
    } catch {
      setSelectedEval(row);
    }
    setModalMode("view");
    setModalTitle(t.fitnessEvaluation.viewDetails);
    setModalOpen(true);
  };

  // ── Edit → Navigate to evaluation form page ──
  const handleEdit = (row: FitnessEvaluation) => {
    navigate(`/fitness-evaluation/edit/${row.id}`);
  };

  // ── Delete ──
  const handleDelete = (row: FitnessEvaluation) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteFitnessEvaluationApi(deleteTarget.id);
      if (res.status) {
        toast.success(res.message || fallback("Evaluation deleted successfully", "تم حذف التقييم بنجاح"));
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(res.message || fallback("Delete failed", "فشل الحذف"));
      }
    } catch (error: any) {
      toast.error(error.message || fallback("Delete failed", "فشل الحذف"));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleModalSubmit = (data: any) => {
    if (modalMode === "upload") {
      handleUploadSubmit(data);
    }
  };

  return (
    <div className="p-4 2xl:space-y-8 space-y-6 flex flex-col h-full">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <SearchInput
            placeholder={t.fitnessEvaluation.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="w-full sm:w-40 text-sm">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">{t.fitnessEvaluation.allYears}</option>
              {years.map((y) => (
                <option key={y.year} value={y.year}>{y.year}</option>
              ))}
            </select>
          </div>
        </div>
        <PrimaryBtn onClick={handleUploadClick} className="whitespace-nowrap shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {t.fitnessEvaluation.uploadExcel}
        </PrimaryBtn>
      </div>

      <div className="flex-1 min-h-0">
        <FitnessEvaluationTable
          data={evaluations}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          totalRecords={totalRecords}
        />
      </div>

      {/* Upload / View / Edit Modal */}
      <FitnessEvaluationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedEval}
        title={modalTitle}
        mode={modalMode}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={t.fitnessEvaluation.deleteEvaluation}
        message={t.fitnessEvaluation.deleteEvaluationMessage.replace("{name}", deleteTarget?.employee_name || fallback("this employee", "هذا الموظف"))}
        confirmLabel={t.fitnessEvaluation.delete}
        cancelLabel={t.fitnessEvaluation.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ManageFitnessEvaluation;
