import { useState, useEffect, useMemo } from "react";

function secondsToMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return String(seconds ?? "");
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
import { SportsActivityImg } from "../../assets/images/images";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import SearchInput from "../../component/Input/SearchInput";
import DataTable from "../../component/Table/DataTable";
import type { Column } from "../../component/Table/DataTable";
import ScoreMatrixModal from "./ScoreMatrixModal";
import BulkImportModal from "./BulkImportModal";
import {
  getScoreMatrixApi,
  createScoreMatrixApi,
  updateScoreMatrixApi,
  deleteScoreMatrixApi,
  getFitnessCategoriesApi,
  getAgeGroupsApi,
} from "../../api/fitness.api";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateUtils";

const EditIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.17157 19.8284L19.8285 8.17157C20.3737 7.62632 20.6463 7.3537 20.7921 7.0596C21.0694 6.50005 21.0694 5.8431 20.7921 5.28354C20.6463 4.98945 20.3737 4.71682 19.8285 4.17157C19.2832 3.62632 19.0106 3.3537 18.7165 3.20796C18.1569 2.93068 17.5 2.93068 16.9404 3.20796C16.6463 3.3537 16.3737 3.62632 15.8285 4.17157L4.17157 15.8284C3.59351 16.4064 3.30448 16.6955 3.15224 17.063C3 17.4305 3 17.8393 3 18.6568V20.9999H5.34314C6.16065 20.9999 6.5694 20.9999 6.93694 20.8477C7.30448 20.6955 7.59351 20.4064 8.17157 19.8284Z" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21H18" stroke="#0A2240" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="2xl:w-6 w-4 2xl:h-6 h-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14.5 16.5V10.5" stroke="#7A2530" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ManageScoreMatrix = () => {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAgeGroup, setFilterAgeGroup] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterCategory) params.category_id = Number(filterCategory);
      if (filterGender) params.gender = filterGender;
      if (filterAgeGroup) params.age_group_id = Number(filterAgeGroup);

      const [matrixRes, catRes, ageRes] = await Promise.all([
        getScoreMatrixApi(params),
        getFitnessCategoriesApi({ length: 1000 }),
        getAgeGroupsApi({}),
      ]);

      if (matrixRes.status) setData(Array.isArray(matrixRes.data) ? matrixRes.data : (matrixRes.data.data || []));
      if (catRes.status) setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data.data || []));
      if (ageRes.status) setAgeGroups(Array.isArray(ageRes.data) ? ageRes.data : (ageRes.data.data || []));
    } catch (e) {
      console.warn("Score matrix fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey, searchTerm, filterCategory, filterGender, filterAgeGroup]);

  const catMap = useMemo(() => {
    const map: Record<number, string> = {};
    categories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const ageMap = useMemo(() => {
    const map: Record<number, string> = {};
    ageGroups.forEach(ag => { map[ag.id] = ag.group_name || `${ag.age_from} - ${ag.age_to}`; });
    return map;
  }, [ageGroups]);

  const columns: Column<any>[] = useMemo(() => [
    { key: "id", label: "ID", sortable: true, className: "text-center w-12 text-[#898B8E] font-medium", render: (value) => String(value ?? "") },
    {
      key: "category_id",
      label: "Category",
      sortable: true,
      className: "font-medium text-black",
      render: (value) => catMap[value as number] || `#${value}`,
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      className: "text-center",
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${value === "male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
          {value === "male" ? "Male" : "Female"}
        </span>
      ),
    },
    {
      key: "age_group_id",
      label: "Age Group",
      sortable: true,
      render: (value) => ageMap[value as number] || `#${value}`,
    },
    { key: "score", label: "Score", sortable: true, className: "text-center font-bold text-primary", render: (value) => String(value ?? "") },
    {
      key: "min_value",
      label: "Min",
      sortable: true,
      className: "text-center",
      render: (value, row) => {
        const raw = String(value ?? "");
        if (row?.unit_type === "time") {
          const num = parseFloat(raw);
          return isNaN(num) ? raw : secondsToMMSS(num);
        }
        return raw;
      },
    },
    {
      key: "max_value",
      label: "Max",
      sortable: true,
      className: "text-center",
      render: (value, row) => {
        const raw = String(value ?? "");
        if (row?.unit_type === "time") {
          const num = parseFloat(raw);
          return isNaN(num) ? raw : secondsToMMSS(num);
        }
        return raw;
      },
    },
    { key: "createdAt", label: "Created", sortable: true, className: "text-[#898B8E] whitespace-nowrap", render: (value) => formatDate(value as string) },
  ], [catMap, ageMap]);

  const handleCreateOrUpdate = async (data: any) => {
    const loadingToast = toast.loading(editingItem ? "Updating..." : "Creating...");
    try {
      if (editingItem) {
        await updateScoreMatrixApi(editingItem.id, data);
        toast.success("Score matrix entry updated!", { id: loadingToast });
      } else {
        await createScoreMatrixApi(data);
        toast.success("Score matrix entry created!", { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditingItem(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleDelete = async (id: number) => {
    toast((t_toast) => (
      <div className="flex flex-col gap-3 p-1 text-start">
        <p className="font-bold text-secondary text-base">Are you sure you want to delete this entry?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t_toast.id)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t_toast.id);
            const loadingToast = toast.loading("Deleting...");
            try {
              await deleteScoreMatrixApi(id);
              toast.success("Entry deleted!", { id: loadingToast });
              setRefreshKey((prev) => prev + 1);
            } catch (error: any) {
              toast.error(error.message || "Failed to delete", { id: loadingToast });
            }
          }} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">Delete</button>
        </div>
      </div>
    ), { duration: 6000, position: "top-center", style: { minWidth: '350px', borderRadius: '24px', padding: '16px' } });
  };

  const actions = (row: any) => (
    <div className="flex items-center gap-1.5">
      <button title="Edit" onClick={() => { setEditingItem(row); setIsModalOpen(true); }} className="min-w-8 w-8 h-8 flex items-center justify-center rounded-lg bg-light-blue/20 transition-colors cursor-pointer hover:bg-light-blue/10"><EditIcon /></button>
      <span className="text-primary text-base">|</span>
      <button title="Delete" onClick={() => handleDelete(row.id)} className="min-w-8 w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 transition-colors cursor-pointer hover:bg-primary/10"><DeleteIcon /></button>
    </div>
  );

  return (
    <>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex flex-col gap-3">
          <div className="flex sm:flex-row flex-col gap-3 justify-between">
            <SearchInput placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex gap-2">
              <PrimaryBtn className="w-fit !bg-white !text-primary !border !border-primary/30" onClick={() => setIsBulkOpen(true)}>
                Bulk Import
              </PrimaryBtn>
              <PrimaryBtn className="w-fit" onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.08203 9.99972C2.08203 6.26772 2.08203 4.40175 3.2414 3.24238C4.40077 2.08301 6.26675 2.08301 9.9987 2.08301C13.7306 2.08301 15.5966 2.08301 16.756 3.24238C17.9154 4.40175 17.9154 6.26772 17.9154 9.99972C17.9154 13.7316 17.9154 15.5976 16.756 16.757C15.5966 17.9164 13.7306 17.9164 9.9987 17.9164C6.26675 17.9164 4.40077 17.9164 3.2414 16.757C2.08203 15.5976 2.08203 13.7316 2.08203 9.99972Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.0013 6.66699V13.3337M13.3346 10.0004H6.66797" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Entry
              </PrimaryBtn>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Age Groups</option>
              {ageGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.group_name || `${ag.age_from} - ${ag.age_to}`}</option>)}
            </select>
          </div>
        </div>

        <DataTable data={data} columns={columns} actions={actions} perPageOptions={[5, 10, 20, 50]} className="flex-1" loading={loading} />
      </div>
      <div className="absolute bottom-0 -z-10 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-full max-w-[70%] mx-auto h-114.25 bg-bottom bg-no-repeat bg-contain" style={{ backgroundImage: `url(${SportsActivityImg})` }}></div>

      <ScoreMatrixModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(undefined); }} onSubmit={handleCreateOrUpdate} initialData={editingItem} title={editingItem ? "Edit Score Matrix Entry" : "Add Score Matrix Entry"} />
      <BulkImportModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onSuccess={() => setRefreshKey((prev) => prev + 1)} />
    </>
  );
};

export default ManageScoreMatrix;
