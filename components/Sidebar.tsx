"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  PiggyBank,
  Target,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Beranda" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/analytics", icon: BarChart2, label: "Analitik" },
  { href: "/budget", icon: Target, label: "Budget" },
  { href: "/saku", icon: Wallet, label: "Saku" },
  { href: "/tabungan", icon: PiggyBank, label: "Tabungan" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 border-r border-slate-800 py-6 px-3 fixed left-0 top-0">
        <div className="flex items-center gap-2 px-3 mb-8">
          <span className="text-2xl">💰</span>
          <span className="font-bold text-lg text-white">Finansialku</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex justify-around py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors
                ${active ? "text-indigo-400" : "text-slate-500"}`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
