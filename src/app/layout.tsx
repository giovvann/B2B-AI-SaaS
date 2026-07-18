import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReminderDock } from "@/app/components/ReminderDock";
import { SyncProvider } from "@/components/SyncProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Veliora",
    template: "%s | Veliora",
  },
  description: "Veliora - El sistema inteligente para boutiques de ropa. Controla inventario, ventas y tallas con IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SyncProvider>{children}</SyncProvider>
          <ReminderDock />
        </ThemeProvider>
      </body>
    </html>
  );
}