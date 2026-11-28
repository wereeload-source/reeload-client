"use client";
import { Button, toast } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorText } from "@/lib/api-client";

/**
 * Runs one API call on press. Errors show as a toast; on success the page reloads its data.
 * Pass `confirm` for anything that cannot be undone.
 */
export function ActionButton({
  children, icon: Icon, run, success, confirm, variant = "secondary", size = "sm", isDisabled,
}: {
  children: React.ReactNode; icon?: LucideIcon; run: () => Promise<unknown>; success?: string; confirm?: string;
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft"; size?: "sm" | "md" | "lg"; isDisabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function press() {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true);
    try {
      await run();
      if (success) toast.success(success);
      router.refresh();
    } catch (e) {
      toast.danger(errorText(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={variant} size={size} isPending={pending} isDisabled={isDisabled} onPress={press}>
      {Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </Button>
  );
}
