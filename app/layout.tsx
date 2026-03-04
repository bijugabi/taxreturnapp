import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Return at Scale",
  description: "Processamento de documentos contábeis para MTD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
