import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip, Panel, type Tone } from "@/components/ui";
import { api, requirePage } from "@/lib/session";
import { ROLE_LABEL, type Role, type UserRow } from "@/lib/types";
import { NewUser } from "./new-user";
import { ResetPassword, ToggleUser } from "./toggle";

const ROLE_TONE: Record<Role, Tone> = { admin: "rec", sales: "blue", ops: "vio", accounts: "warn", reelmaker: "ok" };

export default async function UsersPage() {
  const { me } = await requirePage("users");
  const users = await api.get<UserRow[]>("/users");
  return (
    <>
      <PageBar title="Users"><NewUser /></PageBar>
      <Pane>
        <p className="text-[13px] text-mute">Disabled users cannot sign in. Passwords are stored only as secure hashes; nobody, including admins, can read them.</p>
        <Panel flush>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Status</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} />
                      <div><b>{u.full_name}</b><div className="text-[12.5px] text-mute">{u.email}{u.base_city ? ` · ${u.base_city}` : ""}</div></div>
                    </div>
                  </td>
                  <td><Chip tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Chip></td>
                  <td className="font-mono">{u.phone}</td>
                  <td>{u.active ? <Chip tone="ok">Active</Chip> : <Chip>Disabled</Chip>}</td>
                  <td className="num">
                    {u.id !== me.id && (
                      <div className="flex justify-end gap-1.5">
                        <ResetPassword id={u.id} name={u.full_name} />
                        <ToggleUser id={u.id} name={u.full_name} active={u.active} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Pane>
    </>
  );
}
