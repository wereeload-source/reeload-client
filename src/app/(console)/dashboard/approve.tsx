"use client";
import { Check, X } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { apiClient } from "@/lib/api-client";

export function ApprovePriceChange({ id }: { id: string }) {
  const decide = (approve: boolean) => () => apiClient.post(`/price-changes/${encodeURIComponent(id)}/decision`, { approve });
  return (
    <div className="flex gap-1.5">
      <ActionButton icon={X} variant="secondary" run={decide(false)} success="Rejected">Reject</ActionButton>
      <ActionButton icon={Check} variant="primary" run={decide(true)} success="Approved">Approve</ActionButton>
    </div>
  );
}
