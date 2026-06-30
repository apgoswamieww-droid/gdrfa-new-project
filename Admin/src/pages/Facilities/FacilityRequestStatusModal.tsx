import { useState } from "react";
import { changeFacilityRequestStatusApi } from "../../api/facilityRequests.api";
import toast from "react-hot-toast";

interface FacilityRequestStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requesterName: string;
  facilityName: string;
  onStatusUpdated: () => void;
}

type Action = "1" | "2" | "3" | null;

const actionConfig: Record<string, { label: string; className: string; icon: string }> = {
  "1": {
    label: "Approve",
    className: "bg-green-600 hover:bg-green-700 text-white",
    icon: "✓",
  },
  "2": {
    label: "Reject",
    className: "bg-red-600 hover:bg-red-700 text-white",
    icon: "✕",
  },
  "3": {
    label: "Cancel Request",
    className: "bg-gray-600 hover:bg-gray-700 text-white",
    icon: "—",
  },
};

const FacilityRequestStatusModal = ({
  isOpen,
  onClose,
  requestId,
  requesterName,
  facilityName,
  onStatusUpdated,
}: FacilityRequestStatusModalProps) => {
  const [selectedAction, setSelectedAction] = useState<Action>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await changeFacilityRequestStatusApi(requestId, selectedAction);
      if (res.status) {
        toast.success("Status updated successfully!", { id: loadingToast });
        onStatusUpdated();
        onClose();
      } else {
        toast.error(res.message || "Failed to update status", { id: loadingToast });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status", { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const config = selectedAction ? actionConfig[selectedAction] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-[420px] overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-secondary">Update Request Status</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Request #</span>
              <span className="font-semibold text-gray-900">{requestId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Requester</span>
              <span className="font-semibold text-gray-900">{requesterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Facility</span>
              <span className="font-semibold text-gray-900">{facilityName}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 font-medium">Select an action:</p>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(actionConfig).map(([value, cfg]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedAction(value as Action)}
                disabled={isProcessing}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedAction === value
                    ? cfg.className.replace("hover:bg-", "bg-").split(" ").slice(0, 2).join(" ") + " border-transparent"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-xl font-bold">{cfg.icon}</span>
                <span className="text-xs font-bold">{cfg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
          {selectedAction && config && (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50 ${config.className}`}
            >
              {isProcessing ? "Processing..." : config.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityRequestStatusModal;
