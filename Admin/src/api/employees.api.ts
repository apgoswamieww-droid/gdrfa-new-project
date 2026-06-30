import { apiRequest } from "./request";

export interface Employee {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  status: string;
  role_name?: string;
  createdAt: string;
}

export interface EmployeeWithDetails {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  mobile: string;
  grp: string;
  sector: string;
  sectorAr: string;
  department: string;
  departmentAr: string;
  section: string;
  sectionAr: string;
  branch: string;
  branchAr: string;
  gender: string;
  age: string;
  rank: string;
  jobTitle: string;
  workSystem: string;
  staffType: string;
  staffTypeAr: string;
  peopleOfDetermination: string;
  status: string;
}

export interface EmployeeFilterOptions {
  sectors: string[];
  departments: string[];
  sections: string[];
  branches: string[];
  ranks: string[];
  jobTitles: string[];
  genders: string[];
  workSystems: string[];
  staffTypes: string[];
}

export interface EmployeesWithFiltersResponse {
  employees: EmployeeWithDetails[];
  filterOptions: EmployeeFilterOptions;
  total: number;
}

export const getEmployeesApi = () => {
  return apiRequest({ url: "/admin/employees" }).then((res) => ({ data: res.data?.data || [], total: res.data?.total || 0 }));
};

export const getEmployeesWithFiltersApi = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiRequest({
    url: `/admin/employees/with-filters${query}`,
    method: "GET",
  });
};

export const changeEmployeeStatusApi = (id: string, status: string) => {
  return apiRequest({ url: `/admin/employees/${id}`, method: "PUT", body: { status } });
};
