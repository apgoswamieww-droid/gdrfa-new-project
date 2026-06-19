import { apiRequest } from "./request";

export type LoginPayload = {
  username: string;
  password: string;
};

export const loginApi = (body: LoginPayload) => {
  return apiRequest({
    url: "/login",
    method: "POST",
    body,
  });
};

export const forgotPasswordApi = (body: { email: string }) => {
  return apiRequest({
    url: "/forgot-password",
    method: "POST",
    body,
  });
};
