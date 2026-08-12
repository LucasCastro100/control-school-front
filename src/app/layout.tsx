import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Control Schools",
  description: "Sistema de gerenciamento escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
          <Toaster richColors closeButton position="bottom-right" />
        </TooltipProvider>

        {/* Componentes de monitoramento da Vercel */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}