Updated todo list

Laisse-moi d'abord regarder ton docker-compose et ton .env pour coller au maximum à ta config réelle.  

Read [](file:///c%3A/Users/maxde/Documents/LaVirgule/docker-compose.yml)

Read [](file:///c%3A/Users/maxde/Documents/LaVirgule/prisma/seed.ts#1-1), lines 1 to 80

Bonne nouvelle : ton docker-compose.yml utilise déjà un **named volume** (`lavirgule_pgdata`). Voilà le tuto.

---

## Prisma + Docker — Comment ça marche chez toi

### 1. Le volume Docker : la donnée persiste entre `down/up`

```
volumes:
  lavirgule_pgdata:   ← c'est ça qui sauvegarde la BDD
```

Avec un **named volume** (comme tu as), la distinction est :

| Commande | Effet sur les données |
|---|---|
| `docker compose down` | ✅ **Données conservées** (le volume reste) |
| `docker compose down -v` | ❌ **Données effacées** (supprime le volume) |
| `docker compose up -d` | ✅ Repart depuis le volume existant |

Donc `down` puis `up` normal ne détruit rien. **`-v` est le seul danger.**

---

### 2. Les 3 couches de Prisma — toujours les garder en sync

```
schéma (schema.prisma)
       ↕  prisma migrate dev/deploy
Base de données (PostgreSQL)
       ↕  prisma generate
Client TypeScript (node_modules/.prisma)
```

Si une couche est désynchronisée, tu as les erreurs que tu as vues. Le checklist à chaque changement d'environnement :

```powershell
# 1. S'assurer que la BDD tourne
docker compose up -d

# 2. Appliquer les migrations en attente (sync schéma → BDD)
npx prisma migrate deploy        # prod / CI
# OU
npx prisma migrate dev           # local (peut créer une nouvelle migration)

# 3. Régénérer le client TypeScript (sync schéma → code)
npx prisma generate

# 4. Peupler avec les données de base si BDD vide
npm run db:seed
```

---

### 3. Quand utiliser `migrate dev` vs `migrate deploy`

| Commande | Quand |
|---|---|
| `migrate dev` | **Local** — tu changes le schéma, Prisma crée la migration SQL |
| `migrate deploy` | **Prod / CI / nouveau poste** — applique les migrations existantes sans rien créer |
| `generate` | **Après tout changement de schéma**, pour mettre à jour le client TS |

---

### 4. Workflow type : tu modifies le schéma

```
1. Éditer prisma/schema.prisma
2. npx prisma migrate dev --name nom_du_changement
   → crée prisma/migrations/xxx_nom_du_changement/migration.sql
   → applique à la BDD locale
   → régénère le client automatiquement
3. Committer les fichiers migration.sql avec le reste du code
```

---

### 5. Workflow type : tu arrives sur un nouveau poste

```
1. git clone ...
2. cp .env.example .env  (ou récupérer le .env)
3. docker compose up -d
4. npx prisma migrate deploy   (applique toutes les migrations SQL)
5. npm run db:seed             (optionnel : données de base)
6. npm run dev
```

---

### 6. Sauvegarder la BDD manuellement (backup)

Si tu veux un vrai dump avant une opération risquée :

```powershell
# Dump
docker exec lavirgule-db pg_dump -U lavirgule lavirgule > backup.sql

# Restore
cat backup.sql | docker exec -i lavirgule-db psql -U lavirgule lavirgule
```

---

### 7. Voir l'état des migrations

```powershell
npx prisma migrate status
```

Ça affiche quelles migrations sont appliquées en BDD et lesquelles sont en attente — très utile pour diagnostiquer.

---

**En résumé pour ton projet :** tes données survivent à `down/up` grâce au named volume. Les erreurs que tu as eues venaient uniquement du client TypeScript jamais régénéré après les 6 migrations qui avaient été commitées mais jamais déployées.

Created 5 todos