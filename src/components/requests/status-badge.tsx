import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@/lib/taxonomy";

const tone: Record<RequestStatus, "brand" | "accent" | "neutral" | "success" | "warning"> = {
  pending: "warning",
  accepted: "brand",
  delivered: "accent",
  completed: "success",
  declined: "neutral",
  cancelled: "neutral",
  expired: "neutral",
};

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const t = useTranslations("requests.status");
  return (
    <Badge tone={tone[status]} className={className}>
      {t(status)}
    </Badge>
  );
}
