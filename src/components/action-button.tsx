"use client";
import { AlertDialog, Button, toast } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorText } from "@/lib/api-client";

type Variant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft";

/**
 * Runs one API call on press. Errors show as a toast; on success the page reloads its data.
 * Pass `confirm` for anything that cannot be undone: a HeroUI alert dialog asks first.
 */
export function ActionButton({
  children, icon: Icon, run, success, confirm, variant = "secondary", size = "sm", isDisabled, className, fullWidth,
}: {
  children: React.ReactNode; icon?: LucideIcon; run: () => Promise<unknown>; success?: string; confirm?: string;
  variant?: Variant; size?: "sm" | "md" | "lg"; isDisabled?: boolean; className?: string; fullWidth?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [asking, setAsking] = useState(false);

  async function go() {
    setAsking(false);
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

  const button = (
    <Button variant={variant} size={size} isPending={pending} isDisabled={isDisabled} className={className} fullWidth={fullWidth} onPress={confirm ? () => setAsking(true) : go}>
      {Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </Button>
  );
  if (!confirm) return button;

  const danger = variant === "danger" || variant === "danger-soft";
  return (
    <>
      {button}
      <AlertDialog.Backdrop isOpen={asking} onOpenChange={setAsking}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[420px]">
            <AlertDialog.Header>
              <AlertDialog.Icon status={danger ? "danger" : "warning"} />
              <AlertDialog.Heading>{confirm}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">Cancel</Button>
              <Button variant={danger ? "danger" : "primary"} onPress={go}>{children}</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
