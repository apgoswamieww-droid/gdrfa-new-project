import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ParticipantsTable from "./ParticipantsTable";
import toast from "react-hot-toast";
import { getParticipantsApi, updateParticipantStatusApi, deleteParticipantApi } from "../../api/participants.api";
import type { Participant } from "../../api/participants.api";
import SearchInput from "../../component/Input/SearchInput";
import ConfirmModal from "../../component/ConfirmModal/ConfirmModal";
import { useTranslation } from "../../hooks/useTranslation";

const ManageParticipants = () => {
  const { t, language } = useTranslation();
  const isArabic = language === "ar";
  const fallback = (english: string, arabic: string) => (isArabic ? arabic : english);
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ id: number; status: string; currentStatus: string } | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchParticipants = async () => {
    try {
      const res = await getParticipantsApi({
        search: searchTerm,
        status: statusFilter,
        start: 0,
        length: 100 // Loading a larger chunk for now, DataTable handles local pagination
      });
      if (res.status) {
        setParticipants(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.message || fallback("Failed to load participants", "فشل تحميل المشاركين"));
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [searchTerm, statusFilter, refreshKey]);

  const handleStatusChange = async (id: number, status: string) => {
    const p = participants.find(p => p.id === id);
    if (!p) return;
    setRejectReason("");
    setStatusChangeTarget({ id, status, currentStatus: p.status });
  };

  const confirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    const isReject = statusChangeTarget.status === "2";
    if (isReject && !rejectReason.trim()) {
      toast.error(t.participants?.rejectReasonRequired || "Rejection reason is required");
      return;
    }
    setStatusChanging(true);
    try {
      const res = await updateParticipantStatusApi(
        statusChangeTarget.id,
        statusChangeTarget.status,
        isReject ? rejectReason.trim() : undefined
      );
      if (res.status || res.success) {
        toast.success(res.message || fallback("Status updated", "تم تحديث الحالة"));
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(res.message || fallback("Failed to update status", "فشل تحديث الحالة"));
      }
    } catch (error: any) {
      toast.error(error.message || fallback("Failed to update status", "فشل تحديث الحالة"));
    } finally {
      setStatusChanging(false);
      setStatusChangeTarget(null);
      setRejectReason("");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      const res = await deleteParticipantApi(deleteTarget);
      if (res.status) {
        toast.success(t.participants?.successDelete || "Participant removed successfully");
        setRefreshKey(prev => prev + 1);
      }
    } catch (error: any) {
      toast.error(error.message || fallback("Failed to remove participant", "فشل إزالة المشارك"));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleView = (data: Participant) => {
    navigate(`/participant-requests/view/${data.id}`);
  };

  return (
    <div className="p-4 2xl:space-y-8 space-y-6 flex flex-col h-full">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <SearchInput
            placeholder={t.participants?.searchPlaceholder || fallback("Search by event name...", "البحث حسب اسم الفعالية...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="w-full sm:w-48 text-sm">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t.participants?.allStatus || "All Status"}</option>
              <option value="0">{t.participants?.filterPending || "Pending"}</option>
              <option value="1">{t.participants?.filterApproved || "Approved"}</option>
              <option value="2">{t.participants?.filterRejected || "Rejected"}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ParticipantsTable
          data={participants}
          onView={handleView}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title={t.participants?.confirmDeleteTitle || "Remove Participant"}
        message={t.participants?.deleteWarning || "This action cannot be undone."}
        confirmLabel={t.participants?.delete || "Remove"}
        cancelLabel={t.participants?.cancel || "Cancel"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <ConfirmModal
        open={statusChangeTarget !== null}
        title={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? t.participants?.cancelRegistration || "Cancel Registration"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? t.participants?.reapproveParticipant || "Re-approve Participant"
              : statusChangeTarget?.status === "1"
                ? t.participants?.approveParticipant || "Approve Participant"
                : t.participants?.rejectParticipant || "Reject Participant"
        }
        message={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? t.participants?.cancelRegistrationMsg || "This participant is already approved. Are you sure you want to cancel their registration?"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? t.participants?.reapproveParticipantMsg || "This participant was rejected. Are you sure you want to re-approve them?"
              : statusChangeTarget?.status === "1"
                ? t.participants?.approveParticipantMsg || "Are you sure you want to approve this participant request?"
                : t.participants?.rejectParticipantMsg || "Are you sure you want to reject this participant request?"
        }
        confirmLabel={
          statusChangeTarget?.currentStatus === "1" && statusChangeTarget?.status === "2"
            ? t.participants?.yesCancel || "Yes, Cancel"
            : statusChangeTarget?.currentStatus === "2" && statusChangeTarget?.status === "1"
              ? t.participants?.yesReapprove || "Yes, Re-approve"
              : statusChangeTarget?.status === "1"
                ? t.participants?.yesApprove || "Yes, Approve"
                : t.participants?.yesReject || "Yes, Reject"
        }
        cancelLabel={t.participants?.cancel || "Cancel"}
        onConfirm={confirmStatusChange}
        onCancel={() => { setStatusChangeTarget(null); setRejectReason(""); }}
        loading={statusChanging}
      >
        {statusChangeTarget?.status === "2" && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-600 mb-1">{t.participants?.rejectReason || "Rejection Reason"}</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
              placeholder={t.participants?.rejectReasonPlaceholder || "Enter the reason for rejection..."}
            />
          </div>
        )}
      </ConfirmModal>

    </div>
  );
};

export default ManageParticipants;
