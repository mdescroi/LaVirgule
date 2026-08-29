<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# La Virgule — Guide pour les IAs

## Description du projet

Site web complet pour **La Virgule**, restaurant à Niort/Chauray (France). Application Next.js full-stack avec back-office d'administration (carte, événements, horaires, planning d'ouverture, réservations).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16.2 (App Router, Turbopack, `src/`) |
| Langage | TypeScript strict |
| CSS | Tailwind CSS v4 |
| Composants UI | shadcn/ui (preset Nova / Radix) |
| ORM | **Prisma 6** (PAS la v7 — API incompatible) |
| Base de données | PostgreSQL 16 (Docker en local, PostgreSQL natif en prod) |
| Auth admin | Cookie HMAC-SHA256 maison (`src/lib/auth.ts`) |
| Animations | Framer Motion |
| Validation | Zod 4 (utiliser `.issues` pas `.errors`) |
| Notifications | Sonner (toasts) |
| Emails | Nodemailer (SMTP via `.env`, dégradation silencieuse si absent) |

## Architecture des dossiers

```
src/
  app/
    page.tsx                   ← Page publique d'accueil
    layout.tsx                 ← Layout racine (chargement siteSettings)
    globals.css
    actions/                   ← Server Actions ("use server")
      auth.ts                  ← login (email/mdp) + logout
      admin.ts                 ← Actions admin (menu, événements, horaires, planning d'ouverture, réservations)
      reservation.ts           ← Soumission réservation client
      contact.ts               ← Formulaire de contact
    admin/
      layout.tsx               ← Redirige vers /admin/login si non authentifié
      login/page.tsx           ← Connexion admin (email/mdp)
      (dashboard)/             ← Route group protégé par requireAdmin()
        layout.tsx
        page.tsx               ← Tableau de bord
        menu/                  ← Gestion carte et menu du jour
        horaires/              ← Horaires affichés sur le site (texte libre)
        planning-ouverture/    ← Planning d'ouverture midi/soir par jour de semaine
        evenements/            ← Gestion événements
        reservations/          ← Gestion réservations
    api/
      upload/                  ← Upload images
    carte/, contact/, espaces/, evenements/, horaires/, reservation/
  components/
    admin/                     ← Composants du back-office
      admin-nav.tsx            ← Nav latérale de l'admin
      opening-schedule-form.tsx ← Formulaire planning d'ouverture (grille jour × service)
      ...
    site/                      ← Composants pages publiques
    ui/                        ← Composants shadcn/ui
  lib/
    auth.ts                    ← Session admin (cookie HMAC, requireAdmin)
    prisma.ts                  ← Instance PrismaClient singleton
    config.ts                  ← Constantes restaurant (RESTAURANT, SERVICE_SLOTS, ONLINE_SERVICE_CAP, RESERVATION_WINDOW_DAYS)
    opening-schedule.ts        ← Planning d'ouverture : lecture + isServiceOpen(date, slot)
    validations.ts             ← Schémas Zod partagés
    utils.ts                   ← cn() et helpers
    spaces.ts                  ← Logique espaces
prisma/
  schema.prisma                ← Schéma complet (voir modèles ci-dessous)
  seed.ts                      ← Données de démo (admin + espaces + plats)
  migrations/                  ← Migrations SQL versionnées
```

## Modèles Prisma (résumé)

- `User` — Admin (email + passwordHash, bcrypt)
- `SiteSettings` — Singleton paramètres site (horaires affichés)
- `WeeklyOpeningHours` — Planning d'ouverture par défaut (dayOfWeek 0-6, lunchOpen/dinnerOpen) : contrôle les réservations de table en ligne
- `Space` — Salle du restaurant
- `Reservation` — Réservation client
- `Dish` / `DishSubCategory` / `MenuOfTheDay` — Carte et menus
- `Event` — Événements/soirées
- `ContactMessage` — Messages formulaire contact

## Réservations en ligne (tables classiques)

- Horizon : `RESERVATION_WINDOW_DAYS` jours calendaires à partir d'aujourd'hui (`src/lib/config.ts`)
- Bloquées si le service (midi/soir) est fermé ce jour-là dans `WeeklyOpeningHours` (`src/lib/opening-schedule.ts`)
- Ces deux règles ne s'appliquent qu'aux tables classiques (auto-confirmées) — les demandes de groupe (`isGroup`, validées à la main) n'y sont pas soumises

## Sécurité importante

- **Ne jamais exposer `AUTH_SECRET`** — utilisé pour le HMAC du cookie de session admin
- Comparaison bcrypt systématique même si l'email n'est pas trouvé (protection timing attack)
- Zod validation sur toutes les Server Actions

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run db:up        # Lance PostgreSQL Docker
npm run db:migrate   # npx prisma migrate dev
npm run db:deploy    # npx prisma migrate deploy (prod)
npm run db:seed      # Peuple la BDD avec les données de démo
npm run db:studio    # Prisma Studio (UI BDD)
npx prisma generate  # Régénère le client TS après changement de schéma
```

## Pièges connus

- Après toute modification du schéma Prisma : `npx prisma migrate dev` **ET** `npx prisma generate`
- Si `node_modules/.prisma/client/query_engine-windows.dll.node` est verrouillé : stopper next dev avant `prisma generate`
- Zod 4 : utiliser `parsed.error.issues[0].message` (pas `.errors`)
- `lucide-react` récent : pas d'icônes de marques (Facebook/Instagram) → SVG inline
- `@db.Date` dans Prisma : les `Date` objects sont UTC midnight → toujours utiliser `T12:00:00Z` pour afficher les dates sans décalage timezone
- Ne PAS upgrader vers Prisma 7 (API incompatible)
- Ne PAS upgrader vers react-day-picker v10 (cassé avec shadcn calendar)

---

## Déploiement (VPS)

- **VPS** : `ssh root@82.29.175.32` (mot de passe dans le gestionnaire de secrets de l'équipe — NE PAS committer)
- **Process manager** : PM2 (`pm2 status`, `pm2 restart la-virgule`, `pm2 logs`)
- **Git** : le repo est cloné sur le VPS, déploiement via `git pull && npm run build && pm2 restart`
- **BDD** : PostgreSQL installé nativement sur le VPS (pas Docker en prod)

### Procédure de mise à jour en production

```bash
# Sur le VPS
cd /chemin/vers/lavirgule
git pull
npm ci
npx prisma migrate deploy   # Applique les nouvelles migrations
npx prisma generate         # Régénère le client
npm run build
pm2 restart la-virgule
```

Voir aussi `Aide_Deploiement_MaJ.md` pour le guide détaillé.
