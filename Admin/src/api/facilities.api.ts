import { apiRequest } from "./request";

export interface Facility {
  id: number;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  image: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getFacilitiesApi = async (params?: {
  start?: number;
  length?: number;
  search?: string;
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
    url: `/admin/facilities?${queryParams.toString()}`,
    method: "GET",
  });
};

export const createFacilityApi = async (formData: FormData): Promise<any> => {
  return apiRequest({
    url: "/admin/facilities",
    method: "POST",
    body: formData,
  });
};

export const updateFacilityApi = async (id: number, formData: FormData): Promise<any> => {
  return apiRequest({
    url: `/admin/facilities/${id}`,
    method: "PUT",
    body: formData,
  });
};

export const deleteFacilityApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/facilities/${id}`,
    method: "DELETE",
  });
};
