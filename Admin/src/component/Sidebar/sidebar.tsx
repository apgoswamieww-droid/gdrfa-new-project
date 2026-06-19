import { useLocation } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import { LogoImage, SidebarBg } from "../../assets/images/images";
import { Text } from "../Typography/Typography";
import { adminLogoutApi } from "../../api/auth.api";
import { hasAnyPermission, isAdminOrSuperAdmin, permissionsBypassEnabled } from "../../utils/permissions";
import { useTranslation } from "../../hooks/useTranslation";
import { useNavigationGuard } from "../../hooks/useNavigationGuard";

// ─── Icons ────────────────────────────────────────────────────────────
const icons: Record<string, ReactNode> = {
  dashboard: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.75 3H5.75C5.05222 3 4.70333 3 4.41943 3.08612C3.78023 3.28002 3.28002 3.78023 3.08612 4.41943C3 4.70333 3 5.05222 3 5.75C3 6.44778 3 6.79667 3.08612 7.08057C3.28002 7.71977 3.78023 8.21998 4.41943 8.41388C4.70333 8.5 5.05222 8.5 5.75 8.5H9.75C10.4478 8.5 10.7967 8.5 11.0806 8.41388C11.7198 8.21998 12.22 7.71977 12.4139 7.08057C12.5 6.79667 12.5 6.44778 12.5 5.75C12.5 5.05222 12.5 4.70333 12.4139 4.41943C12.22 3.78023 11.7198 3.28002 11.0806 3.08612C10.7967 3 10.4478 3 9.75 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M21 9.75V5.75C21 5.05222 21 4.70333 20.9139 4.41943C20.72 3.78023 20.2198 3.28002 19.5806 3.08612C19.2967 3 18.9478 3 18.25 3C17.5522 3 17.2033 3 16.9194 3.08612C16.2802 3.28002 15.78 3.78023 15.5861 4.41943C15.5 4.70333 15.5 5.05222 15.5 5.75V9.75C15.5 10.4478 15.5 10.7967 15.5861 11.0806C15.78 11.7198 16.2802 12.22 16.9194 12.4139C17.2033 12.5 17.5522 12.5 18.25 12.5C18.9478 12.5 19.2967 12.5 19.5806 12.4139C20.2198 12.22 20.72 11.7198 20.9139 11.0806C21 10.7967 21 10.4478 21 9.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M16.9194 20.9139C17.2033 21 17.5522 21 19.5806 20.9139C20.2198 20.72 20.72 20.2198 20.9139 19.5806C21 19.2967 21 18.9478 21 18.25C21 17.5522 21 17.2033 20.9139 16.9194C20.72 16.2802 20.2198 15.78 19.5806 15.5861C19.2967 15.5 18.9478 15.5 18.25 15.5C17.5522 15.5 17.2033 15.5 16.9194 15.5861C16.2802 15.78 15.78 16.2802 15.5861 16.9194C15.5 17.2033 15.5 17.5522 15.5 18.25C15.5 18.9478 15.5 19.2967 15.5861 19.5806C15.78 20.2198 16.2802 20.72 16.9194 20.9139Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8.5 11.5H7C5.11438 11.5 4.17157 11.5 3.58579 12.0858C3 12.6716 3 13.6144 3 15.5V17C3 18.8856 3 19.8284 3.58579 20.4142C4.17157 21 5.11438 21 7 21H8.5C10.3856 21 11.3284 21 11.9142 20.4142C12.5 19.8284 12.5 18.8856 12.5 17V15.5C12.5 13.6144 12.5 12.6716 11.9142 12.0858C11.3284 11.5 10.3856 11.5 8.5 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  masters: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.788 11.0977C20.9293 11.2964 21 11.5036 21 11.7314C21 12.7132 19.6873 13.3114 17.0618 14.5077L15.357 15.2845C13.7048 16.0373 12.8786 16.4138 12 16.4138C11.1214 16.4138 10.2952 16.0373 8.64298 15.2845L6.93817 14.5077C4.31272 13.3114 3 12.7132 3 11.7314C3 11.5036 3.07067 11.2964 3.212 11.0977" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.3767 16.2656C20.7922 16.5966 21 16.9265 21 17.3171C21 18.299 19.6873 18.8971 17.0618 20.0934L15.357 20.8702C13.7048 21.6231 12.8786 21.9995 12 21.9995C11.1214 21.9995 10.2952 21.6231 8.64298 20.8702L6.93817 20.0934C4.31272 18.8971 3 18.299 3 17.3171C3 16.9265 3.20778 16.5966 3.62334 16.2656" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plans: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 14V10C22 6.22876 22 4.34315 20.8284 3.17157C19.6569 2 17.7712 2 14 2H12C8.22876 2 6.34315 2 5.17157 3.17157C4 4.34315 4 6.22876 4 10V14C4 17.7712 4 19.6569 5.17157 20.8284C6.34315 22 8.22876 22 12 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 6H2M5 12H2M5 18H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.5 7H13.5M15.5 11H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  users: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 14H7C4.23858 14 2 16.2386 2 19C2 20.1046 2.89543 21 4 21H14C15.1046 21 16 20.1046 16 19C16 16.2386 13.7614 14 11 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M17 14C19.7614 14 22 16.2386 22 19C22 20.1046 21.1046 21 20 21H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  teams: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.481 11.3499C15.803 11.4475 16.1445 11.5 16.4983 11.5C18.4313 11.5 19.9983 9.933 19.9983 8C19.9983 6.067 18.4313 4.5 16.4983 4.5C14.6834 4.5 13.1911 5.8814 13.0156 7.65013" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.5 19.5C17.5 16.7386 15.0376 14.5 12 14.5C8.96243 14.5 6.5 16.7386 6.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  events: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2V6M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.1258 14H12.0008M7.625 14H7.5M16.625 14H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  request: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 8C14.5 5.23858 12.2614 3 9.5 3C6.73858 3 4.5 5.23858 4.5 8C4.5 10.7614 6.73858 13 9.5 13C12.2614 13 14.5 10.7614 14.5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 20C2.5 16.134 5.63401 13 9.5 13C10.775 13 11.9704 13.3409 13 13.9365" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.5 14.8462C15.5 13.8266 16.3954 13 17.5 13C18.6046 13 19.5 13.8266 19.5 14.8462C19.5 15.2137 19.3837 15.5561 19.1831 15.8438C18.5854 16.7012 17.5 17.0189 17.5 18.0385V18.5M17.4902 21H17.4992" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  facility: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2H6C3.518 2 3 2.518 3 5V22H15V5C15 2.518 14.482 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M18 8H15V22H21V11C21 8.518 20.482 8 18 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 6H10M8 9H10M8 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 22V18C11.5 17.0572 11.5 16.5858 11.2071 16.2929C10.9142 16 10.4428 16 9.5 16H8.5C7.55719 16 7.08579 16 6.79289 16.2929C6.5 16.5858 6.5 17.0572 6.5 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  cms: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2H6C3.518 2 3 2.518 3 5V22H15V5C15 2.518 14.482 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M3.5 8H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 12H17M13 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 8V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  eval: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17.7048 9.33333L14.8311 13.9845C14.4123 14.6623 13.9369 15.686 13.0749 15.5344C12.0611 15.356 11.5742 13.8449 10.7026 13.3445C9.99285 12.9371 9.47971 13.4281 9.06475 14M21 4L19.1465 7M5 20L7.52632 16.2667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  settings: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20.7906 9.15201C21.5969 10.5418 22 11.2366 22 12C22 12.7634 21.5969 13.4582 20.7906 14.848L18.8669 18.1638C18.0638 19.548 17.6623 20.2402 17.0019 20.6201C16.3416 21 15.5402 21 13.9373 21H10.0627C8.45982 21 7.6584 21 6.99807 20.6201C6.33774 20.2402 5.93619 19.548 5.13311 18.1638L3.20942 14.848C2.40314 13.4582 2 12.7634 2 12C2 11.2364 2.40314 10.5418 3.20942 9.152L5.13311 5.83621C5.93619 4.45196 6.33774 3.75984 6.99807 3.37992C7.6584 3 8.45982 3 10.0627 3H13.9373C15.5402 3 16.3416 3 17.0019 3.37992C17.6623 3.75984 18.0638 4.45197 18.8669 5.83622L20.7906 9.15201Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  help: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 13.8045C17 13.4588 17 13.286 17.052 13.132C17.2032 12.6844 17.6018 12.5108 18.0011 12.3289C18.45 12.1244 18.6744 12.0222 18.8968 12.0042C19.1493 11.9838 19.4022 12.0382 19.618 12.1593C19.9041 12.3198 20.1036 12.6249 20.3079 12.873C21.2512 14.0188 21.7229 14.5918 21.8955 15.2236C22.0348 15.7334 22.0348 16.2666 21.8955 16.7764C21.6438 17.6979 20.8485 18.4704 20.2598 19.1854C19.9587 19.5511 19.8081 19.734 19.618 19.8407C19.4022 19.9618 19.1493 20.0162 18.8968 19.9958C18.6744 19.9778 18.45 19.8756 18.0011 19.6711C17.6018 19.4892 17.2032 19.3156 17.052 18.868C17 18.714 17 18.5412 17 18.1955V13.8045Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.5 21C10.8807 22.3333 13.1193 22.3333 14.5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 13.8045C7 13.3693 6.98778 12.9782 6.63591 12.6722C6.50793 12.5609 6.33825 12.4836 5.99891 12.329C5.55001 12.1246 5.32556 12.0224 5.10316 12.0044C4.43591 11.9504 4.07692 12.4058 3.69213 12.8731C2.74875 14.0189 2.27706 14.5918 2.10446 15.2236C1.96518 15.7334 1.96518 16.2666 2.10446 16.7764C2.3562 17.6979 3.15152 18.4702 3.74021 19.1852C4.11129 19.6359 4.46577 20.0472 5.10316 19.9956C5.32556 19.9776 5.55001 19.8754 5.99891 19.6709C6.33825 19.5164 6.50793 19.4391 6.63591 19.3278C6.98778 19.0218 7 18.6307 7 18.1954V13.8045Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 16V12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12L22.0001 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  logout: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6.5C4.15875 8.14796 3 10.3344 3 12.9999C3 17.9705 7.02944 21.9999 12 21.9999C16.9706 21.9999 21 17.9705 21 12.9999C21 10.3344 19.8412 8.14796 18 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2V11M12 2C11.2998 2 9.99153 3.9943 9.5 4.5M12 2C12.7002 2 14.0085 3.9943 14.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  cms_pages: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  evaluation_config: (
    <svg className="lg:w-5 w-4 lg:h-5 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17.7048 9.33333L14.8311 13.9845C14.4123 14.6623 13.9369 15.686 13.0749 15.5344C12.0611 15.356 11.5742 13.8449 10.7026 13.3445C9.99285 12.9371 9.47971 13.4281 9.06475 14M21 4L19.1465 7M5 20L7.52632 16.2667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─── Types ───────────────────────────────────────────────────────────────
interface SubNavItem {
  key: string;
  label: string;
  href: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  children?: SubNavItem[];
}

// ─── Permission map for sidebar items ──────────────────────────────
const NAV_PERMISSIONS: Record<string, string[]> = {
  dashboard: ["view-dashboard"],
  masters: ["view-kpis", "view-activity-type", "view-sport-activity"],
  "masters-manage-kpis": ["view-kpis"],
  "masters-event-types": ["view-activity-type"],
  "masters-event-activities": ["view-sport-activity"],
  plans: ["view-plans"],
  users: ["list-view-users", "list-view-admin"],
  "users-admin": ["list-view-admin"],
  "users-employees": ["list-view-users"],
  teams: ["view-team"],
  events: ["view-event"],
  request: ["view-list-participants"],
  facility: ["view-list-facilities", "can-approve-or-reject-request"],
  "facility-view": ["view-list-facilities"],
  "facility-request": ["can-approve-or-reject-request"],
  cms: ["view-blog-list"],
  faq: ["view-blog-list"],
  sponsors: ["view-blog-list"],
  "home-slider": ["view-blog-list"],
  blog: ["view-blog-list"],
  media: ["view-blog-list"],
  "contact-us": ["view-blog-list"],
  "cms-pages": ["view-blog-list"],
  "glimpse": ["view-blog-list"],
  eval: ["view-evaluation-list", "view-fitness-category-list"],
  "fitness-categories": ["view-fitness-category-list"],
  "fitness-age-groups": ["view-fitness-category-list"],
  "fitness-score-matrix": ["view-fitness-category-list"],
};

function filterNavItems(items: NavItem[]): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    // Restrict audit-history and eval modules to Admin / Super Admin only (unless bypass is on)
    if (!permissionsBypassEnabled() && (item.key === "audit-history" || item.key === "eval")) {
      if (!isAdminOrSuperAdmin()) return acc;
    }

    const permKey = NAV_PERMISSIONS[item.key];
    if (permKey && !hasAnyPermission(permKey)) return acc;

    let filteredChildren: SubNavItem[] | undefined;
    if (item.children) {
      filteredChildren = item.children.filter(child => {
        const childPerm = NAV_PERMISSIONS[child.key];
        return !childPerm || hasAnyPermission(childPerm);
      });
      if (filteredChildren.length === 0) return acc;
    }

    acc.push({ ...item, children: filteredChildren });
    return acc;
  }, []);
}

