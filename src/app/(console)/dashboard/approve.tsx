"use client";
import { ActionButton } from "@/components/action-button";
import { apiClient } from "@/lib/api-client";

/** Approve (dark) and Reject (outline), as on the dashboard mockup. */
export function ApprovePriceChange({ id }: { id: string }) {
  const decide = (approve: boolean) => () => apiClient.post(`/price-changes/${encodeURIComponent(id)}/decision`, { approve });
  return (
    <div className="flex gap-2">
      <ActionButton variant="primary" size="md" className="flex-1 bg-ink" run={decide(true)} success="Approved">Approve</ActionButton>
      <ActionButton variant="outline" size="md" className="flex-1" run={decide(false)} success="Rejected" confirm="Reject this price change?">Reject</ActionButton>
    </div>
  );
}
