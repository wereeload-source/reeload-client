"use client";
import { Avatar, Button, Dropdown, Header, Label, Separator } from "@heroui/react";
import { Clock3, LogOut, Settings, UserCog, UserRound } from "lucide-react";
import { signOutFully } from "@/components/sign-out";
import { initials } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/types";

type Me = { full_name: string; email: string; role: Role };

/** Links that belong to each role's own menu, beside "My account". */
const EXTRA: Partial<Record<Role, { id: string; href: string; label: string; icon: typeof Settings }[]>> = {
  admin: [
    { id: "users", href: "/users", label: "Users", icon: UserCog },
    { id: "settings", href: "/settings", label: "Settings", icon: Settings },
  ],
  reelmaker: [{ id: "hours", href: "/m/hours", label: "My hours", icon: Clock3 }],
};

/** Avatar button in the header with the signed-in person's details, their pages and Sign out. */
export function UserMenu({ me, dark }: { me: Me; dark?: boolean }) {
  const account = me.role === "reelmaker" ? "/m/account" : "/account";
  return (
    <Dropdown>
      <Button isIconOnly variant="ghost" aria-label={`Account menu for ${me.full_name}`} className={`size-11 rounded-full ${dark ? "hover:bg-side2 data-[pressed=true]:bg-side2 aria-expanded:bg-side2 data-[focus-visible=true]:bg-side2" : ""}`}>
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{initials(me.full_name)}</Avatar.Fallback>
        </Avatar>
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-60">
        <Dropdown.Menu
          aria-label="Account"
          onAction={(key) => {
            if (key === "signout") void signOutFully();
          }}
        >
          <Dropdown.Section>
            <Header className="px-2 pb-1 pt-1.5">
              <div className="text-sm font-semibold text-ink">{me.full_name}</div>
              <div className="truncate text-xs font-normal text-mute">{me.email}</div>
              <div className="mt-0.5 text-xs font-normal text-mute">{ROLE_LABEL[me.role]}</div>
            </Header>
          </Dropdown.Section>
          <Separator />
          <Dropdown.Section>
            <Dropdown.Item id="account" href={account} textValue="My account">
              <UserRound aria-hidden className="size-4" />
              <Label>My account</Label>
            </Dropdown.Item>
            {(EXTRA[me.role] ?? []).map((l) => (
              <Dropdown.Item key={l.id} id={l.id} href={l.href} textValue={l.label}>
                <l.icon aria-hidden className="size-4" />
                <Label>{l.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Separator />
          <Dropdown.Item id="signout" textValue="Sign out" variant="danger">
            <LogOut aria-hidden className="size-4" />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
