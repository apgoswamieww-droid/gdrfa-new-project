import { useEffect, useState } from "react";

type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bg = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className={`${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm pointer-events-auto transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs shrink-0">
          {icon}
        </span>
        {message}
      </div>
    </div>
  );
}
