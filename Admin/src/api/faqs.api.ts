import { apiRequest } from "./request";

export interface Faq {
  id: number;
  question: string;
  question_ar: string;
  answer: string;
  answer_ar: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getFaqsApi = async (params?: {
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
    url: `/admin/faqs?${queryParams.toString()}`,
    method: "GET",
  });
};

export const createFaqApi = async (data: any): Promise<any> => {
  return apiRequest({
    url: "/admin/faqs",
    method: "POST",
    body: data,
  });
};

export const updateFaqApi = async (id: number, data: any): Promise<any> => {
  return apiRequest({
    url: `/admin/faqs/${id}`,
    method: "PUT",
    body: data,
  });
};

export const deleteFaqApi = async (id: number): Promise<any> => {
  return apiRequest({
    url: `/admin/faqs/${id}`,
    method: "DELETE",
  });
};

export const toggleFaqStatusApi = async (id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/faqs/${id}/status`,
    method: "PUT",
    body: { status },
  });
};
