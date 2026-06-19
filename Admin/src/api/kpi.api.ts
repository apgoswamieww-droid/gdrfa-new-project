import { apiRequest } from "./request";


export function getKpisApi(params?: { page?: number; perPage?: number; search?: string; sortBy?: string; sortDir?: "ASC" | "DESC" }) {
  return apiRequest({
    url: "/admin/manage-kpi",
    method: "GET",
    body: params,
  });
}

export function createKpiApi(body: any) {
  return apiRequest({
    url: "/admin/manage-kpi",
    method: "POST",
    body,
  });
}

export function updateKpiApi(id: number, body: any) {
  return apiRequest({
    url: `/admin/manage-kpi/${id}`,
    method: "PUT",
    body,
  });
}

export function deleteKpiApi(id: number) {
  return apiRequest({
    url: `/admin/manage-kpi/${id}`,
    method: "DELETE",
  });
}

export function changeKpiStatusApi(id: number, status: "1" | "0") {
  return apiRequest({
    url: `/admin/change-status?id=${id}&model=Kpi&status=${status}`,
    method: "GET",
  });
}
