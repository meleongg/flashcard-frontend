import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountClient } from "./account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return <AccountClient session={session} />;
}
