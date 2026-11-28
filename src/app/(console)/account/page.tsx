import { Account } from "@/components/account";
import { PageBar } from "@/components/page-bar";
import { requireProfile } from "@/lib/session";

export default async function AccountPage() {
  const { me } = await requireProfile();
  return (
    <>
      <PageBar title="My account" />
      <Account me={me} />
    </>
  );
}
