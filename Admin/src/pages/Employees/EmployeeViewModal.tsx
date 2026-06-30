import { formatDate } from "../../utils/dateUtils";

interface EmployeeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { 
    id: string; 
    name: string; 
    email: string; 
    mobile?: string; 
    status: string; 
    role_name?: string; 
    createdAt: string 
  } | null;
}

const EmployeeViewModal = ({ isOpen, onClose, data }: EmployeeViewModalProps) => {

  if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-xl p-5 w-full max-w-[400px] max-h-[90vh] overflow-y-auto space-y-6">
        <h2 className="text-xl font-bold text-secondary">View Employee</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <p className="text-gray-900">{data.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{data.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <p className="text-gray-900">{data.mobile || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <p className="text-gray-900">{data.role_name || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900">{data.status === "Active" ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
            <p className="text-gray-900">{formatDate(data.createdAt)}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
                Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeViewModal;
