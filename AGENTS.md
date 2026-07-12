<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# La Virgule — Guide pour les IAs

## Description du projet

Site web complet pour **La Virgule**, restaurant à Niort/Chauray (France). Application Next.js full-stack avec back-office d'administration et module de gestion du personnel.

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
| Auth employé | Cookie HMAC-SHA256 séparé (`src/lib/employee-auth.ts`) |
| Animations | Framer Motion |
| Validation | Zod 4 (utiliser `.issues` pas `.errors`) |
| Notifications | Sonner (toasts) |
| Exports | `xlsx` (Excel), `window.print()` (PDF) |

## Architecture des dossiers

```
src/
  app/
    page.tsx                   ← Page publique d'accueil
    layout.tsx                 ← Layout racine (chargement siteSettings)
    globals.css
    actions/                   ← Server Actions ("use server")
      auth.ts                  ← login (email/mdp) + loginWithPin (PIN employé) + logout
      badging.ts               ← Pointeuse : startShift, endShift, startBreak, endBreak
      personnel.ts             ← CRUD employés (createEmployee, updateEmployee, resetPin, delete)
      planning.ts              ← Planning : upsertPlannedShift, getWeekPlanning, getMonthlyShifts
      admin.ts                 ← Actions admin (menu, événements, horaires, réservations)
      reservation.ts           ← Soumission réservation client
      contact.ts               ← Formulaire de contact
    admin/
      layout.tsx               ← Redirige vers /admin/login si non authentifié
      login/page.tsx           ← Connexion admin (email/mdp) + employé (PIN)
      (dashboard)/             ← Route group protégé par requireAnyAdminAccess()
        layout.tsx
        page.tsx               ← Tableau de bord
        menu/                  ← Gestion carte et menu du jour
        horaires/              ← Horaires du restaurant
        evenements/            ← Gestion événements
        reservations/          ← Gestion réservations
        personnel/             ← Équipe + planning + historique heures
    badging/                   ← Pointeuse employé (hors auth admin)
      page.tsx                 ← Saisie code PIN
      shift/page.tsx           ← Actions shift (start/pause/end)
    api/
      export/monthly/route.ts  ← Export Excel pointages (GET ?year=&month=)
      upload/                  ← Upload images
    carte/, contact/, espaces/, evenements/, horaires/, reservation/
  components/
    admin/                     ← Composants du back-office
      admin-nav.tsx            ← Nav latérale RBAC (masquée à l'impression)
      personnel-tabs.tsx       ← Onglets Équipe / Planning / Historique
      weekly-planner.tsx       ← Calendrier hebdomadaire planning
      monthly-hours.tsx        ← Suivi heures mensuel + export
      planned-shift-dialog.tsx ← Dialog édition shift planifié
      employee-form-dialog.tsx ← Dialog création/édition employé
      employee-row.tsx         ← Ligne table employé
      personnel-manager.tsx    ← Tableau CRUD employés
      ...
    badging/
      pin-pad.tsx              ← Pavé numérique tactile
      shift-actions.tsx        ← Boutons état shift (dynamiques)
    site/                      ← Composants pages publiques
    ui/                        ← Composants shadcn/ui
  lib/
    auth.ts                    ← Session admin (cookie HMAC, requireAdmin)
    employee-auth.ts           ← Session employé (cookie HMAC, getPinIndex, requireEmployee)
    permissions.ts             ← RBAC : requirePermission, requireAnyAdminAccess, getEffectiveAccess
    prisma.ts                  ← Instance PrismaClient singleton
    config.ts                  ← Constantes restaurant (RESTAURANT, DEFAULT_HOURS)
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
- `Employee` — Employé (pinHash + pinIndex HMAC pour lookup O(1), permissions[], isActive)
- `Shift` — Shift réel pointé (startTime, endTime?, breaks[])
- `Break` — Pause dans un shift
- `PlannedShift` — Shift planifié par le manager (date @db.Date, startTime/endTime "HH:MM")
- `SiteSettings` — Singleton paramètres site (horaires affichés)
- `Space` — Salle du restaurant
- `Reservation` — Réservation client
- `Dish` / `DishSubCategory` / `MenuOfTheDay` — Carte et menus
- `Event` — Événements/soirées
- `ContactMessage` — Messages formulaire contact

## RBAC (permissions employé)

Enum `AdminPermission` : `MANAGE_MENU` | `MANAGE_EVENTS` | `MANAGE_RESERVATIONS` | `MANAGE_PERSONNEL` | `MANAGE_HOURS`

- L'admin `User` (email/mdp) a accès total implicite
- Un `Employee` avec des permissions peut accéder aux onglets admin correspondants via son PIN
- Sans permission, l'employé peut uniquement utiliser `/badging` (pointeuse)
- La nav admin filtre les onglets selon les permissions (`AdminNav` reçoit `isFullAdmin` + `permissions[]`)

## Sécurité importante

- **Ne jamais exposer `AUTH_SECRET`** — utilisé pour HMAC des cookies ET pour `getPinIndex()`
- PIN stocké en bcrypt (`pinHash`) + index HMAC unique (`pinIndex`) pour lookup O(1) sans itérer tous les employés
- Comparaison bcrypt systématique même si PIN non trouvé (protection timing attack)
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
