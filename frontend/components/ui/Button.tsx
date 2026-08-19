import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

const VARIANT_STYLES = {
  primary: "bg-[#6FCDB3] text-white active:bg-[#5BB99E]",
  secondary: "bg-[#ECECEC] text-[#555] active:bg-[#DDD]",
  danger: "bg-[#E88A7D] text-white active:bg-[#D97768]",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full py-4 rounded-full font-bold text-base transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${VARIANT_STYLES[variant]} ${className}`}
    />
  );
}