import { apiRequest } from "./request";

export interface Plan {
  id: number;
  year: string;
  kpi: number;
  kpi_name?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiOption {
  id: number;
  name: string;
}

export interface PlansResponse {
  status: boolean;
  message: string;
  data: {
    data: Plan[];
    total: number;
  };
}

export const getPlansApi = () => {
  return apiRequest({ url: "/admin/plans" }).then((res) => res.data?.data || []);
};

export const createPlanApi = (data: { year: string; kpi: number; status?: string }) => {
  return apiRequest({ url: "/admin/plans", method: "POST", body: data }).then((res) => res.data);
};

export const updatePlanApi = (id: number, data: { year: string; kpi: number; status?: string }) => {
  return apiRequest({ url: `/admin/plans/${id}`, method: "PUT", body: data }).then((res) => res.data);
};

export const deletePlanApi = (id: number) => {
  return apiRequest({ url: `/admin/plans/${id}`, method: "DELETE" }).then((res) => res.data);
};

export const changePlanStatusApi = (id: number, status: string) => {
  return apiRequest({ url: `/admin/plans/${id}`, method: "PUT", body: { status } });
};

export const getKpisForSelectApi = () => {
  return apiRequest({ url: "/admin/plans/kpis" }).then((res) => res.data || []);
};
