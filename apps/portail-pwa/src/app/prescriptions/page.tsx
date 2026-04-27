"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function PrescriptionsPage() {
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

  const prescriptions = [
    { id: 1, name: "Paracétamol 500mg", dosage: "1 comprimé", frequency: "3 fois par jour", endDate: "30/04/2026", status: "Active", doctor: "Dr. Diallo" },
    { id: 2, name: "Amoxicilline 250mg", dosage: "2 comprimés", frequency: "2 fois par jour", endDate: "28/04/2026", status: "Active", doctor: "Dr. Mbaye" },
    { id: 3, name: "Ibuprofène 400mg", dosage: "1 comprimé", frequency: "Au besoin", endDate: "25/04/2026", status: "Terminée", doctor: "Dr. Ndiaye" },
    { id: 4, name: "Losartan 50mg", dosage: "1 comprimé", frequency: "1 fois par jour", endDate: "15/05/2026", status: "Active", doctor: "Dr. Sarr" },
    { id: 5, name: "Metformine 850mg", dosage: "1 comprimé", frequency: "2 fois par jour", endDate: "10/05/2026", status: "Active", doctor: "Dr. Diallo" },
  ];

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
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💊 Mes prescriptions</h1>
          <p className="text-gray-600 mt-2">Vos médicaments prescrits et traitements en cours</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Prescriptions actives</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {prescriptions.filter(p => p.status === "Active").map((prescription) => (
                  <div key={prescription.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{prescription.name}</h3>
                        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Posologie:</span> {prescription.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Fréquence:</span> {prescription.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Jusqu'au:</span> {prescription.endDate}
                          </div>
                          <div>
                            <span className="font-medium">Prescrit par:</span> {prescription.doctor}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Renouveler
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Historique des prescriptions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {prescriptions.filter(p => p.status !== "Active").map((prescription) => (
                  <div key={prescription.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{prescription.name}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          {prescription.dosage} · {prescription.frequency} · Jusqu'au {prescription.endDate}
                        </div>
                      </div>
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                        Terminée
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Informations importantes</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-900">Interactions médicamenteuses</h4>
                  <p className="text-sm text-blue-700 mt-1">Aucune interaction détectée entre vos médicaments actuels.</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <h4 className="font-medium text-yellow-900">Allergies connues</h4>
                  <p className="text-sm text-yellow-700 mt-1">Pénicilline (réaction légère)</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <h4 className="font-medium text-green-900">Pharmacie de référence</h4>
                  <p className="text-sm text-green-700 mt-1">Pharmacie du Centre · Ouvert 7j/7 · 33 987 65 43</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📄 Télécharger</h3>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-left">
                  📋 Ordonnance actuelle (PDF)
                </button>
                <button className="w-full py-2 px-4 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50 text-left">
                  💊 Liste des médicaments (Excel)
                </button>
                <button className="w-full py-2 px-4 bg-white border border-purple-600 text-purple-600 rounded hover:bg-purple-50 text-left">
                  🏥 Plan de traitement
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🆘 En cas d'oubli</h3>
              <p className="text-sm text-gray-600 mb-3">
                Si vous avez oublié de prendre un médicament :
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Si moins de 2h de retard, prenez-le immédiatement</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Si plus de 2h, sautez la dose et continuez normalement</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Ne doublez jamais la dose</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>En cas de doute, contactez votre médecin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2026 Système de Santé Résilient. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}