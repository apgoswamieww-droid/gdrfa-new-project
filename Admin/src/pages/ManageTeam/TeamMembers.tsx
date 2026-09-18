import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getTeamMembersApi, updateTeamMembersApi } from "../../api/teams.api";
import { useTranslation } from "../../hooks/useTranslation";
import PrimaryBtn from "../../component/Button/PrimaryButton";
import DataTable from "../../component/Table/DataTable";
import type { Column } from "../../component/Table/DataTable";

interface Player {
  id: string;
  name: string;
  nameAr?: string;
  name_ar?: string;
  email: string;
  gender: string;
  age: number | null;
  mobile: string;
  jobTitle: string;
  jobTitleAr?: string;
  department: string;
  departmentAr?: string;
  status: string;
}

const TeamMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playerSearch, setPlayerSearch] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("");

  const localizedValue = (
    englishValue?: string | null,
    arabicValue?: string | null,
    fallback = "-",
  ) => {
    const value = isArabic ? arabicValue || englishValue : englishValue || arabicValue;
    return value || fallback;
  };

  const fallbackText = (english: string, arabic: string) => (isArabic ? arabic : english);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getTeamMembersApi(parseInt(id));
      // console.log('API Response:', res);
      if (res.status) {
        setTeam(res.data.team);
        setAllPlayers(res.data.allPlayers || []);
        setSelectedPlayers(res.data.selectedPlayers || []);
        setCaptainId(res.data.captainId || null);
      }
    } catch (error: any) {
      toast.error(isArabic ? "تعذر تحميل بيانات أعضاء الفريق" : error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const getAgeGroup = (age: number | null): string => {
    if (!age) return fallbackText("Unknown", "غير معروف");
    if (age >= 18 && age <= 25) return "18-25";
    if (age >= 26 && age <= 30) return "26-30";
    if (age >= 31 && age <= 35) return "31-35";
    if (age >= 36 && age <= 40) return "36-40";
    if (age >= 41) return "41+";
    return "Unknown";
  };

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      // Search filter
      if (playerSearch.trim()) {
        const searchValue = playerSearch.toLowerCase();
        const matchesSearch =
          String(localizedValue(player.name, player.nameAr || player.name_ar)).toLowerCase().includes(searchValue) ||
          String(player.email).toLowerCase().includes(searchValue) ||
          String(player.mobile || "").toLowerCase().includes(searchValue) ||
          String(player.id || "").toLowerCase().includes(searchValue) ||
          String(localizedValue(player.jobTitle, player.jobTitleAr)).toLowerCase().includes(searchValue) ||
          String(localizedValue(player.department, player.departmentAr)).toLowerCase().includes(searchValue);
        if (!matchesSearch) return false;
      }

      // Gender filter
      if (genderFilter && player.gender.toLowerCase() !== genderFilter.toLowerCase()) {
        return false;
      }

      // Age group filter
      if (ageGroupFilter) {
        const playerAgeGroup = getAgeGroup(player.age);
        if (playerAgeGroup !== ageGroupFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allPlayers, playerSearch, genderFilter, ageGroupFilter]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.includes(playerId);
      if (isSelected) {
        // Deselecting
        return prev.filter(id => id !== playerId);
      } else {
        // Selecting - check capacity
        if (prev.length >= (team?.numberOfMembers || 0)) {
          toast.error(isArabic
            ? `تم تجاوز سعة الفريق البالغة ${team?.numberOfMembers} لاعبين. يرجى إزالة لاعب قبل إضافة لاعب آخر.`
            : `Team capacity of ${team?.numberOfMembers} players exceeded. Please remove a player before adding another.`, {
            id: 'capacity-exceeded'
          });
          return prev;
        }
        return [...prev, playerId];
      }
    });
  };

  const handleCaptainChange = (playerId: string) => {
    setCaptainId(playerId);
  };

  const handleSave = async () => {
    if (!id) return;
    if (selectedPlayers.length > (team?.numberOfMembers || 0)) {
      toast.error(isArabic
        ? `تعذر الحفظ: تم تجاوز سعة الفريق البالغة ${team?.numberOfMembers} لاعبين.`
        : `Cannot save: Team capacity of ${team?.numberOfMembers} players exceeded.`, {
        id: 'capacity-exceeded'
      });
      return;
    }
    setSaving(true);
    try {
      const res = await updateTeamMembersApi({
        team_id: parseInt(id),
        players: selectedPlayers,
        captain: captainId || undefined
      });
      if (res.status) {
        toast.success(isArabic ? "تم تحديث أعضاء الفريق بنجاح" : res.message || "Team members updated successfully");
        navigate("/teams");
      } else {
        toast.error(isArabic ? "فشل تحديث أعضاء الفريق" : res.message || "Failed to update team members");
      }
    } catch (error: any) {
      toast.error(isArabic ? "حدث خطأ ما" : error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Player>[] = [
    {
      key: "id",
      label: t.team.select || "Select",
      render: (_, row) => (
        <input
          type="checkbox"
          className="w-5 h-5 rounded border-gray-300 focus:ring-primary focus:border-primary"
          checked={selectedPlayers.includes(row.id)}
          onChange={() => togglePlayer(row.id)}
        />
      ),
      className: "text-center w-16"
    },
    {
      key: "id",
      label: t.team.captain || "Captain",
      render: (_, row) => (
        <input
          type="radio"
          name="captain"
          className="w-5 h-5 border-gray-300 focus:ring-primary focus:border-primary"
          checked={captainId === row.id}
          onChange={() => handleCaptainChange(row.id)}
          disabled={!selectedPlayers.includes(row.id)}
        />
      ),
      className: "text-center w-16"
    },
    {
      key: "id",
      label: t.team.userDomainId || fallbackText("User Domain ID", "معرف نطاق المستخدم"),
      render: (value) => <span className="font-medium text-primary">{value}</span>,
      className: "text-center w-32"
    },
    {
      key: "name",
      label: t.team.employeeInfo || fallbackText("Employee Information", "معلومات الموظف"),
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{localizedValue(row.name, row.nameAr || row.name_ar)}</div>
          <div className="text-sm text-gray-500">{localizedValue(row.jobTitle, row.jobTitleAr)}</div>
          <div className="text-sm text-gray-500">{localizedValue(row.department, row.departmentAr)}</div>
        </div>
      ),
      className: "min-w-[200px]"
    },
    {
      key: "email",
      label: t.team.contactDetails || fallbackText("Contact Details", "تفاصيل الاتصال"),
      render: (_, row) => (
        <div>
          <div className="text-sm">{row.email}</div>
          <div className="text-sm text-gray-500">{row.mobile}</div>
        </div>
      ),
      className: "min-w-[200px]"
    },
    {
      key: "gender",
      label: t.team.gender || fallbackText("Gender", "الجنس"),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Male' || value === 'ذكر' ? 'bg-blue-100 text-blue-800' :
          value === 'Female' || value === 'أنثى' ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === "Male" ? fallbackText("Male", "ذكر") : value === "Female" ? fallbackText("Female", "أنثى") : value}
        </span>
      ),
      className: "text-center w-20"
    },
    {
      key: "age",
      label: t.team.ageGroup || fallbackText("Age Group", "الفئة العمرية"),
      render: (_, row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {getAgeGroup(row.age)}
        </span>
      ),
      className: "text-center w-24"
    },
    {
      key: "status",
      label: t.team.status || fallbackText("Status", "الحالة"),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' || value === '1' || value === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === "Active" || value === "1" || value === 1
            ? t.team.active || fallbackText("Active", "فعّال")
            : t.team.inactive || fallbackText("Inactive", "غير فعّال")}
        </span>
      ),
      className: "text-center w-20"
    }
  ];

  if (loading) return <div className="p-4">{fallbackText("Loading...", "جاري التحميل...")}</div>;

  const imageUrl = team?.image ? `${import.meta.env.VITE_IMAGE_BASE_URL || "https://localhost:3000/"}${team.image}` : undefined;

  return (
    <div className="p-4 2xl:space-y-8 space-y-6">
   <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-secondary">{t.team.backToList}</h2>
      </div>

          
      <div className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4">
        <img src={imageUrl} alt={localizedValue(team?.name, team?.name_ar || team?.nameAr)} className="w-24 h-24 rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">{t.team.teamName || fallbackText("Team Name", "اسم الفريق")}</p>
            <p className="font-bold text-base">{localizedValue(team?.name, team?.name_ar || team?.nameAr)}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">{t.team.activity || fallbackText("Activity", "النشاط")}</p>
            <p className="font-medium">{localizedValue(team?.activityNames || team?.activity, team?.activityNamesAr || team?.activity_ar || team?.activityAr)}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">{t.team.staffInCharge || fallbackText("Staff In Charge", "المسؤول عن الفريق")}</p>
            <div className="text-sm font-medium text-gray-700">
              {team?.staffNames?.map((s: any, i: number) => (
                <div key={i}>{localizedValue(s.nameEn, s.nameAr)}</div>
              )) || '-'}
            </div>
          </div>
        </div>
        <div className="text-center p-4 bg-primary/5 rounded-lg min-w-[120px]">
          <p className="text-xl font-bold text-primary">{selectedPlayers.length} / {team?.numberOfMembers}</p>
          <p className="text-xs text-gray-500 uppercase font-bold">{t.team.capacity || fallbackText("Capacity", "السعة")}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.team.searchMembers || fallbackText("Search", "بحث")}</label>
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder={t.team.searchMembersPlaceholder || fallbackText("Search by name, email, job title...", "البحث بالاسم أو البريد الإلكتروني أو المسمى الوظيفي...")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.team.gender || fallbackText("Gender", "الجنس")}</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t.team.allGenders || fallbackText("All Genders", "جميع الأجناس")}</option>
                <option value="male">{fallbackText("Male", "ذكر")}</option>
                <option value="female">{fallbackText("Female", "أنثى")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.team.ageGroup || fallbackText("Age Group", "الفئة العمرية")}</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t.team.allAges || fallbackText("All Ages", "جميع الأعمار")}</option>
                <option value="18-25">18 - 25</option>
                <option value="26-30">26 - 30</option>
                <option value="31-35">31 - 35</option>
                <option value="36-40">36 - 40</option>
                <option value="41+">41+</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPlayerSearch("");
                  setGenderFilter("");
                  setAgeGroupFilter("");
                }}
                className="w-full px-4 py-2 rounded-lg text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t.team.clearFilters || fallbackText("Clear Filters", "مسح عوامل التصفية")}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden">
          <DataTable
            data={filteredPlayers}
            columns={columns}
            className="min-h-[400px]"
            keyExtractor={(row) => row.id}
          />
        </div>

        {filteredPlayers.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            {t.team.noPlayersFound || fallbackText("No players found. Try changing the search or filters.", "لم يتم العثور على لاعبين. حاول تغيير البحث أو عوامل التصفية.")}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <PrimaryBtn onClick={handleSave} disabled={saving}>
            {saving
              ? t.team.savingMembers || fallbackText("Saving...", "جاري الحفظ...")
              : t.team.saveMembers || fallbackText("Save Team Members", "حفظ أعضاء الفريق")}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
