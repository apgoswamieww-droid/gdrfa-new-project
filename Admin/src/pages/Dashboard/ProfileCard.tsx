import { UserImg } from "../../assets/images/images";
import { Heading, Text } from "../../component/Typography/Typography";
import { useTranslation } from "../../hooks/useTranslation";
import { useMemo } from "react";

const ProfileCard = () => {
  const { t } = useTranslation();
  const adminUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("adminUser");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, []);

  const userName = adminUser?.name || "Admin";
  const userImage = adminUser?.image || UserImg;
  return (
    <div className="bg-white 2xl:rounded-lg rounded-xl xl:border-4 border-2 border-[#E7D2D2]/60">
      <div className="rounded-xl xl:p-3.5 p-3">
        <div className="flex items-center justify-between md:mb-4 mb-2">
          <Text variant="textLg" className="font-bold text-primary !text-base">{t.dashboard?.myProfile || "My Profile"}</Text>
          <button className="cursor-pointer">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z"
                stroke="#0A2240"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.25 12H12M12.5 12C12.5 12.2761 12.2761 12.5 12 12.5C11.7239 12.5 11.5 12.2761 11.5 12C11.5 11.7239 11.7239 11.5 12 11.5C12.2761 11.5 12.5 11.7239 12.5 12Z"
                stroke="#0A2240"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.25 12H17M17.5 12C17.5 12.2761 17.2761 12.5 17 12.5C16.7239 12.5 16.5 12.2761 16.5 12C16.5 11.7239 16.7239 11.5 17 11.5C17.2761 11.5 17.5 11.7239 17.5 12Z"
                stroke="#0A2240"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.25 12H7M7.5 12C7.5 12.2761 7.27614 12.5 7 12.5C6.72386 12.5 6.5 12.2761 6.5 12C6.5 11.7239 6.72386 11.5 7 11.5C7.27614 11.5 7.5 11.7239 7.5 12Z"
                stroke="#0A2240"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={userImage}
              alt="Profile"
              className="2xl:w-18 w-15 2xl:h-18 h-15 2xl:p-1 p-0.5 rounded-full object-cover border-2 border-primary"
            />
          </div>
          <Heading variant="h3" className="mt-2 font-bold text-secondary !text-base">
            {userName}
          </Heading>
          <Text variant="textBase" className="font-medium text-primary mt-0 !text-xs">
            {t.dashboard?.userRoleDetail || "User Role Detail"}
          </Text>
        </div>
      </div>
    </div>
  );
};
export default ProfileCard;
