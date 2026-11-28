"use client";
import { Badge, Button, Popover, Spinner } from "@heroui/react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, errorText } from "@/lib/api-client";
import { day, time } from "@/lib/format";
import type { Notifications } from "@/lib/types";

/** The bell in the header: unread count, the latest notices, and "Mark all as read". */
export function NoticeBell({ unread: initial, dark }: { unread: number; dark?: boolean }) {
  const router = useRouter();
  const [unread, setUnread] = useState(initial);
  const [items, setItems] = useState<Notifications["items"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const n = await apiClient.get<Notifications>("/notifications?limit=10");
      setItems(n.items);
      setUnread(n.unread);
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function open(item: Notifications["items"][number]) {
    if (!item.read_at) {
      await apiClient.post(`/notifications/${encodeURIComponent(item.id)}/read`).catch(() => undefined);
      setUnread((u) => Math.max(0, u - 1));
      setItems((xs) => xs?.map((x) => (x.id === item.id ? { ...x, read_at: new Date().toISOString() } : x)) ?? null);
    }
    if (item.link?.startsWith("/")) router.push(item.link);
  }

  async function readAll() {
    await apiClient.post("/notifications/read-all").catch(() => undefined);
    setUnread(0);
    setItems((xs) => xs?.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })) ?? null);
  }

  return (
    <Popover onOpenChange={(isOpen) => isOpen && void load()}>
      <Badge.Anchor>
        <Button isIconOnly variant="ghost" aria-label={unread ? `Notices, ${unread} unread` : "Notices"} className={`size-11 ${dark ? "text-sideink hover:bg-side2 data-[pressed=true]:bg-side2 aria-expanded:bg-side2 data-[focus-visible=true]:bg-side2" : "text-ink"}`}>
          <Bell aria-hidden className="size-5" />
        </Button>
        {unread > 0 && <Badge color="danger" size="sm">{unread > 9 ? "9+" : unread}</Badge>}
      </Badge.Anchor>
      <Popover.Content placement="bottom end" className="w-[340px] max-w-[calc(100vw-24px)]">
        <Popover.Dialog className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <Popover.Heading className="text-sm font-semibold">Notices</Popover.Heading>
            {unread > 0 && <Button size="sm" variant="ghost" onPress={readAll}>Mark all as read</Button>}
          </div>
          {error ? (
            <p className="m-0 text-[13px] text-bad">{error}</p>
          ) : items === null ? (
            <div className="grid place-items-center p-4"><Spinner size="sm" aria-label="Loading notices" /></div>
          ) : items.length === 0 ? (
            <p className="m-0 py-4 text-center text-[13px] text-mute">No notices yet.</p>
          ) : (
            <ul className="m-0 flex max-h-80 list-none flex-col gap-1 overflow-y-auto p-0">
              {items.map((n) => (
                <li key={n.id}>
                  <Button variant="ghost" fullWidth onPress={() => void open(n)} className="h-auto flex-col items-start gap-0.5 whitespace-normal px-2.5 py-2 text-left">
                    <span className="flex w-full items-center gap-2">
                      {!n.read_at && <span aria-label="Unread" className="size-2 flex-none rounded-full bg-rec" />}
                      <span className={`flex-1 text-[13px] ${n.read_at ? "font-medium text-mute2" : "font-semibold text-ink"}`}>{n.title}</span>
                      <span className="font-mono text-[11px] text-mute">{day(n.created_at)} {time(n.created_at)}</span>
                    </span>
                    {n.body && <span className="text-xs font-normal text-mute">{n.body}</span>}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
