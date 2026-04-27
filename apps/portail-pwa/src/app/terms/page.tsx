import Link from "next/link";
import Header from "@/components/Header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Conditions d'utilisation</h1>
          <p className="text-gray-600 mt-2">Dernière mise à jour: 12 avril 2026</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptation des conditions</h2>
            <p className="text-gray-700">
              En utilisant le Portail Patient du Système de Santé Résilient, vous acceptez les présentes conditions d'utilisation.
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description du service</h2>
            <p className="text-gray-700">
              Le Portail Patient est une plateforme sécurisée qui vous permet de :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Consulter vos rendez-vous médicaux</li>
              <li>Accéder à vos prescriptions et résultats d'analyses</li>
              <li>Gérer votre dossier médical électronique</li>
              <li>Communiquer avec votre équipe soignante</li>
              <li>Effectuer des paiements en ligne</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Responsabilités de l'utilisateur</h2>
            <p className="text-gray-700">
              Vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Fournir des informations exactes et à jour</li>
              <li>Protéger vos identifiants de connexion</li>
              <li>Ne pas partager votre compte avec des tiers</li>
              <li>Utiliser le service uniquement à des fins médicales légitimes</li>
              <li>Respecter les lois et réglementations en vigueur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Limitations du service</h2>
            <p className="text-gray-700">
              Le Portail Patient ne constitue pas un service d'urgence médicale.
              En cas d'urgence, contactez immédiatement les services d'urgence (15).
              Le système peut être temporairement indisponible pour maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Propriété intellectuelle</h2>
            <p className="text-gray-700">
              L'interface, le code source et les designs du Portail Patient sont la propriété du Système de Santé Résilient.
              Vos données médicales restent votre propriété et vous en conservez le contrôle total.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Modifications des conditions</h2>
            <p className="text-gray-700">
              Nous nous réservons le droit de modifier ces conditions d'utilisation.
              Les modifications seront notifiées par email et publiées sur cette page.
              Votre utilisation continue du service après modifications vaut acceptation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Limitation de responsabilité</h2>
            <p className="text-gray-700">
              Le Système de Santé Résilient ne peut être tenu responsable :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Des erreurs médicales commises par les praticiens</li>
              <li>Des interruptions de service dues à des forces majeures</li>
              <li>Des pertes de données résultant d'une mauvaise utilisation par l'utilisateur</li>
              <li>Des décisions médicales prises sur la base des informations consultées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Loi applicable et juridiction</h2>
            <p className="text-gray-700">
              Les présentes conditions sont régies par le droit sénégalais.
              Tout litige sera soumis à la juridiction des tribunaux de Dakar.
            </p>
          </section>
        </div>

        <div className="mt-8 flex justify-between">
          <Link href="/privacy" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            ← Politique de confidentialité
          </Link>
          <Link href="/contact" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Contact →
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