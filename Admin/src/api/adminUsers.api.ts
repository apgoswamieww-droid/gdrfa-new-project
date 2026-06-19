import { apiRequest } from "./request";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  status: string;
  role_name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleOption {
  id: number;
  name: string;
}

export const getAdminUsersApi = () => {
  return apiRequest({ url: "/admin/manage-admins" }).then((res) => res.data?.data || []);
};

export const createAdminUserApi = (data: { name: string; email: string; mobile?: string; roleId?: number; status?: string }) => {
  return apiRequest({ url: "/admin/manage-admins", method: "POST", body: data }).then((res) => res.data);
};

export const updateAdminUserApi = (id: number, data: { name?: string; email?: string; mobile?: string; roleId?: number; status?: string }) => {
  return apiRequest({ url: `/admin/manage-admins/${id}`, method: "PUT", body: data }).then((res) => res.data);
};

export const deleteAdminUserApi = (id: number) => {
  return apiRequest({ url: `/admin/manage-admins/${id}`, method: "DELETE" }).then((res) => res.data);
};

export const getRolesForSelectApi = () => {
  return apiRequest({ url: "/admin/roles" }).then((res) => res.data || []);
};

export const changeAdminUserStatusApi = (id: number, status: string) => {
  return apiRequest({ url: `/admin/manage-admins/${id}`, method: "PUT", body: { status } });
};
