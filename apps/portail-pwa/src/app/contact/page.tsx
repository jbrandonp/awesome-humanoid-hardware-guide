"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler l'envoi
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contactez-nous</h1>
          <p className="text-gray-600 mt-2">Une question ? Un problème ? Nous sommes là pour vous aider.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">✉️ Formulaire de contact</h2>
              
              {submitted ? (
                <div className="p-6 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full mr-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900">Message envoyé !</h3>
                      <p className="text-green-700 mt-1">
                        Merci de nous avoir contactés. Nous vous répondrons dans les 24 heures.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="technical">Problème technique</option>
                      <option value="medical">Question médicale</option>
                      <option value="billing">Facturation</option>
                      <option value="privacy">Confidentialité des données</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📍 Nos coordonnées</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">📞 Téléphone</h4>
                  <p className="text-gray-600 mt-1">33 123 45 67</p>
                  <p className="text-sm text-gray-500">Lun-Ven: 8h-18h, Sam: 8h-13h</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">📧 Email</h4>
                  <p className="text-gray-600 mt-1">contact@sante-resiliente.sn</p>
                  <p className="text-sm text-gray-500">Réponse sous 24h</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">🏢 Adresse</h4>
                  <p className="text-gray-600 mt-1">
                    123 Rue de la Santé<br />
                    Dakar, Sénégal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🚨 Urgences</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded">
                  <h4 className="font-medium text-red-900">SAMU</h4>
                  <p className="text-red-700">15</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <h4 className="font-medium text-orange-900">Centre antipoison</h4>
                  <p className="text-orange-700">33 839 10 10</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <h4 className="font-medium text-yellow-900">Urgences psychiatriques</h4>
                  <p className="text-yellow-700">33 821 11 11</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Départements</h3>
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-blue-50 rounded hover:bg-blue-100">
                  <h4 className="font-medium text-blue-900">Support technique</h4>
                  <p className="text-sm text-blue-700">support@sante-resiliente.sn</p>
                </button>
                <button className="w-full p-3 text-left bg-green-50 rounded hover:bg-green-100">
                  <h4 className="font-medium text-green-900">Facturation</h4>
                  <p className="text-sm text-green-700">facturation@sante-resiliente.sn</p>
                </button>
                <button className="w-full p-3 text-left bg-purple-50 rounded hover:bg-purple-100">
                  <h4 className="font-medium text-purple-900">Protection des données</h4>
                  <p className="text-sm text-purple-700">dpo@sante-resiliente.sn</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">💬 FAQ rapide</h3>
              <div className="space-y-3">
                <Link href="/privacy" className="block p-3 text-left bg-gray-50 rounded hover:bg-gray-100">
                  <h4 className="font-medium text-gray-900">Comment sont protégées mes données ?</h4>
                </Link>
                <Link href="/appointments" className="block p-3 text-left bg-gray-50 rounded hover:bg-gray-100">
                  <h4 className="font-medium text-gray-900">Comment annuler un rendez-vous ?</h4>
                </Link>
                <Link href="/billing" className="block p-3 text-left bg-gray-50 rounded hover:bg-gray-100">
                  <h4 className="font-medium text-gray-900">Comment obtenir une facture ?</h4>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2026 Système de Santé Résilient. Tous droits réservés.</p>
          <div className="mt-2">
            <Link href="/privacy" className="text-blue-600 hover:underline mx-2">Politique de confidentialité</Link>
            <Link href="/terms" className="text-blue-600 hover:underline mx-2">Conditions d'utilisation</Link>
            <Link href="/contact" className="text-blue-600 hover:underline mx-2">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}