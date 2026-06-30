import { apiRequest } from "./request";

export function adminLoginApi(body: any) {
  return apiRequest({
    url: "/api/admin/login",
    method: "POST",
    body,
  });
}

export function adminLogoutApi() {
  return apiRequest({
    url: "/api/admin/logout",
    method: "POST",
  });
}
