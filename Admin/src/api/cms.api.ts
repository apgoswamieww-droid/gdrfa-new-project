import { apiRequest } from "./request";

export interface CmsPage {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getCmsPagesApi = async (params?: {
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
    url: `/admin/cms-pages?${queryParams.toString()}`,
    method: "GET",
  });
};

export const getCmsPageByIdApi = async (id: string | number): Promise<any> => {
  return apiRequest({
    url: `/admin/cms-pages/${id}`,
    method: "GET",
  });
};

export const createCmsPageApi = async (data: any): Promise<any> => {
  return apiRequest({
    url: "/admin/cms-pages",
    method: "POST",
    body: data,
  });
};

export const updateCmsPageApi = async (id: number, data: any): Promise<any> => {
  return apiRequest({
    url: `/admin/cms-pages/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteCmsPageApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/cms-pages/${id}`,
    method: "DELETE",
  });
};

export const toggleCmsPageStatusApi = async (id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/cms-pages/${id}/status`,
    method: "PUT",
    body: { status },
  });
};
