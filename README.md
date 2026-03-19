# Tally — Gestion de stock pour créateurs indépendants

App React Native (Expo) pour gérer son stock sur plusieurs canaux de vente.

## Stack

- **React Native** + **Expo** (Expo Router)
- **TypeScript**
- **Supabase** (base de données, auth, storage)
- **Zustand** (état global)

## Installation

```bash
npm install
cp .env.example .env
# Remplir les variables dans .env
npx expo start
```

## Structure

```
app/
  (auth)/       # Onboarding & authentification
  (tabs)/       # App principale (5 onglets)
components/     # Composants réutilisables
constants/      # Tokens de design (couleurs, spacing...)
hooks/          # Custom hooks
lib/            # Client Supabase
stores/         # Stores Zustand
types/          # Types TypeScript globaux
```

## Branches

- `main` — production stable
- `dev` — développement quotidien
- `feature/xxx` — nouvelles fonctionnalités
