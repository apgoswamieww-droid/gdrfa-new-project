import { useState } from "react";
import { SportsActivityImg } from "../../assets/images/images";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import KpiTable from "./KpiTable";
import KpiModal from "./KpiModal";
import { createKpiApi } from "../../api/kpi.api";
import toast from "react-hot-toast";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageKpi = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateKpi = async (data: { name: string }) => {
    const loadingToast = toast.loading(t.kpi.creating);
    try {
      await createKpiApi(data);
      toast.success(t.kpi.successCreate, { id: loadingToast });
      setIsModalOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to create KPI:", error);
      toast.error(error.message || t.kpi.errorFetch, { id: loadingToast });
    }
  };

  return (
    <>
      <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
        <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
          {/* Search */}
          <SearchInput
            placeholder={t.kpi.search}
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
            {t.kpi.create}
          </PrimaryBtn>
        </div>
        <KpiTable key={refreshKey} searchTerm={searchTerm} />
      </div>
      <div
        className="absolute bottom-0 -z-10 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-full max-w-[70%] mx-auto h-114.25 bg-bottom bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${SportsActivityImg})` }}
      ></div>

      <KpiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateKpi}
        title={t.kpi.create}
      />
    </>
  );
};
export default ManageKpi;
