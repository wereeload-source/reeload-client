"use client";
import { Alert, Button, Form, Modal, toast } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorText } from "@/lib/api-client";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft";

/**
 * A button that opens a small form in a dialog. `onSubmit` gets the form's data and either finishes
 * (the dialog closes, a toast confirms and the page reloads its data) or throws (the error is shown
 * in the dialog and nothing closes, so the user can fix it).
 */
export function FormDialog({
  trigger, icon: Icon, variant = "primary", size = "md", title, description, submitLabel = "Save", success, onSubmit, children, isDisabled, className, fullWidth,
}: {
  trigger: string; icon?: LucideIcon; variant?: ButtonVariant; size?: "sm" | "md" | "lg";
  title: string; description?: React.ReactNode; submitLabel?: string; success?: string;
  onSubmit: (form: FormData) => Promise<unknown>; children: React.ReactNode; isDisabled?: boolean;
  className?: string; fullWidth?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit(new FormData(e.currentTarget));
      setOpen(false);
      if (success) toast.success(success);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal>
      <Button variant={variant} size={size} isDisabled={isDisabled} className={className} fullWidth={fullWidth} onPress={() => { setError(null); setOpen(true); }}>
        {Icon && <Icon aria-hidden className="size-4" />}
        {trigger}
      </Button>
      <Modal.Backdrop isOpen={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[460px]">
            <Modal.CloseTrigger />
            <Form onSubmit={submit}>
              <Modal.Header>
                <Modal.Heading>{title}</Modal.Heading>
                {description && <div className="text-sm text-mute">{description}</div>}
              </Modal.Header>
              <Modal.Body className="grid gap-3">
                {children}
                {error && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{error}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setOpen(false)} isDisabled={pending}>Cancel</Button>
                <Button type="submit" isPending={pending}>{pending ? "Saving…" : submitLabel}</Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
