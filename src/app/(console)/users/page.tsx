import { redirect } from "next/navigation";
import { api, requireProfile } from "@/lib/session";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip } from "@/components/ui";
import { ROLE_LABEL, type Profile } from "@/lib/types";
import { NewUser } from "./new-user";
import { ToggleUser } from "./toggle";

export default async function UsersPage() {
  const { me } = await requireProfile();
  if (me.role !== "admin") redirect("/");
  const users = await api.get<(Profile & { kind: string | null; base_city: string | null })[]>("/users");
  return (
    <>
      <PageBar title="Users" />
      <Pane>
        <NewUser />
        <p className="text-[13px] text-mute">Disabled users cannot sign in. Give new users a temporary password and ask them to change it.</p>
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
