import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "border-brand-200 bg-brand-50/70 text-brand-800", Icon: Info },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  error: { cls: "border-red-200 bg-red-50 text-red-700", Icon: XCircle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", cls, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>}
      </div>
    </div>
  );
}
