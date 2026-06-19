import { formatDate } from "../../utils/dateUtils";

interface FacilityRequestViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: number;
    facility_id: number;
    name: string;
    email: string;
    date: string;
    description?: string;
    status: string;
    createdAt: string;
    title?: string;
    image?: string;
  } | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "1":
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Approved</span>;
    case "2":
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rejected</span>;
    case "3":
      return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Cancelled</span>;
    default:
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>;
  }
};

const FacilityRequestViewModal = ({ isOpen, onClose, request }: FacilityRequestViewModalProps) => {
  if (!isOpen || !request) return null;

  const imageUrl = request.image
    ? `${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${request.image}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-secondary">Facility Request Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-8">
          <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt={request.title || ""} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {request.title?.charAt(0).toUpperCase() || "F"}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{request.title || "Unknown Facility"}</h3>
              <p className="text-gray-500 text-sm">Facility #{request.facility_id}</p>
              <div className="mt-2">
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requester Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-semibold">{request.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{request.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Request Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Date</label>
                  <p className="text-gray-900 font-semibold">{request.date ? formatDate(request.date, false) : "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted At</label>
                  <p className="text-gray-900">{request.createdAt ? formatDate(request.createdAt, true) : "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {request.description && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityRequestViewModal;
