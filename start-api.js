#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de l\'API Système de Santé Résilient...');
console.log('📁 Répertoire:', __dirname);

// Configuration pour ts-node
process.env.TS_NODE_PROJECT = path.join(__dirname, 'apps/api/tsconfig.dev.json');
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.TS_NODE_FILES = 'true';
process.env.TS_NODE_IGNORE = 'false';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  target: 'es2020',
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  skipLibCheck: true
});

// Démarrer l'API avec ts-node
const tsNodePath = require.resolve('ts-node/register');
const mainPath = path.join(__dirname, 'apps/api/src/main.ts');

const child = spawn('node', ['-r', tsNodePath, mainPath], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('error', (err) => {
  console.error('❌ Erreur lors du démarrage:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`📴 API arrêtée avec code: ${code}`);
  process.exit(code);
});

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'API...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de l\'API (SIGTERM)...');
  child.kill('SIGTERM');
});