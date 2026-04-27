import type { Metadata } from "next";
import "./globals.css";

// Polices désactivées temporairement pour éviter les erreurs Windows/ESM avec Node.js v24
// Utiliser les polices système par défaut
const inter = { variable: "" };
const robotoMono = { variable: "" };

export const metadata: Metadata = {
  title: "Portail Patient — Système Santé",
  description: "Portail patient sécurisé pour la connexion sans mot de passe via OTP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
       className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
