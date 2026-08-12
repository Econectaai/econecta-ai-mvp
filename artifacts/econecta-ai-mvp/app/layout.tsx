import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Econecta AI",
  description: "Sua IA para encontrar promoções e descontos perto de você.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
