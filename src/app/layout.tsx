import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadForge CRM — Captação de leads e propostas",
  description:
    "CRM moderno para captação de leads, funil kanban, aquecimento e rotação de chips de WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="app-aurora min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#14141d",
              border: "1px solid #262636",
              color: "#ececf3",
            },
          }}
        />
      </body>
    </html>
  );
}
