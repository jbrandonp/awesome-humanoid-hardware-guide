#!/bin/bash
# Script d'Initialisation Automatique - Système de Santé Résilient V3.0

set -e

echo "=========================================================="
echo "🏥 Initialisation du Système de Santé Résilient V3.0"
echo "=========================================================="

# 1. Vérification des prérequis
if ! command -v node &> /dev/null
then
    echo "❌ Erreur: Node.js (v18+) n'est pas installé."
    exit 1
fi

if ! command -v docker &> /dev/null
then
    echo "❌ Erreur: Docker n'est pas installé."
    exit 1
fi

echo "✅ Prérequis validés."

# 2. Installation des dépendances NPM
echo "📦 Installation des dépendances du Monorepo (Nx)..."
npm install --legacy-peer-deps

# 3. Démarrage de l'infrastructure Docker (Postgres, Mongo, MinIO)
echo "🐳 Démarrage des bases de données..."
docker compose --file infra/docker/docker-compose.yml up -d

echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 10

# 4. Déploiement du schéma de base de données
echo "🗄️ Déploiement du schéma Prisma..."
npx prisma generate
npx prisma db push

# 5. Compilation du Frontend Desktop (React)
echo "💻 Compilation du client Desktop..."
npx nx build desktop

# 6. Compilation de l'API Backend (NestJS)
echo "🧠 Compilation de l'API principale..."
npx nx build api

echo "=========================================================="
echo "✅ Initialisation terminée avec succès !"
echo "👉 Vous pouvez maintenant lancer l'application avec :"
echo "   npm run start:all"
echo "=========================================================="
