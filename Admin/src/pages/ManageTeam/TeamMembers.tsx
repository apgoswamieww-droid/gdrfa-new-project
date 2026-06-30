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
  email: string;
  gender: string;
  age: number | null;
  mobile: string;
  jobTitle: string;
  department: string;
  status: string;
}

const TeamMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playerSearch, setPlayerSearch] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("");

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getTeamMembersApi(parseInt(id));
      console.log('API Response:', res);
      if (res.status) {
        setTeam(res.data.team);
        setAllPlayers(res.data.allPlayers || []);
        setSelectedPlayers(res.data.selectedPlayers || []);
        setCaptainId(res.data.captainId || null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const getAgeGroup = (age: number | null): string => {
    if (!age) return "Unknown";
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
          String(player.name).toLowerCase().includes(searchValue) ||
          String(player.email).toLowerCase().includes(searchValue) ||
          String(player.jobTitle).toLowerCase().includes(searchValue) ||
          String(player.department).toLowerCase().includes(searchValue);
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
          toast.error(`Team capacity of ${team?.numberOfMembers} players exceeded. Please remove a player before adding another.`, {
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
      toast.error(`Cannot save: Team capacity of ${team?.numberOfMembers} players exceeded.`, {
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
        toast.success(res.message || "Team members updated successfully");
        navigate("/teams");
      } else {
        toast.error(res.message || "Failed to update team members");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
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
      label: "userDomain ID",
      render: (value) => <span className="font-medium text-primary">{value}</span>,
      className: "text-center w-32"
    },
    {
      key: "name",
      label: t.team.employeeInfo || "Employee Information",
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.jobTitle}</div>
          <div className="text-sm text-gray-500">{row.department}</div>
        </div>
      ),
      className: "min-w-[200px]"
    },
    {
      key: "email",
      label: t.team.contactDetails || "Contact Details",
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
      label: "Gender",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Male' ? 'bg-blue-100 text-blue-800' :
          value === 'Female' ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
      className: "text-center w-20"
    },
    {
      key: "age",
      label: "Age Group",
      render: (_, row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {getAgeGroup(row.age)}
        </span>
      ),
      className: "text-center w-24"
    },
    {
      key: "status",
      label: t.team.status || "Status",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
      className: "text-center w-20"
    }
  ];

  if (loading) return <div className="p-4">Loading...</div>;

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
        <img src={imageUrl} alt={team?.name} className="w-24 h-24 rounded-lg object-cover" />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">Team Name</p>
            <p className="font-bold text-base">{team?.name}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">Activity</p>
            <p className="font-medium">{team?.activityNames || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-xs font-bold mb-1">Staff In Charge</p>
            <div className="text-sm font-medium text-gray-700">
              {team?.staffNames?.map((s: any, i: number) => (
                <div key={i}>{s.nameEn || s.nameAr}</div>
              )) || '-'}
            </div>
          </div>
        </div>
        <div className="text-center p-4 bg-primary/5 rounded-lg min-w-[120px]">
          <p className="text-xl font-bold text-primary">{selectedPlayers.length} / {team?.numberOfMembers}</p>
          <p className="text-xs text-gray-500 uppercase font-bold">Capacity</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search by name, email, job title..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Ages</option>
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
                Clear Filters
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
            No players found. Try changing the search or filters.
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <PrimaryBtn onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Team Members"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
