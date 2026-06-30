import { useState, useCallback } from "react";
import FacilityRequestsTable from "./FacilityRequestsTable";
import FacilityRequestViewModal from "./FacilityRequestViewModal";
import FacilityRequestStatusModal from "./FacilityRequestStatusModal";
import SearchInput from "../../component/Input/SearchInput";
import type { FacilityRequest } from "../../api/facilityRequests.api";

const FacilityRequests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRequest, setViewRequest] = useState<FacilityRequest | null>(null);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    id: number;
    name: string;
    facilityName: string;
  }>({ open: false, id: 0, name: "", facilityName: "" });
  const [tableKey, setTableKey] = useState(0);

  const handleView = useCallback((row: FacilityRequest) => {
    setViewRequest(row);
  }, []);

  const handleStatusClick = useCallback((id: number, name: string, facilityName: string) => {
    setStatusModal({ open: true, id, name, facilityName });
  }, []);

  const handleStatusUpdated = useCallback(() => {
    setTableKey((k) => k + 1);
  }, []);

  return (
    <div className="p-4 2xl:space-y-8 space-y-6 flex flex-col h-full">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <SearchInput
          placeholder="Search by name, email, or facility..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 min-h-0">
        <FacilityRequestsTable
          key={tableKey}
          searchTerm={searchTerm}
          onView={handleView}
          onStatusClick={handleStatusClick}
        />
      </div>

      <FacilityRequestViewModal
        isOpen={!!viewRequest}
        onClose={() => setViewRequest(null)}
        request={viewRequest}
      />

      <FacilityRequestStatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((p) => ({ ...p, open: false }))}
        requestId={statusModal.id}
        requesterName={statusModal.name}
        facilityName={statusModal.facilityName}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default FacilityRequests;
