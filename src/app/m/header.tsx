import { ChevronLeft } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { NoticeBell } from "@/components/notice-bell";
import { UserMenu } from "@/components/user-menu";
import type { Role } from "@/lib/types";

/**
 * The dark header from the reelmaker mockup: title, a grey line under it, an optional back button,
 * and the three check-in step dots on a shoot.
 */
export function MHeader({ title, subtitle, back, step, me, unread = 0 }: {
  title: string; subtitle?: string; back?: string; step?: 1 | 2 | 3;
  /** Shows the bell and the avatar menu (on the home screen). */
  me?: { full_name: string; email: string; role: Role }; unread?: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-none items-center gap-3 bg-side px-4 pb-3.5 pt-[max(env(safe-area-inset-top),14px)] text-white">
      {back && (
        <LinkButton href={back} variant="ghost" className="size-11 min-w-11 rounded-[10px] bg-side2 p-0 text-white" aria-label="Back">
          <ChevronLeft aria-hidden className="size-5" />
        </LinkButton>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[19px] font-bold leading-tight">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-sidemute2">{subtitle}</div>}
      </div>
      {step && (
        <div role="img" aria-label={`Step ${step} of 3`} className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 w-[22px] rounded-sm ${n < step ? "bg-ok" : n === step ? "bg-rec" : "bg-side2"}`} />
          ))}
        </div>
      )}
      {me && (
        <div className="flex items-center">
          <NoticeBell unread={unread} dark />
          <UserMenu me={me} dark />
        </div>
      )}
    </header>
  );
}

/** Scrolling content area between the header and the bottom action. */
export function MMain({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col gap-3.5 p-4">{children}</main>;
}

/** The white bar pinned to the bottom with the screen's one main action. */
export function MFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="sticky bottom-0 z-20 flex-none border-t border-line bg-paper px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
      {children}
    </footer>
  );
}
