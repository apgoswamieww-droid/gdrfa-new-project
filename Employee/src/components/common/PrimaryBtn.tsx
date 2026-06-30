import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  children: ReactNode;
  href?: string;
  className?:string;
  type?: "button" | "submit" | "reset";
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export default function PrimaryBtn({
  children,
  href,
  className,
  type = "button",
  ...props
}: Props) {
  if (href) {
    const rest = props;
    return (
      <a href={href} {...rest} className={twMerge('inline-flex justify-center items-center lg:rounded-[18px] rounded-xl xl:min-h-[60px] md:min-h-12 min-h-10 text-center bg-primary text-white border border-primary transition-all duration-300 md:px-6 px-4 md:py-4 py-2.5 lg:text-lg/tight text-base/tight font-bold hover:bg-transparent hover:text-primary', className)}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} {...props} className={twMerge('inline-flex justify-center items-center lg:rounded-[18px] rounded-xl xl:min-h-[60px] md:min-h-12 min-h-10 text-center bg-primary text-white border border-primary transition-all duration-300 md:px-6 px-4 md:py-4 py-2.5 lg:text-lg/tight text-base/tight font-bold hover:bg-transparent hover:text-primary cursor-pointer', className)}>
      {children}
    </button>
  );
}
