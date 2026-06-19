import { apiRequest } from "./request";

export interface Team {
  id: number;
  name: string;
  activity: string;
  numberOfMembers: number;
  staffMembers: string | null;
  image: string | null;
  status: string;
  createdAt: string;
  hasPlayers: boolean;
  captain: { id: string; name: string } | null;
  teamManager: string;
}

export interface TeamListResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Team[];
}

export const getTeamsApi = async (params: {
  draw?: number;
  start?: number;
  length?: number;
  search?: string;
}): Promise<any> => {
  const query = new URLSearchParams();
  if (params.draw) query.append("draw", params.draw.toString());
  if (params.start) query.append("start", params.start.toString());
  if (params.length) query.append("length", params.length.toString());
  if (params.search) query.append("search", params.search);

  return apiRequest({
    url: `/admin/teams?${query.toString()}`,
    method: "GET",
  });
};

export const getTeamByIdApi = async (teamId: number): Promise<any> => {
  return apiRequest({
    url: `/admin/teams/${teamId}`,
    method: "GET",
  });
};

export const getTeamMembersApi = async (teamId: number): Promise<any> => {
  return apiRequest({
    url: `/admin/team/members/${teamId}`,
    method: "GET",
  });
};

export const updateTeamMembersApi = async (data: { team_id: number; players: string[]; captain?: string }): Promise<any> => {
  return apiRequest({
    url: "/admin/team/add-member/store",
    method: "POST",
    body: data,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const createTeamApi = async (formData: FormData): Promise<any> => {
  return apiRequest({
    url: "/admin/teams",
    method: "POST",
    body: formData,
  });
};

export const updateTeamApi = async (id: number, formData: FormData): Promise<any> => {
  return apiRequest({
    url: `/admin/teams/${id}`,
    method: "PUT",
    body: formData,
  });
};

// Correction: I put router.put in apiRoutes.js. 
// But if I'm using FormData with file, some environments prefer POST.
// Let's stick to what I defined in apiRoutes.

export const deleteTeamApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/teams/${id}`,
    method: "DELETE",
  });
};

export const changeTeamStatusApi = async (id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/change-status?model=Team&id=${id}&status=${status}`,
    method: "GET",
  });
};

export const getActivitiesApi = async (): Promise<any> => {
  return apiRequest({
    url: "/admin/teams/activities",
    method: "GET",
  });
};

export const getTeamEventsApi = async (teamId: number): Promise<any> => {
  return apiRequest({
    url: `/admin/teams/${teamId}/events`,
    method: "GET",
  });
};

export const getStaffApi = async (): Promise<any> => {
  return apiRequest({
    url: "/admin/teams/staff",
    method: "GET",
  });
};