// ─── ChevronIcon ───────────────────────────────────────────────────────
const ChevronIcon = () => (
  <svg className="w-4 h-4 shrink-0 transition-transform duration-200 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Divider ────────────────────────────────────────────────────────
const Divider = ({ isActive }: { isActive: boolean }) => (
  <svg className="shrink-0 rtl:-scale-x-100" width="2" height="10" viewBox="0 0 2 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.75 0.75L0.75 8.75" stroke={isActive ? "#0A2240" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── SubNavButton ───────────────────────────────────────────────────
const SubNavButton = ({ item, isActive, onClick, disabled }: { item: SubNavItem; isActive: boolean; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-2 ps-12 pe-4 lg:py-1.5 py-1 text-[13px] font-medium transition-all duration-150 rounded-lg cursor-pointer ${disabled ? "opacity-40 pointer-events-none" : ""} ${isActive ? "text-white" : "text-white/50 hover:text-white/80"}`}
  >
    {item.label}
  </button>
);

// ─── NavButton ──────────────────────────────────────────────────────
const NavButton = ({ item, isActive, isChildActive, isOpen, onToggle, onNavigate, activeSubKey, disabled }: {
  item: NavItem;
  isActive: boolean;
  isChildActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (key: string, href: string) => void;
  activeSubKey: string;
  disabled?: boolean;
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const highlighted = isActive || isChildActive;

  return (
    <div className="px-3 w-full">
      <button
        onClick={() => { hasChildren ? onToggle() : onNavigate(item.key, item.href); }}
        disabled={disabled}
        className={`relative cursor-pointer w-full flex items-center gap-2 px-3 lg:py-2.5 py-2 text-sm font-semibold transition-all duration-200 2xl:rounded-xl rounded-lg ${disabled ? "opacity-50 pointer-events-none" : ""} ${highlighted ? "bg-white text-secondary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
      >
        {highlighted && <span className="absolute -start-3.5 top-0 h-full w-1 bg-white rounded-e-full" />}
        <Text variant="textBase" className="shrink-0">{icons[item.icon]}</Text>
        <Divider isActive={highlighted} />
        <span className="flex-1 text-start truncate">{item.label}</span>
        {hasChildren && <span className={highlighted ? "text-secondary" : "text-white/50"}><ChevronIcon /></span>}
      </button>
      {hasChildren && (
        <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isOpen ? `${item.children!.length * 36}px` : "0px", opacity: isOpen ? 1 : 0 }}>
          <div className="pt-0.5 pb-1">
            {item.children!.map((child) => (
              <SubNavButton key={child.key} item={child} isActive={activeSubKey === child.key} onClick={() => onNavigate(child.key, child.href)} disabled={disabled} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ───────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, open, setOpen }: {
  active: string;
  setActive: (key: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Use the navigation guard hook for safe navigation
  const { navigateWithGuard, isNavigating } = useNavigationGuard();

  // ─── navItems ────────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    { key: "dashboard", label: t.sidebar.dashboard, icon: "dashboard", href: "/dashboard" },
    {
      key: "masters", label: t.sidebar.masters, icon: "masters", href: "/masters",
      children: [
        { key: "masters-manage-kpis", label: t.sidebar.manageKpis, href: "/masters/manage-kpis" },
        { key: "masters-event-types", label: t.sidebar.eventTypes, href: "/masters/event-types" },
        { key: "masters-event-activities", label: t.sidebar.eventActivities, href: "/masters/event-activities" },
      ],
    },
    { key: "plans", label: t.sidebar.plans, icon: "plans", href: "/plans" },
    {
      key: "users", label: t.sidebar.userManagement, icon: "users", href: "/users",
      children: [
        { key: "users-admin", label: t.sidebar.admin, href: "/users/admin" },
        { key: "users-employees", label: t.sidebar.employees, href: "/users/employees" },
      ],
    },
    { key: "teams", label: t.sidebar.teams, icon: "teams", href: "/teams" },
    { key: "events", label: t.sidebar.manageEvents, icon: "events", href: "/events" },
    { key: "request", label: t.sidebar.participantsRequest, icon: "request", href: "/participant-requests" },
    { key: "audit-history", label: "Audit History", icon: "cms_pages", href: "/audit-history" },
    { key: "notifications", label: "Notifications", icon: "help", href: "/notifications" },
    {
      key: "facility", label: t.sidebar.manageFacilities, icon: "facility", href: "/facility",
      children: [
        { key: "facility-view", label: t.sidebar.viewFacilities, href: "/facility/view" },
        { key: "facility-request", label: t.sidebar.facilitiesRequest, href: "/facility/request" },
      ],
    },
     {
      key: "cms", label: t.sidebar.cms, icon: "cms_pages", href: "/cms",
      children: [
        { key: "faq", label: t.sidebar.faqs, href: "/cms/faq" },
        { key: "sponsors", label: t.sidebar.sponsors, href: "/cms/sponsors" },
        { key: "home-slider", label: t.sidebar.homeSlider, href: "/cms/home-slider" },
        { key: "blog", label: t.sidebar.blog, href: "/cms/blog" },
        { key: "media", label: t.sidebar.media, href: "/cms/media" },
        { key: "contact-us", label: t.sidebar.contactUs, href: "/cms/contacts" },
        { key: "cms-pages", label: t.sidebar.cmsPages, href: "/cms/pages" },
        { key: "glimpse", label: t.sidebar.glimpse, href: "/cms/glimpse" },
      ],
    },
    {
      key: "eval", label: t.sidebar.evaluationConfig, icon: "evaluation_config", href: "/eval",
      children: [
        { key: "fitness-categories", label: t.sidebar.fitnessCategories, href: "/eval/fitness-categories" },
        { key: "fitness-age-groups", label: t.sidebar.fitnessAgeGroups, href: "/eval/fitness-age-groups" },
        { key: "fitness-score-matrix", label: t.sidebar.fitnessScoreMatrix, href: "/eval/fitness-score-matrix" },
      ],
    },
  ];

  const bottomNav: NavItem[] = [
    { key: "logout", label: t.sidebar.logout, icon: "logout", href: "/logout" },
  ];

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const toggleMenu = (key: string) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  // Use navigateWithGuard instead of direct navigate
  const handleNav = (key: string, href: string) => {
    if (key === "logout") { handleLogout(); return; }
    setActive(key);
    setOpen(false);
    navigateWithGuard(key, href);
  };

  const clearAdminSession = () => {
    localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); localStorage.removeItem("adminRememberMe"); localStorage.removeItem("adminRefreshToken");
  };
  const handleLogout = async () => {
    if (isNavigating) return; // Prevent double-click on logout
    setOpen(false);
    try { await adminLogoutApi(); } catch (error) { console.warn("Admin logout API failed:", error); } finally { clearAdminSession(); navigateWithGuard("logout", "/login", { replace: true }); }
  };
  const filteredNavItems = filterNavItems(navItems);
  const allItems = [...filteredNavItems, ...bottomNav];
  const allSubs = allItems.flatMap((i) => i.children ?? []);
  const matchedSub = allSubs.find((s) => location.pathname === s.href || location.pathname.startsWith(s.href + "/"));
  const matchedParent = allItems.find((i) => i.href === location.pathname || (i.href !== "/" && location.pathname.startsWith(i.href + "/")));
  const activeKey = matchedSub?.key ?? matchedParent?.key ?? active;
  const activeParentKey = filteredNavItems.find((item) => item.children?.some((c) => c.key === activeKey))?.key ?? "";
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 h-full z-30 flex flex-col text-white bg-primary bg-bottom bg-no-repeat bg-[length:100%_524px] transition-all duration-300 ease-in-out overflow-hidden ${open ? "w-64 2xl:w-72" : "w-0 2xl:w-72 lg:w-64"} start-0`} style={{ backgroundImage: `url(${SidebarBg})` }}>
        <div style={{ backgroundImage: `url(${SidebarBg})` }} className="absolute -z-10 inset-0 bg-bottom bg-no-repeat bg-[length:100%_524px] pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-full bg-[linear-gradient(180deg,#7A2530_0%,rgba(122,37,48,0.83)_100%,#7A2530_100%)] pointer-events-none h-131" />
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <img src={LogoImage} alt="Logo" className="lg:h-8 h-7 w-fit object-contain me-auto" />
        </div>
        <nav className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden py-2 relative z-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="space-y-0.5">
            <Text variant="textSm" className="px-5 text-white/40 mb-2 font-semibold text-start">{t.sidebar.mainMenu}</Text>
            {filteredNavItems.map((item) => {
              const isChildActive = activeParentKey === item.key;
              const isParentActive = activeKey === item.key;
              const isOpen = openMenus[item.key] || isChildActive;
              return <NavButton key={item.key} item={item} isActive={isParentActive} isChildActive={isChildActive} isOpen={isOpen} onToggle={() => toggleMenu(item.key)} onNavigate={handleNav} activeSubKey={activeKey} disabled={isNavigating} />;
            })}
          </div>
          <div className="mt-4">
            <span className="w-full mx-auto block px-4">
              <svg className="w-full h-px" viewBox="0 0 256 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line opacity="0.4" x1="0" y1="0.5" x2="256" y2="0.5" stroke="#E7D2D2" strokeWidth="1" />
              </svg>
            </span>
            <div className="space-y-0.5 lg:pt-4 pt-3">
              {bottomNav.map((item) => <NavButton key={item.key} item={item} isActive={!filteredNavItems.some(n => n.key === activeKey) && activeKey === item.key} isChildActive={false} isOpen={false} onToggle={() => {}} onNavigate={handleNav} activeSubKey={activeKey} disabled={isNavigating} />)}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
