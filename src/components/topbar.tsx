"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { initials } from "@/lib/utils";
import { logout } from "@/app/actions/auth";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/prospect": "Prospecção",
  "/import": "Importar leads",
  "/kanban": "Funil de Vendas",
  "/leads": "Leads",
  "/chips": "Chips & Aquecedor",
  "/settings": "Configurações",
};

function titleFor(pathname: string) {
  if (pathname.startsWith("/leads/")) return "Detalhe do Lead";
  return TITLES[pathname] ?? "LeadForge";
}

export function Topbar({ email }: { email: string }) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-soft bg-bg/70 px-6 backdrop-blur-xl">
      <motion.h1
        key={title}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-lg font-semibold tracking-tight"
      >
        {title}
      </motion.h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-full border border-border-soft bg-surface/60 py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-xs font-bold text-white">
            {initials(email.split("@")[0] || "U")}
          </div>
          <span className="hidden text-xs text-muted sm:inline">{email}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface/60 text-muted transition hover:border-danger/40 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
