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

export default function BillingPage() {
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

  const invoices = [
    { id: "INV-2026-045", date: "12/04/2026", description: "Consultation générale", amount: 15000, status: "Impayée", dueDate: "26/04/2026" },
    { id: "INV-2026-044", date: "10/04/2026", description: "Analyse laboratoire", amount: 25000, status: "Payée", dueDate: "24/04/2026" },
    { id: "INV-2026-043", date: "05/04/2026", description: "Radiographie", amount: 35000, status: "Payée", dueDate: "19/04/2026" },
    { id: "INV-2026-042", date: "01/04/2026", description: "Médicaments", amount: 12000, status: "Payée", dueDate: "15/04/2026" },
    { id: "INV-2026-041", date: "28/03/2026", description: "Échographie", amount: 45000, status: "Payée", dueDate: "11/04/2026" },
  ];

  const payments = [
    { id: "PAY-2026-023", date: "11/04/2026", amount: 25000, method: "Carte bancaire", invoiceId: "INV-2026-044" },
    { id: "PAY-2026-022", date: "08/04/2026", amount: 35000, method: "Mobile Money", invoiceId: "INV-2026-043" },
    { id: "PAY-2026-021", date: "03/04/2026", amount: 12000, method: "Espèces", invoiceId: "INV-2026-042" },
    { id: "PAY-2026-020", date: "30/03/2026", amount: 45000, method: "Carte bancaire", invoiceId: "INV-2026-041" },
  ];

  const totalPending = invoices.filter(i => i.status === "Impayée").reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Payée").reduce((sum, i) => sum + i.amount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">💰 Facturation</h1>
          <p className="text-gray-600 mt-2">Gérez vos factures et paiements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg mr-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">À régler</p>
                    <p className="text-2xl font-bold">{totalPending.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Payer maintenant
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payé ce mois</p>
                    <p className="text-2xl font-bold">{totalPaid.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Voir reçus
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Factures en attente</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Télécharger toutes
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {invoices.filter(i => i.status === "Impayée").map((invoice) => (
                  <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{invoice.description}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="mr-4">📅 {invoice.date}</span>
                          <span className="mr-4">📄 {invoice.id}</span>
                          <span>📅 Échéance: {invoice.dueDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold">{invoice.amount.toLocaleString()} FCFA</span>
                        <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                          Impayée
                        </span>
                        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Payer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Historique des paiements</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">Paiement {payment.id}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="mr-4">📅 {payment.date}</span>
                          <span className="mr-4">💳 {payment.method}</span>
                          <span>📄 Facture: {payment.invoiceId}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold">{payment.amount.toLocaleString()} FCFA</span>
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                          Confirmé
                        </span>
                        <button className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                          Reçu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">💳 Payer une facture</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de facture</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sélectionner une facture</option>
                    {invoices.filter(i => i.status === "Impayée").map(i => (
                      <option key={i.id}>{i.id} - {i.description} ({i.amount.toLocaleString()} FCFA)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moyen de paiement</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Carte bancaire</option>
                    <option>Mobile Money</option>
                    <option>Espèces</option>
                    <option>Virement bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="15000" />
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                  Procéder au paiement
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📄 Documents</h3>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-left">
                  📋 Factures détaillées (PDF)
                </button>
                <button className="w-full py-2 px-4 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50 text-left">
                  🧾 Reçus de paiement
                </button>
                <button className="w-full py-2 px-4 bg-white border border-purple-600 text-purple-600 rounded hover:bg-purple-50 text-left">
                  📊 Historique financier
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">ℹ️ Informations</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-900">Assurance maladie</h4>
                  <p className="text-sm text-blue-700 mt-1">Votre assureur: CNSS · Couverture: 80%</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <h4 className="font-medium text-yellow-900">Délais de paiement</h4>
                  <p className="text-sm text-yellow-700 mt-1">Les factures sont à régler sous 15 jours</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <h4 className="font-medium text-green-900">Contact facturation</h4>
                  <p className="text-sm text-green-700 mt-1">Service comptable · 33 765 43 21</p>
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