import { useEffect, useState } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import toast from "react-hot-toast";

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; mobile?: string; roleId?: number; status?: string }, id?: number) => void;
  initialData?: { id: number; name: string; email: string; mobile?: string; roleId?: number } | null;
  title: string;
  roleOptions: { id: number; name: string }[];
}

const AdminUserModal = ({ isOpen, onClose, onSubmit, initialData, title, roleOptions }: AdminUserModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    roleId: 0,
    status: "1"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        mobile: initialData.mobile || "",
        roleId: initialData.roleId || 0,
        status: "1"
      });
    } else {
      setFormData({ name: "", email: "", mobile: "", roleId: 0, status: "1" });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData, initialData?.id);
    } finally {
      setSubmitting(false);
    }
  };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-xl p-5 w-full max-w-[400px] max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6">
        <h2 className="text-xl font-bold text-secondary">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile
            </label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={0}>Select Role</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <PrimaryBtn type="submit" disabled={submitting}>
              {submitting ? "Saving..." : (initialData ? "Update" : "Create")}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserModal;
