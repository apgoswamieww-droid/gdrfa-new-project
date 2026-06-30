import { apiRequest } from "./request";

export interface ParticipantUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  jobTitle?: string;
  department?: string;
  image?: string;
  dob?: string | null;
  age?: number | null;
  gender?: string | null;
  sector?: string | null;
  sectorAr?: string | null;
  departmentAr?: string | null;
  section?: string | null;
  sectionAr?: string | null;
  branch?: string | null;
  branchAr?: string | null;
  rank?: string | null;
  rankAr?: string | null;
}

export interface EventActivity {
  id: number;
  name: string;
  name_ar?: string;
  typeName?: string;
}

export interface EventPerson {
  id: string;
  name: string;
  email: string;
  mobile: string;
  image?: string;
}

export interface ParticipantEvent {
  id: number;
  name: string;
  nameAr?: string;
  image?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  numberOfHour?: number;
  status?: string;
  eventActiveStatus?: string;
  eventDescription?: string;
  activities?: EventActivity[];
  eventCoordinators?: EventPerson[];
  eventAdmins?: EventPerson[];
  selectedEmployees?: EventPerson[];
}

export interface ParticipantTeam {
  id: number;
  name: string;
}

export interface Participant {
  id: number;
  user: ParticipantUser;
  event: ParticipantEvent;
  manager?: ParticipantUser;
  coordinator?: ParticipantUser;
  sportActivity?: {
    id: number;
    name: string;
  };
  team?: ParticipantTeam | null;
  activityType?: string;
  status: string;
  currentApprovalLevel?: string | null;
  workflowStatus?: string | null;
  createdAt: string;
}

export const getParticipantsApi = async (params?: {
  draw?: number;
  start?: number;
  length?: number;
  search?: string;
  status?: string;
  event_id?: number | string;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }
  return apiRequest({
    url: `/admin/participants?${queryParams.toString()}`,
    method: "GET",
  });
};

export const getParticipantByIdApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/participants/${id}`,
    method: "GET",
  });
};

export const updateParticipantStatusApi = async (id: number, status: string, comment?: string): Promise<any> => {
  return apiRequest({
    url: `/admin/participants/${id}/status`,
    method: "PUT",
    body: { status, comment },
  });
};

export const manualRegisterTeamApi = async (eventId: number, data: { team_ids: number[] }): Promise<any> => {
  return apiRequest({
    url: `/admin/events/${eventId}/manual-register-team`,
    method: "POST",
    body: data,
  });
};

export const manualRegisterApi = async (eventId: number, data: { user_ids: string[]; activity_id?: number; coordinator_id?: string }): Promise<any> => {
  return apiRequest({
    url: `/admin/events/${eventId}/manual-register`,
    method: "POST",
    body: data,
  });
};

export const deleteParticipantApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/participants/${id}`,
    method: "DELETE",
  });
};

export const deleteParticipantTeamApi = async (teamId: number, eventId: number): Promise<any> => {
  return apiRequest({
    url: `/admin/participants/team/${teamId}?event_id=${eventId}`,
    method: "DELETE",
  });
};
