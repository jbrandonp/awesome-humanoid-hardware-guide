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

export default function AppointmentsPage() {
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

  const appointments = [
    { id: 1, doctor: "Dr. Diallo", date: "Aujourd'hui, 14:30", status: "Confirmé", type: "Consultation générale" },
    { id: 2, doctor: "Dr. Mbaye", date: "Demain, 10:00", status: "En attente", type: "Suivi" },
    { id: 3, doctor: "Dr. Ndiaye", date: "15/04/2026, 09:15", status: "Confirmé", type: "Spécialiste" },
    { id: 4, doctor: "Dr. Sarr", date: "20/04/2026, 11:30", status: "Annulé", type: "Radio" },
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
          <h1 className="text-3xl font-bold text-gray-900">📅 Mes rendez-vous</h1>
          <p className="text-gray-600 mt-2">Gérez vos rendez-vous médicaux</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Rendez-vous à venir</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {appointments.filter(a => a.status !== "Annulé").map((appointment) => (
                  <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-500">{appointment.type}</p>
                        <p className="text-sm text-gray-500">{appointment.date}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          appointment.status === "Confirmé" ? "bg-green-100 text-green-800" :
                          appointment.status === "En attente" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {appointment.status}
                        </span>
                        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Historique</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {appointments.filter(a => a.status === "Annulé").map((appointment) => (
                  <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-500">{appointment.type}</p>
                        <p className="text-sm text-gray-500">{appointment.date}</p>
                      </div>
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                        Annulé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Prendre un rendez-vous</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de consultation</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Consultation générale</option>
                    <option>Suivi</option>
                    <option>Spécialiste</option>
                    <option>Radio / Imagerie</option>
                    <option>Analyse laboratoire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date souhaitée</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médecin préféré</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Dr. Diallo (Généraliste)</option>
                    <option>Dr. Mbaye (Pédiatre)</option>
                    <option>Dr. Ndiaye (Cardiologue)</option>
                    <option>Dr. Sarr (Radiologue)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                  Rechercher des créneaux
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📞 Contacts rapides</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-medium">Secrétariat</span>
                  <span className="text-blue-600">33 123 45 67</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Urgences</span>
                  <span className="text-green-600">15</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="font-medium">Centre anti-poison</span>
                  <span className="text-yellow-600">33 839 10 10</span>
                </div>
              </div>
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