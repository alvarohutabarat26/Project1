import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ok = await verifySession();
  if (!ok) redirect("/login");

  return <DashboardClient />;
}
