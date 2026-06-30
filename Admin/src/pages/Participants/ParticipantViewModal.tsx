import { useEffect, useState } from "react";
import { formatDate } from "../../utils/dateUtils";
import { getParticipantByIdApi } from "../../api/participants.api";
import type { Participant } from "../../api/participants.api";
import toast from "react-hot-toast";

interface ParticipantViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: number | null;
}

const ParticipantViewModal = ({ isOpen, onClose, participantId }: ParticipantViewModalProps) => {
  const [data, setData] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);

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
          toast.error(error.message || "Failed to load details");
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
          <h2 className="text-xl font-bold text-secondary">Participant Request Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading details...</div>
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
                <h3 className="text-lg font-bold text-gray-900">{data.user.name}</h3>
                <p className="text-gray-500">{data.user.jobTitle} • {data.user.department}</p>
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Request Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event</label>
                    <p className="text-gray-900 font-semibold">{data.event.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sport Activity</label>
                    <p className="text-gray-900">{data.sportActivity?.name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Activity Type</label>
                    <p className="text-gray-900">{data.activityType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requested At</label>
                    <p className="text-gray-900">{formatDate(data.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stakeholders</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manager</label>
                    <p className="text-gray-900">{data.manager?.name} ({data.manager?.id})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coordinator</label>
                    <p className="text-gray-900">{data.coordinator?.name} ({data.coordinator?.id})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <div className="mt-1">
                      {data.status === "1" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Approved</span>
                      ) : data.status === "2" ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rejected</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">Participant details not found</div>
        )}

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantViewModal;
