"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Smartphone,
  Settings,
  Radar,
  Upload,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospect", label: "Prospecção", icon: Radar },
  { href: "/import", label: "Importar CSV", icon: Upload },
  { href: "/kanban", label: "Funil (Kanban)", icon: KanbanSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/chips", label: "Chips & Aquecedor", icon: Smartphone },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-soft bg-bg-soft/60 p-4 backdrop-blur-xl md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2 pt-2">
        <div className="btn-brand flex h-9 w-9 items-center justify-center rounded-xl">
          <Zap className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight">
          Lead<span className="gradient-text">Forge</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-white"
                  : "text-muted hover:bg-surface hover:text-fg"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-brand/25 to-brand-2/20 ring-1 ring-brand/40"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-brand" : "text-muted group-hover:text-fg"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border-soft bg-surface/50 p-3 text-xs text-muted">
        <p className="font-medium text-fg">Fase 1 · CRM</p>
        <p className="mt-1 leading-relaxed">
          Geração de sites e disparo via Evolution/n8n entram nas próximas fases.
        </p>
      </div>
    </aside>
  );
}
