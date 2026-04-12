import Link from "next/link";
import Header from "@/components/Header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="text-gray-600 mt-2">Dernière mise à jour: 12 avril 2026</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Collecte des données</h2>
            <p className="text-gray-700">
              Le Système de Santé Résilient collecte uniquement les données médicales nécessaires à votre prise en charge.
              Cela inclut vos informations personnelles (nom, date de naissance, coordonnées), vos données de santé
              (diagnostics, prescriptions, résultats d'analyses), et les données de connexion (logs d'accès).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Utilisation des données</h2>
            <p className="text-gray-700">
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Votre prise en charge médicale</li>
              <li>La coordination entre professionnels de santé</li>
              <li>La facturation et le remboursement</li>
              <li>La recherche médicale anonymisée (avec votre consentement explicite)</li>
              <li>L'amélioration de la qualité des soins</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Protection des données</h2>
            <p className="text-gray-700">
              Nous appliquons des mesures de sécurité strictes conformes aux réglementations HIPAA et DPDPA :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Chiffrement de bout en bout (AES-256)</li>
              <li>Stockage local avec synchronisation optionnelle</li>
              <li>Audit logs de toutes les accès</li>
              <li>Pseudonymisation pour la recherche</li>
              <li>Backups chiffrés réguliers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Partage des données</h2>
            <p className="text-gray-700">
              Vos données ne sont partagées qu'avec votre consentement explicite, sauf dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Urgence médicale nécessitant un transfert</li>
              <li>Obligation légale (requisition judiciaire)</li>
              <li>Échange avec votre assurance maladie</li>
              <li>Coordination avec un spécialiste référent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Vos droits</h2>
            <p className="text-gray-700">
              Conformément au RGPD et à la DPDPA, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (dans les limites légales)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Conservation</h2>
            <p className="text-gray-700">
              Vos données médicales sont conservées pendant la durée légale requise (généralement 30 ans après le dernier contact).
              Les données de connexion sont conservées 12 mois. Vous pouvez demander l'anonymisation anticipée.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
            <p className="text-gray-700">
              Pour toute question concernant cette politique ou l'exercice de vos droits, contactez notre Délégué à la Protection des Données :
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="font-medium">Dr. Fatou Ndiaye</p>
              <p>📧 dpo@sante-resiliente.sn</p>
              <p>📞 +221 33 987 65 43</p>
              <p>📍 456 Avenue de la Santé, Dakar, Sénégal</p>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-between">
          <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            ← Retour à l'accueil
          </Link>
          <Link href="/terms" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Conditions d'utilisation →
          </Link>
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