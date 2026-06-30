import { useState, useEffect } from "react";
import AdminUsersTable from "./AdminUsersTable";
import AdminUserModal from "./AdminUserModal";
import { getRolesForSelectApi, createAdminUserApi, updateAdminUserApi } from "../../api/adminUsers.api";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateUtils";
import SearchInput from "../../component/Input/SearchInput";

const ManageAdminUsers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editData, setEditData] = useState<{ id: number; name: string; email: string; mobile?: string; roleId?: number } | null>(null);
  const [viewData, setViewData] = useState<{ id: string; name: string; email: string; mobile?: string; role_name?: string; status: string; createdAt: string } | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch Roles for dropdown
  useEffect(() => {
    getRolesForSelectApi()
      .then((roles) => {
        if (roles) setRoleOptions(roles as Array<{ id: number; name: string }>);
      })
      .catch((e) => console.warn("Roles fetch error:", e));
  }, []);

  const handleSubmit = async (data: { name: string; email: string; mobile?: string; roleId?: number }, id?: number) => {
    const loadingToast = toast.loading(
      id ? "Updating..." : "Creating..."
    );
    try {
      if (id) {
        await updateAdminUserApi(id, data);
        toast.success("Admin updated successfully!", { id: loadingToast });
      } else {
        await createAdminUserApi(data);
        toast.success("Admin created successfully!", { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditData(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEdit = (data: { id: number; name: string; email: string; mobile?: string; roleId?: number }) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  const handleView = (data: any) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          <SearchInput
            placeholder="Search for Admins.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center gap-3">
            
          </div>
              
        </div>

        <AdminUsersTable
          key={refreshKey}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>

      {isModalOpen && (
        <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditData(null);
          }}
          onSubmit={handleSubmit}
          initialData={editData}
          title={editData ? "Edit Admin" : "Create Admin"}
          roleOptions={roleOptions}
        />
      )}

      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-md space-y-6">
            <h2 className="text-xl font-bold text-secondary">View Admin</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{viewData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{viewData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <p className="text-gray-900">{viewData.mobile || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900">{viewData.role_name || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-gray-900">{viewData.status === "1" || viewData.status === "Active" ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{viewData.createdAt ? formatDate(viewData.createdAt) : "-"}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageAdminUsers;
