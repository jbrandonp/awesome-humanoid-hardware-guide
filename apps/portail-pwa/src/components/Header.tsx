"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            Portail Patient
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/appointments" className="text-gray-700 hover:text-blue-600 font-medium">
              📅 Rendez-vous
            </Link>
            <Link href="/prescriptions" className="text-gray-700 hover:text-blue-600 font-medium">
              💊 Prescriptions
            </Link>
            <Link href="/medical-records" className="text-gray-700 hover:text-blue-600 font-medium">
              📁 Dossier médical
            </Link>
            <Link href="/billing" className="text-gray-700 hover:text-blue-600 font-medium">
              💰 Facturation
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
              👤 Profil
            </Link>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}