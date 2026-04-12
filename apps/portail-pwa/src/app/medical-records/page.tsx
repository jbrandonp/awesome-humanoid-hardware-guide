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

export default function MedicalRecordsPage() {
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

  const documents = [
    { id: 1, type: "Analyse sanguine", date: "15/03/2026", category: "Laboratoire", status: "Disponible", doctor: "Dr. Diallo", size: "2.3 MB" },
    { id: 2, type: "Radiographie thoracique", date: "10/03/2026", category: "Imagerie", status: "Disponible", doctor: "Dr. Sarr", size: "15.7 MB" },
    { id: 3, type: "Échographie abdominale", date: "05/03/2026", category: "Imagerie", status: "En attente", doctor: "Dr. Ndiaye", size: "12.1 MB" },
    { id: 4, type: "Compte-rendu consultation", date: "28/02/2026", category: "Rapport", status: "Disponible", doctor: "Dr. Mbaye", size: "0.5 MB" },
    { id: 5, type: "ECG", date: "20/02/2026", category: "Cardiologie", status: "Disponible", doctor: "Dr. Ndiaye", size: "3.8 MB" },
    { id: 6, type: "IRM cérébrale", date: "15/02/2026", category: "Imagerie", status: "Disponible", doctor: "Dr. Sarr", size: "45.2 MB" },
    { id: 7, type: "Bilan lipidique", date: "10/02/2026", category: "Laboratoire", status: "Disponible", doctor: "Dr. Diallo", size: "1.1 MB" },
    { id: 8, type: "Endoscopie", date: "05/02/2026", category: "Rapport", status: "Disponible", doctor: "Dr. Mbaye", size: "8.9 MB" },
  ];

  const categories = [...new Set(documents.map(d => d.category))];

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
          <h1 className="text-3xl font-bold text-gray-900">📁 Dossier médical</h1>
          <p className="text-gray-600 mt-2">Accédez à tous vos documents et résultats médicaux</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tous les documents</h2>
                <div className="flex space-x-2">
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>Trier par date</option>
                    <option>Trier par type</option>
                    <option>Trier par médecin</option>
                  </select>
                  <button className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    + Ajouter un document
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${
                          doc.category === "Laboratoire" ? "bg-blue-100" :
                          doc.category === "Imagerie" ? "bg-purple-100" :
                          doc.category === "Cardiologie" ? "bg-red-100" :
                          "bg-green-100"
                        }`}>
                          {doc.category === "Laboratoire" && "🧪"}
                          {doc.category === "Imagerie" && "📷"}
                          {doc.category === "Cardiologie" && "❤️"}
                          {doc.category === "Rapport" && "📄"}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.type}</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="mr-4">📅 {doc.date}</span>
                            <span className="mr-4">👨‍⚕️ {doc.doctor}</span>
                            <span>💾 {doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          doc.status === "Disponible" ? "bg-green-100 text-green-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {doc.status}
                        </span>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Voir
                          </button>
                          <button className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                            Télécharger
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Résumé médical</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900">Informations générales</h3>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      <li>Groupe sanguin: O+</li>
                      <li>Allergies: Pénicilline</li>
                      <li>Médicaments chroniques: 2</li>
                      <li>Dernière consultation: 15/03/2026</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-900">Statistiques</h3>
                    <ul className="mt-2 space-y-1 text-sm text-green-700">
                      <li>Documents totaux: {documents.length}</li>
                      <li>Analyses sanguines: 3</li>
                      <li>Examens d'imagerie: 4</li>
                      <li>Consultations cette année: 5</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-medium text-purple-900">Accès</h3>
                    <ul className="mt-2 space-y-1 text-sm text-purple-700">
                      <li>Partage autorisé: 3 médecins</li>
                      <li>Dernière mise à jour: 15/03/2026</li>
                      <li>Export disponible: PDF, JSON</li>
                      <li>Stockage sécurisé: Oui</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📂 Par catégorie</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const count = documents.filter(d => d.category === category).length;
                  const icon = category === "Laboratoire" ? "🧪" :
                              category === "Imagerie" ? "📷" :
                              category === "Cardiologie" ? "❤️" : "📄";
                  return (
                    <button
                      key={category}
                      className="w-full flex justify-between items-center p-3 text-left rounded hover:bg-gray-50"
                    >
                      <span>
                        {icon} {category}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-200 rounded">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🔒 Partage sécurisé</h3>
              <p className="text-sm text-gray-600 mb-4">
                Vous pouvez partager votre dossier avec d'autres professionnels de santé.
              </p>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                  📧 Partager par email
                </button>
                <button className="w-full py-2 px-4 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50">
                  🔗 Générer un lien sécurisé
                </button>
                <button className="w-full py-2 px-4 bg-white border border-purple-600 text-purple-600 rounded hover:bg-purple-50">
                  📄 Exporter en PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">⚠️ Consignes importantes</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Conservez une copie de vos documents importants</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Les résultats sont disponibles sous 48h maximum</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>En cas d'urgence, présentez votre QR code patient</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Vos données sont chiffrées et protégées</span>
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