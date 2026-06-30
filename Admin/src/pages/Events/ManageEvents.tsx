import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import EventsTable from "./EventsTable";
import { useTranslation } from "../../hooks/useTranslation";
import SearchInput from "../../component/Input/SearchInput";

const ManageEvents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="2xl:space-y-8 md:space-y-6 space-y-4 h-full flex flex-col">
      <div className="flex sm:flex-row flex-col gap-3 justify-between md:mb-7 mb-5">
        <SearchInput
          placeholder={t.events?.searchPlaceholder || "Search for Events..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <PrimaryBtn
          className="w-fit"
          onClick={() => navigate("/events/create")}
        >
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
          {t.events?.createEvent || "Create Event"}
        </PrimaryBtn>
      </div>
      <EventsTable
        key={refreshKey}
        searchTerm={searchTerm}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};

export default ManageEvents;
