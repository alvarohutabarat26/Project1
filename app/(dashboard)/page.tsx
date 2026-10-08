import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const ok = await verifySession();
  if (!ok) redirect("/login");

  return <DashboardClient />;
}
