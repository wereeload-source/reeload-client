import { Account } from "@/components/account";
import { requireProfile } from "@/lib/session";
import { MHeader, MMain } from "../header";

export default async function MyAccount() {
  const { me } = await requireProfile();
  return (
    <>
      <MHeader title="My account" subtitle={me.full_name} back="/m" />
      <MMain>
        <Account me={me} />
      </MMain>
    </>
  );
}
