import { useState, useEffect } from "react";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import PlansTable from "./PlansTable";
import PlanModal from "./PlanModal";
import { getKpisForSelectApi, createPlanApi, updatePlanApi } from "../../api/plans.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManagePlans = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editData, setEditData] = useState<{ id: number; year: string; kpi: number } | null>(null);
  const [kpiOptions, setKpiOptions] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch KPIs for dropdown
  useEffect(() => {
    getKpisForSelectApi()
      .then((kpis) => {
        if (kpis) setKpiOptions(kpis as Array<{ id: number; name: string }>);
      })
      .catch((e) => console.warn("KPI fetch error:", e));
  }, []);

  const handleSubmit = async (data: { year: string; kpi: number }, id?: number) => {
    const loadingToast = toast.loading(
      id ? (t.plan.updating || "Updating...") : (t.plan.creating || "Creating...")
    );
    try {
      if (id) {
        await updatePlanApi(id, data);
        toast.success(t.plan.successUpdate || "Plan updated successfully!", { id: loadingToast });
      } else {
        await createPlanApi(data);
        toast.success(t.plan.successCreate || "Plan created successfully!", { id: loadingToast });
      }
      setIsModalOpen(false);
      setEditData(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", { id: loadingToast });
    }
  };

  const handleEdit = (data: { id: number; year: string; kpi: number }) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          <SearchInput
            placeholder={t.plan.search || "Search for Plans..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <PrimaryBtn className="w-fit" onClick={() => setIsModalOpen(true)}>
             <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.08203 9.99972C2.08203 6.26772 2.08203 4.40175 3.2414 3.24238C4.40077 2.08301 6.26675 2.08301 9.9987 2.08301C13.7306 2.08301 15.5966 2.08301 16.756 3.24238C17.9154 4.40175 17.9154 6.26772 17.9154 9.99972C17.9154 13.7316 17.9154 15.5976 16.756 16.757C15.5966 17.9164 13.7306 17.9164 9.9987 17.9164C6.26675 17.9164 4.40077 17.9164 3.2414 16.757C2.08203 15.5976 2.08203 13.7316 2.08203 9.99972Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.0013 6.66699V13.3337M13.3346 10.0004H6.66797"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
             {t.plan.addPlan || "Add Plan"}
          </PrimaryBtn>
          
             
        </div>

        <PlansTable
          key={refreshKey}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
          kpiOptions={kpiOptions}
        />
      </div>

      {isModalOpen && (
        <PlanModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditData(null);
          }}
          onSubmit={handleSubmit}
          initialData={editData}
          title={editData ? (t.plan.edit || "Edit Plan") : (t.plan.create || "Create Plan")}
          kpiOptions={kpiOptions}
        />
      )}
    </>
  );
};

export default ManagePlans;
