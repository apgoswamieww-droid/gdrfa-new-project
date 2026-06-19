import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heading, Text } from "../../component/Typography/Typography";
import { UserImg } from "../../assets/images/images";

type ProfileData = {
  name: string;
  role: string;
  image?: string | null;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        debugger
        const stored = localStorage.getItem("adminUser");
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile({
            name: parsed.name,
            role: "Administrator",
            image: parsed.image,
          });
        }

        // const res = await getDashboardProfileApi();
        // if (!cancelled && res?.data) {
        //   setProfile(res.data);
        // }
      } catch {
        if (!cancelled && !profile) {
          setProfile({ name: "Admin", role: "Administrator", image: null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4 text-secondary/60 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors w-fit"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="rtl:rotate-180">
          <path d="M12.5 16.6L6.25 10L12.5 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-semibold">Back to Dashboard</span>
      </Link>

      <div className="w-full bg-white 2xl:rounded-2xl rounded-xl p-4 2xl:p-5 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Heading variant="h2" className="font-bold text-secondary">
            My Profile
          </Heading>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative group">
            <div className="2xl:w-32 w-28 2xl:h-32 h-28 rounded-full border-[3px] border-primary overflow-hidden">
              <img
                src={profile?.image || UserImg}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary-light transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 1.99996L14 4.66663" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.99996 14.6667L13.3333 7.33333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.33325 14.6667L3.33325 14.2L5.99992 11.5333" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.3333 1.99996L14 4.66663L11.3333 1.99996Z" fill="white"/>
              </svg>
            </button>
          </div>
          <Heading variant="h3" className="mt-4 font-bold text-secondary">
            {profile?.name || "Admin"}
          </Heading>
          <Text variant="textBase" className="font-medium text-primary mt-0.5">
            {profile?.role || "Administrator"}
          </Text>
        </div>

        {/* Detail Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-5">
            <Heading variant="h4" className="font-bold text-secondary pb-2 border-b border-gray-100">
              Personal Information
            </Heading>
            <div>
              <Text variant="textSm" className="font-semibold text-secondary/50 mb-1">
                Full Name
              </Text>
              <Text variant="textBase" className="font-bold text-secondary">
                {profile?.name || "-"}
              </Text>
            </div>
            <div>
              <Text variant="textSm" className="font-semibold text-secondary/50 mb-1">
                Email Address
              </Text>
              <Text variant="textBase" className="font-bold text-secondary">
                {(() => {
                  const stored = localStorage.getItem("adminUser");
                  if (stored) {
                    try {
                      return JSON.parse(stored).email || "-";
                    } catch { return "-"; }
                  }
                  return "-";
                })()}
              </Text>
            </div>
            <div>
              <Text variant="textSm" className="font-semibold text-secondary/50 mb-1">
                Phone Number
              </Text>
              <Text variant="textBase" className="font-bold text-secondary">
                {(() => {
                  const stored = localStorage.getItem("adminUser");
                  if (stored) {
                    try {
                      const u = JSON.parse(stored);
                      return u.mobile || u.phone || "-";
                    } catch { return "-"; }
                  }
                  return "-";
                })()}
              </Text>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-5">
            <Heading variant="h4" className="font-bold text-secondary pb-2 border-b border-gray-100">
              Account Information
            </Heading>
            <div>
              <Text variant="textSm" className="font-semibold text-secondary/50 mb-1">
                Role
              </Text>
              <Text variant="textBase" className="font-bold text-secondary">
                {profile?.role || "Administrator"}
              </Text>
            </div>
            <div>
              <Text variant="textSm" className="font-semibold text-secondary/50 mb-1">
                Employee ID
              </Text>
              <Text variant="textBase" className="font-bold text-secondary">
                {(() => {
                  const stored = localStorage.getItem("adminUser");
                  if (stored) {
                    try {
                      return JSON.parse(stored).id || "-";
                    } catch { return "-"; }
                  }
                  return "-";
                })()}
              </Text>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-10 pt-6 border-t border-gray-100">
          <Link
            to="/dashboard"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-6 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
