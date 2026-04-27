"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      setAuthenticated(true);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portail Patient</h1>
            <p className="text-gray-600">Bienvenue sur votre espace santé</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Rendez-vous */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📅 Rendez-vous</h2>
            <p className="text-gray-600 mb-4">Gérez vos rendez-vous médicaux</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <p className="font-medium">Dr. Diallo</p>
                  <p className="text-sm text-gray-500">Aujourd'hui, 14:30</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Confirmé</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Dr. Mbaye</p>
                  <p className="text-sm text-gray-500">Demain, 10:00</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">En attente</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Prendre rendez-vous
            </button>
          </div>

          {/* Card: Prescriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💊 Prescriptions</h2>
            <p className="text-gray-600 mb-4">Vos médicaments prescrits</p>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded">
                <p className="font-medium">Paracétamol 500mg</p>
                <p className="text-sm text-gray-500">1 comprimé, 3 fois par jour</p>
                <p className="text-sm text-gray-500">Jusqu'au 30/04/2026</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="font-medium">Amoxicilline 250mg</p>
                <p className="text-sm text-gray-500">2 comprimés, 2 fois par jour</p>
                <p className="text-sm text-gray-500">Jusqu'au 28/04/2026</p>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Voir toutes les prescriptions
            </button>
          </div>

          {/* Card: Dossiers médicaux */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📁 Dossiers médicaux</h2>
            <p className="text-gray-600 mb-4">Accédez à vos résultats et documents</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <div>
                  <p className="font-medium">Analyse sanguine</p>
                  <p className="text-sm text-gray-500">15/03/2026</p>
                </div>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">Télécharger</button>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <div>
                  <p className="font-medium">Radiographie thoracique</p>
                  <p className="text-sm text-gray-500">10/03/2026</p>
                </div>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">Voir</button>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Ouvrir le dossier complet
            </button>
          </div>

          {/* Card: Profil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Profil</h2>
            <p className="text-gray-600 mb-4">Informations personnelles</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom complet:</span>
                <span className="font-medium">Moussa Sarr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date de naissance:</span>
                <span className="font-medium">15/08/1985</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Groupe sanguin:</span>
                <span className="font-medium">O+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Allergies:</span>
                <span className="font-medium">Pénicilline</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Modifier le profil
            </button>
          </div>

          {/* Card: Facturation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💰 Facturation</h2>
            <p className="text-gray-600 mb-4">Suivez vos paiements et factures</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <p className="font-medium">Consultation générale</p>
                  <p className="text-sm text-gray-500">12/04/2026</p>
                </div>
                <span className="font-bold">15 000 FCFA</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <p className="font-medium">Analyse laboratoire</p>
                  <p className="text-sm text-gray-500">10/04/2026</p>
                </div>
                <span className="font-bold">25 000 FCFA</span>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Payer en ligne
            </button>
          </div>

          {/* Card: Urgences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🆘 Urgences</h2>
            <p className="text-gray-600 mb-4">Contacts et services d'urgence</p>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded">
                <p className="font-medium">SAMU</p>
                <p className="text-gray-600">15</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="font-medium">Centre antipoison</p>
                <p className="text-gray-600">33 839 10 10</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="font-medium">Votre médecin traitant</p>
                <p className="text-gray-600">Dr. Diallo - 77 123 45 67</p>
              </div>
            </div>
            <button className="mt-4 w-full py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Appeler les urgences
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2026 Système de Santé Résilient. Tous droits réservés.</p>
          <p className="mt-2">
            <Link href="/privacy" className="text-blue-600 hover:underline">Politique de confidentialité</Link>
            {" · "}
            <Link href="/terms" className="text-blue-600 hover:underline">Conditions d'utilisation</Link>
            {" · "}
            <Link href="/contact" className="text-blue-600 hover:underline">Contact</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
