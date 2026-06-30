import { apiRequest } from "./request";

export interface FacilityRequest {
  id: number;
  facility_id: number;
  name: string;
  email: string;
  date: string;
  status: string;
  createdAt: string;
  title?: string;
  image?: string;
}

export const getFacilityRequestsApi = async (params: {
  start?: number;
  length?: number;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.start !== undefined) queryParams.append('start', String(params.start));
  if (params.length !== undefined) queryParams.append('length', String(params.length));
  queryParams.append('draw', '1');
  if (params.search) queryParams.append('search', params.search);

  return apiRequest({
    url: `/api/facility-requests?${queryParams.toString()}`,
    method: "GET",
  });
};

export const changeFacilityRequestStatusApi = async (id: number, status: string) => {
  return apiRequest({
    url: `/admin/facility-request/change-status?model=FacilityRequest&id=${id}&status=${status}`,
    method: "GET",
  });
};

export const deleteFacilityRequestApi = async (id: number) => {
  const response: any = await apiRequest({
    url: `/admin/delete/FacilityRequest/${id}`,
    method: "POST",
  });

  return response;
};
