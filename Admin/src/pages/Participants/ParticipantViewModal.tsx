import { useEffect, useState } from "react";
import { formatDate } from "../../utils/dateUtils";
import { getParticipantByIdApi } from "../../api/participants.api";
import type { Participant } from "../../api/participants.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";

interface ParticipantViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: number | null;
}

const ParticipantViewModal = ({ isOpen, onClose, participantId }: ParticipantViewModalProps) => {
  const [data, setData] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, language } = useTranslation();
  const isArabic = language === "ar";
  const fallback = (english: string, arabic: string) => (isArabic ? arabic : english);
  const localized = (en?: string | null, ar?: string | null, empty = "-") =>
    (isArabic ? ar || en : en || ar) || empty;

  useEffect(() => {
    if (isOpen && participantId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const res = await getParticipantByIdApi(participantId);
          if (res.status) {
            setData(res.data);
          }
        } catch (error: any) {
          toast.error(error.message || fallback("Failed to load details", "فشل تحميل التفاصيل"));
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, participantId]);

  if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
            <div className="bg-white rounded-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-secondary">{t.participants.participantRequestDetails || fallback("Participant Request Details", "تفاصيل طلب المشارك")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">{t.participants.loadingDetails}</div>
        ) : data ? (
          <div className="p-5 space-y-8">
            {/* User Section */}
            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
              {data.user.image ? (
                <img src={data.user.image} alt={data.user.name} className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {data.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{localized(data.user.name, (data.user as any).nameAr)}</h3>
                <p className="text-gray-500">{localized(data.user.jobTitle, (data.user as any).jobTitleAr)} • {localized(data.user.department, data.user.departmentAr)}</p>
                <div className="mt-2 flex gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {data.user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {data.user.mobile}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event & Activity */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.participants.requestInformation || fallback("Request Information", "معلومات الطلب")}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.event}</label>
                    <p className="text-gray-900 font-semibold">{localized(data.event.name, data.event.nameAr)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.sportActivity || fallback("Sport Activity", "النشاط الرياضي")}</label>
                    <p className="text-gray-900">{localized(data.sportActivity?.name, (data.sportActivity as any)?.name_ar)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.activityType || fallback("Activity Type", "نوع النشاط")}</label>
                    <p className="text-gray-900">{data.activityType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.requestedAt}</label>
                    <p className="text-gray-900">{formatDate(data.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.participants.stakeholders || fallback("Stakeholders", "أصحاب المصلحة")}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.manager || fallback("Manager", "المدير")}</label>
                    <p className="text-gray-900">{localized(data.manager?.name, data.manager?.nameAr)} ({data.manager?.id})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.coordinator || fallback("Coordinator", "المنسق")}</label>
                    <p className="text-gray-900">{localized(data.coordinator?.name, data.coordinator?.nameAr)} ({data.coordinator?.id})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.participants.currentStatus || fallback("Current Status", "الحالة الحالية")}</label>
                    <div className="mt-1">
                      {data.status === "1" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t.participants.approvedStatus || t.participants.approved}</span>
                      ) : data.status === "2" ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{t.participants.rejectedStatus || t.participants.rejected}</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">{t.participants.pendingStatus || t.participants.pending}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">{t.participants.participantNotFound || fallback("Participant details not found", "لم يتم العثور على تفاصيل المشارك")}</div>
        )}

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            {t.participants.close || fallback("Close", "إغلاق")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantViewModal;
