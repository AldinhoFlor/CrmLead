import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "@fontsource-variable/fraunces";
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
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
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
