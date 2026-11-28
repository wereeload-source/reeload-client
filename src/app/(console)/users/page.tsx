import { Cell, DataTable, Row } from "@/components/data-table";
import { PageBar } from "@/components/page-bar";
import { Avatar, Chip, Panel, type Tone } from "@/components/ui";
import { api, requirePage } from "@/lib/session";
import { ROLE_LABEL, type Role, type UserRow } from "@/lib/types";
import { NewUser } from "./new-user";
import { ResetPassword, ToggleUser } from "./toggle";

const ROLE_TONE: Record<Role, Tone> = { admin: "bad", sales: "info", ops: "warn", accounts: "neutral", reelmaker: "ok" };

export default async function UsersPage() {
  const { me } = await requirePage("users");
  const users = await api.get<UserRow[]>("/users");
  return (
    <>
      <PageBar title="Users" note="Disabled users cannot sign in. Passwords are stored only as secure hashes; nobody, including admins, can read them.">
        <NewUser />
      </PageBar>
      <Panel>
        <DataTable label="Users" minWidth={760} columns={[{ label: "Name" }, { label: "Role" }, { label: "Phone" }, { label: "Status" }, { label: "Actions", hidden: true, align: "end" }]}>
          {users.map((u) => (
            <Row key={u.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.full_name} />
                  <div>
                    <div className="font-semibold">{u.full_name}</div>
                    <div className="text-xs text-mute">{u.email}{u.base_city ? ` · ${u.base_city}` : ""}</div>
                  </div>
                </div>
              </Cell>
              <Cell><Chip tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Chip></Cell>
              <Cell className="font-mono text-[13px]">{u.phone}</Cell>
              <Cell>{u.active ? <Chip tone="ok">Active</Chip> : <Chip>Disabled</Chip>}</Cell>
              <Cell className="text-right">
                {u.id !== me.id && (
                  <div className="flex justify-end gap-1.5">
                    <ResetPassword id={u.id} name={u.full_name} />
                    <ToggleUser id={u.id} name={u.full_name} active={u.active} />
                  </div>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
