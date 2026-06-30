import { Heading,Text } from "../../component/Typography/Typography";

const icons = {
  users: (
    <svg className="2xl:w-7 w-5 2xl:h-7 h-5" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.4118 18.119C21.4118 14.4801 18.4618 11.5303 14.8231 11.5303C11.1842 11.5303 8.23438 14.4801 8.23438 18.119C8.23438 21.7577 11.1842 24.7077 14.8231 24.7077C18.4618 24.7077 21.4118 21.7577 21.4118 18.119Z" stroke="#7A2530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.1808 12.4488C18.1388 12.1486 18.1172 11.8419 18.1172 11.5301C18.1172 7.89126 21.0671 4.94141 24.7059 4.94141C28.3446 4.94141 31.2946 7.89126 31.2946 11.5301C31.2946 15.1689 28.3446 18.1188 24.7059 18.1188C23.4794 18.1188 22.3313 17.7838 21.348 17.2002" stroke="#7A2530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.7075 34.591C24.7075 29.1328 20.2827 24.708 14.8244 24.708C9.36619 24.708 4.94141 29.1328 4.94141 34.591" stroke="#7A2530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34.5901 28.0022C34.5901 22.5439 30.1653 18.1191 24.707 18.1191" stroke="#7A2530" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  events: (
    <svg className="2xl:w-7 w-5 2xl:h-7 h-5" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 33.333V29.9503C5 27.8798 5.93212 25.8495 7.81613 24.9907C10.1142 23.9432 12.8702 23.333 15.8333 23.333C17.908 23.333 19.8812 23.6322 21.6667 24.171" stroke="#364B9B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8333 18.3337C19.055 18.3337 21.6667 15.722 21.6667 12.5003C21.6667 9.27866 19.055 6.66699 15.8333 6.66699C12.6117 6.66699 10 9.27866 10 12.5003C10 15.722 12.6117 18.3337 15.8333 18.3337Z" stroke="#364B9B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.168 6.90723C26.5775 7.62436 28.3346 9.85648 28.3346 12.499C28.3346 15.1415 26.5775 17.3737 24.168 18.0908" stroke="#364B9B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 23.333V33.333M25 28.333H35" stroke="#364B9B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  request: (
    <svg className="2xl:w-7 w-5 2xl:h-7 h-5" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.6654 3.33301V9.99967M13.332 3.33301V9.99967" stroke="#0A2240" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21.6667 6.66699H18.3333C12.0479 6.66699 8.90525 6.66699 6.95262 8.61961C5 10.5722 5 13.7149 5 20.0003V23.3337C5 29.619 5 32.7618 6.95262 34.7143C8.90525 36.667 12.0479 36.667 18.3333 36.667H21.6667C27.952 36.667 31.0948 36.667 33.0473 34.7143C35 32.7618 35 29.619 35 23.3337V20.0003C35 13.7149 35 10.5722 33.0473 8.61961C31.0948 6.66699 27.952 6.66699 21.6667 6.66699Z" stroke="#0A2240" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 16.667H35" stroke="#0A2240" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.332 23.333H26.6654M13.332 23.333H13.347M21.6654 29.9997H13.332M26.6654 29.9997H26.6504" stroke="#0A2240" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};


export type IconType = "users" | "events" | "request";

interface StatCardProps {
  label: string;
  value: string;
  icon: IconType;
  bg: string;
}

const StatCard = ({ label, value, icon, bg }: StatCardProps) => {
  return (
    <div className="bg-white 2xl:rounded-lg rounded-xl p-3 2xl:p-3.5 flex items-center xl:gap-2.5 gap-2 transition-shadow">
      <div className={`xl:w-11 w-9 xl:h-11 h-9 2xl:w-13 2xl:h-13 ${bg} 2xl:rounded-xl rounded-lg flex items-center justify-center shrink-0`}>
        <span className="shrink-0">
          {icons[icon]}
        </span>
      </div>
      <div>
        <Text variant="textLg" className="text-secondary font-medium 2xl:mb-1.5 mb-1 !text-xs">{label}</Text>
        <Heading variant="h1" className="font-bold text-secondary !text-base sm:!text-lg">{value}</Heading>
      </div>
    </div>
  );
};

export default StatCard;