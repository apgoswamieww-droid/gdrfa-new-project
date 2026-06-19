import { apiRequest } from "./request";

export async function getApprovalHistoryApi(params?: {
  page?: number;
  limit?: number;
  participate_id?: number;
  event_id?: number;
  status?: string;
}) {
  return apiRequest({
    url: "/api/admin/participants/approval-history",
    method: "GET",
    body: params,
  });
}
