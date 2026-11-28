import { Clock, FolderClock, Link2, Settings2 } from "lucide-react";
import { PageBar, Pane } from "@/components/page-bar";
import { Panel } from "@/components/ui";
import { api, requirePage } from "@/lib/session";
import type { Setting } from "@/lib/types";
import { SettingField } from "./setting-field";

const GROUPS: { title: string; icon: typeof Clock; keys: { key: string; label: string; min?: number; max?: number; unit?: string }[] }[] = [
  {
    title: "File retention", icon: FolderClock,
    keys: [
      { key: "raw_retention_days", label: "Raw files are deleted after", min: 1, max: 30, unit: "days" },
      { key: "edited_retention_days", label: "Edited reels are deleted after", min: 15, max: 20, unit: "days" },
    ],
  },
  {
    title: "Client download links", icon: Link2,
    keys: [
      { key: "share_link_days", label: "Links stay valid for", min: 1, max: 30, unit: "days" },
      { key: "share_include_raw", label: "Allow raw files in client links" },
    ],
  },
  {
    title: "Deadlines and alerts", icon: Clock,
    keys: [
      { key: "raw_due_hours", label: "Raw files due after the shoot", min: 1, max: 240, unit: "hours" },
      { key: "edited_due_days", label: "Edited reels due after the shoot", min: 1, max: 30, unit: "days" },
      { key: "unassigned_flag_hours", label: "Flag unassigned jobs starting within", min: 1, max: 720, unit: "hours" },
    ],
  },
];

export default async function SettingsPage() {
  await requirePage("settings");
  const settings = await api.get<Setting[]>("/settings");
  const value = (k: string) => settings.find((s) => s.key === k)?.value;

  return (
    <>
      <PageBar title="Settings" />
      <Pane>
        <p className="flex items-center gap-1.5 text-[13px] text-mute"><Settings2 aria-hidden className="size-3.5" /> Each change is saved on its own and recorded in the audit log.</p>
        <div className="grid max-w-2xl gap-4">
          {GROUPS.map((g) => (
            <Panel key={g.title} title={g.title} icon={g.icon}>
              <div className="grid gap-3">
                {g.keys.map((k) => {
                  const v = value(k.key);
                  return v === undefined ? null : <SettingField key={k.key} name={k.key} label={k.label} value={v} min={k.min} max={k.max} unit={k.unit} />;
                })}
              </div>
            </Panel>
          ))}
        </div>
      </Pane>
    </>
  );
}
