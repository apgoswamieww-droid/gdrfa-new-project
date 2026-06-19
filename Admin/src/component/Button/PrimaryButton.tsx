import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";

interface buttonProps {
    className?:string;
    children: ReactNode;
    href?:string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    form?: string;
}
export default function PrimaryBtn({className, children, href,onClick, disabled = false, type = "submit", form}: buttonProps) {
    const baseClasses = twMerge(
        "flex lg:gap-1.5 gap-1 justify-center items-center font-bold lg:text-sm text-xs rounded-lg lg:px-3.5 px-2.5 border border-transparent lg:py-1.5 py-1 bg-primary hover:bg-primary/90 transition ease-in-out duration-300 text-white cursor-pointer",
        className
    );

    if (href) {
        return (
        <Link to={href} className={baseClasses}>
            {children}
        </Link>
        );
    }

    return <button type={type} onClick={onClick} disabled={disabled} form={form} className={baseClasses}>{children}</button>;
}
