# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run web         # Run in browser
```

To deploy Supabase Edge Functions:
```bash
supabase functions deploy etsy-oauth
supabase functions deploy etsy-sync
```

There are no lint or test scripts configured.

## Environment

Requires a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase Edge Functions require secrets: `ETSY_API_KEY`, `ETSY_SHARED_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Architecture

**Tally** is a stock management app for independent creators selling across multiple sales channels (Etsy, WooCommerce, physical stores, markets). The UI is in French.

**Tech stack:** React Native 0.81 + Expo 54, TypeScript, Zustand (state), Supabase (Postgres + Auth + Storage), Expo Router (file-based routing), Deno Edge Functions.

### Navigation

File-based routing via Expo Router. Two route groups:
- `app/(auth)/` — unauthenticated screens: `welcome`, `login`, `signup`
- `app/(tabs)/` — 5-tab authenticated app: Dashboard, Products, Stock, Channels, Settings

Root layout (`app/_layout.tsx`) checks `isAuthenticated` from `useAuthStore` and redirects accordingly.

### State Management

Four Zustand stores in `stores/`:
- `useAuthStore` — user session, `signIn/signUp/signOut/fetchUser`
- `useProductStore` — product catalog; `totalStock` is calculated client-side by summing `stock_entries` per variant
- `useStockStore` — stock movements; `addMovement()` auto-signs quantity (negative for sales/losses/transfers)
- `useChannelStore` — sales channels with soft-delete (`is_active: false`)

### Database Schema (Supabase)

Tables: `users`, `products`, `variants`, `channels`, `stock_entries`, `sync_logs`.

Stock is **event-sourced**: there is no stored stock count. Current stock for a variant = sum of all `stock_entries.quantity` for that variant (positive = in, negative = out). Types: `sale | restock | adjustment | transfer | loss`.

### Supabase Edge Functions

- `etsy-oauth/` — OAuth 2.0 PKCE flow: generates auth URL (stores verifier/state in channel row), then exchanges code for token and saves it back
- `etsy-sync/` — runs hourly; fetches paid Etsy receipts since last sync, maps SKU → variant, inserts `stock_entries` (idempotent via `receipt_id`)

The Etsy sync uses **OAuth 1.0 with HMAC-SHA1** signing (legacy Etsy API v2).

### Design System

Single source of truth: `constants/theme.ts`. No external UI library — all components are custom React Native. Key colors: primary `#1A1917` (dark), success `#1D6648` (green), warning `#9A4E10` (orange), critical `#B83232` (red). Border radii and spacing are defined as named tokens (sm/md/lg/xl/full).

### Images

Product images use `expo-image-picker` (camera + gallery) via the `ProductImagePicker` component and are stored in Supabase Storage.
