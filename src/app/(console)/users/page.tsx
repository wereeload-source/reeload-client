import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip } from "@/components/ui";
import { ROLE_LABEL, type Profile } from "@/lib/types";
import { ToggleUser } from "./toggle";

export default async function UsersPage() {
  const { supabase, me } = await requireProfile();
  if (me.role !== "admin") redirect("/");
  const { data } = await supabase.from("profiles").select("*").order("role").order("full_name");
  const users = (data ?? []) as Profile[];
  return (
    <>
      <PageBar title="Users" />
      <Pane>
        <p className="text-[13px] text-mute">Inviting new users needs the admin invite function (see the server README). Disabled users cannot sign in.</p>
        <div className="card px-2 py-1.5">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Status</th><th /></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id}>
                <td><div className="flex items-center gap-2.5"><Avatar name={u.full_name} /><div><b>{u.full_name}</b><div className="text-[12.5px] text-mute">{u.email}</div></div></div></td>
                <td><Chip tone={u.role === "admin" ? "rec" : u.role === "sales" ? "blue" : u.role === "ops" ? "vio" : u.role === "accounts" ? "warn" : "ok"}>{ROLE_LABEL[u.role]}</Chip></td>
                <td className="font-mono">{u.phone}</td>
                <td>{u.active ? <Chip tone="ok">Active</Chip> : <Chip>Disabled</Chip>}</td>
                <td className="num">{u.id !== me.id && <ToggleUser id={u.id} active={u.active} />}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Pane>
    </>
  );
}
