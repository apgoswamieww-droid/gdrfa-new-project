import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heading, Text } from "../../component/Typography/Typography";
import { UserImg } from "../../assets/images/images";
import toast from "react-hot-toast";
import { apiRequest } from "../../api/request";

type ProfileData = {
  name: string;
  role: string;
  image?: string | null;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        
        const stored = localStorage.getItem("adminUser");
        let imageUrl: string | null = null;
        if (stored) {
          const parsed = JSON.parse(stored);
          imageUrl = parsed.image || null;
          setProfile({
            name: parsed.name,
            role: "Administrator",
            image: parsed.image,
          });
        }

        try {
          const imgRes: any = await apiRequest({ url: "/api/profile-image" });
          if (imgRes?.data?.image) {
            imageUrl = imgRes.data.image;
          }
        } catch {
          // fallback to existing image
        }

        if (!cancelled && imageUrl) {
          setProfile((prev) => prev ? { ...prev, image: imageUrl } : prev);
        }
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only image files (JPG, PNG, GIF, WebP) are allowed.");
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const resp: any = await apiRequest({
        url: "/api/upload-profile-image",
        method: "POST",
        body: formData,
      });

      if (resp?.status && resp?.data?.image) {
        const stored = localStorage.getItem("adminUser");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.image = resp.data.image;
          localStorage.setItem("adminUser", JSON.stringify(parsed));
        }
        setProfile((prev) => prev ? { ...prev, image: resp.data.image } : prev);
        toast.success("Profile image updated successfully.");
      } else {
        toast.error(resp?.message || "Failed to upload image.");
      }
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

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
                src={(() => {
                  const raw = profile?.image;
                  const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/";
                  return raw
                    ? raw.startsWith("http")
                      ? raw
                      : `${BASE_URL}${raw}`
                    : UserImg;
                })()}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" fill="#364B9B" stroke="white" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
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
