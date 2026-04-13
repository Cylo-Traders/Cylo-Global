import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const statusConfig: Record<OrderStatus, { label: string; variant: "success" | "warning" | "secondary" }> = {
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  refunded: { label: "Refunded", variant: "secondary" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
