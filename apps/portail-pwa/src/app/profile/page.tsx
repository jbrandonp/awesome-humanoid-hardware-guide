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

export default function ProfilePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const token = getCookie("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      setAuthenticated(true);
      setLoading(false);
    }
  }, [router]);

  const [profile, setProfile] = useState({
    firstName: "Moussa",
    lastName: "Sarr",
    dateOfBirth: "15/08/1985",
    phone: "+221770000000",
    email: "moussa.sarr@example.com",
    address: "123 Rue de la Santé, Dakar",
    bloodGroup: "O+",
    allergies: "Pénicilline",
    emergencyContact: "Aminata Sarr - +221771111111",
  });

  const handleSave = () => {
    // Ici, on enverrait les modifications à l'API
    setEditing(false);
    alert("Profil mis à jour avec succès !");
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
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👤 Mon profil</h1>
            <p className="text-gray-600 mt-2">Informations personnelles et préférences</p>
          </div>
          <div className="flex space-x-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Modifier le profil
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profile.dateOfBirth}
                        onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.dateOfBirth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupe sanguin</label>
                    {editing ? (
                      <select
                        value={profile.bloodGroup}
                        onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                        <option>O+</option>
                        <option>O-</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.bloodGroup}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.phone}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.email}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    {editing ? (
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.address}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    {editing ? (
                      <textarea
                        value={profile.allergies}
                        onChange={(e) => setProfile({...profile, allergies: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.allergies}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact d'urgence</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{profile.emergencyContact}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Sécurité</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Mot de passe</h3>
                      <p className="text-sm text-gray-500">Dernière modification: 15/03/2026</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Changer
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Authentification à deux facteurs</h3>
                      <p className="text-sm text-gray-500">Non activée</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Activer
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Sessions actives</h3>
                      <p className="text-sm text-gray-500">2 appareils connectés</p>
                    </div>
                    <button className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">👤 Photo de profil</h3>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl text-blue-600">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </span>
                </div>
                <button className="px-4 py-2 text-sm bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                  Changer la photo
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📱 Préférences de contact</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input type="checkbox" id="sms" defaultChecked className="mr-2" />
                  <label htmlFor="sms" className="text-sm text-gray-700">SMS pour les rappels</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="whatsapp" defaultChecked className="mr-2" />
                  <label htmlFor="whatsapp" className="text-sm text-gray-700">WhatsApp pour les résultats</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="email" defaultChecked className="mr-2" />
                  <label htmlFor="email" className="text-sm text-gray-700">Email pour les factures</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="calls" className="mr-2" />
                  <label htmlFor="calls" className="text-sm text-gray-700">Appels pour les urgences</label>
                </div>
                <button className="w-full mt-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Enregistrer les préférences
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📄 Documents personnels</h3>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-left">
                  🆔 Carte d'identité
                </button>
                <button className="w-full py-2 px-4 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50 text-left">
                  🏥 Carte d'assurance
                </button>
                <button className="w-full py-2 px-4 bg-white border border-purple-600 text-purple-600 rounded hover:bg-purple-50 text-left">
                  📋 Consentements signés
                </button>
                <button className="w-full py-2 px-4 bg-white border border-gray-600 text-gray-600 rounded hover:bg-gray-50 text-left">
                  📄 Exporter toutes mes données
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">⚠️ Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-white border border-yellow-600 text-yellow-600 rounded hover:bg-yellow-50 text-left">
                  📝 Signaler une erreur
                </button>
                <button className="w-full py-2 px-4 bg-white border border-red-600 text-red-600 rounded hover:bg-red-50 text-left">
                  🗑️ Supprimer mon compte
                </button>
                <button className="w-full py-2 px-4 bg-white border border-gray-600 text-gray-600 rounded hover:bg-gray-50 text-left">
                  🔒 Révocation des consentements
                </button>
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