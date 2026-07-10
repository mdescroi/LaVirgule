## Mode d'emploi — La Virgule

---

### Développement local

**1. Prérequis : démarrer la base de données**
```powershell
cd "C:\Users\maxde\OneDrive - MIAGE\Documents\LAVIRGULE\LaVirgule"
docker compose up -d
```

**2. Lancer le serveur de développement**
```powershell
npm run dev
```
Le site est accessible sur `http://localhost:3000`.  
L'admin sur `http://localhost:3000/admin` (identifiants : `admin@restaurantlavirgule.fr` / `ChangezMoi79!`).

**3. Si tu modifies le schéma Prisma** (`prisma/schema.prisma`)
```powershell
npx prisma migrate dev --name nom_de_ta_migration
```
Cela crée le fichier de migration dans `prisma/migrations/` et met à jour la BDD locale.

**4. Si tu veux réinitialiser les données** (plats, espaces, etc.)
```powershell
npx prisma db seed
```
⚠️ Le seed **supprime et recrée** tous les plats et sous-catégories. Il ne touche pas aux réservations ni aux messages.

**5. Pour voir la BDD en interface graphique**
```powershell
npx prisma studio
```

---

### Déployer sur le VPS

**1. Committer et pousser les modifications**
```powershell
git add .
git commit -m "description de la modif"
git push origin vitrine
```

**2. Se connecter au VPS et redéployer**
```powershell
ssh root@82.29.175.32
```
Puis une fois connecté :
```bash
cd /opt/lavirgule && git pull origin vitrine && npm run build && pm2 restart lavirgule && echo "✓ déployé"
```

**3. Si la modification inclut une migration Prisma**
```bash
cd /opt/lavirgule && git pull origin vitrine \
  && npx prisma migrate deploy \
  && npx prisma generate \
  && npm run build \
  && pm2 restart lavirgule \
  && echo "✓ déployé avec migration"
```

**4. Si tu as modifié le seed** (nouvelle carte, nouveaux plats, etc.)
```bash
cd /opt/lavirgule && git pull origin vitrine \
  && npx prisma migrate deploy \
  && npx prisma generate \
  && npx prisma db seed \
  && npm run build \
  && pm2 restart lavirgule \
  && echo "✓ déployé avec seed"
```

**5. Vérifier que tout tourne**
```bash
pm2 list
curl -sI https://restaurantlavirgulechauray.fr | head -2
```

---

### Résumé des cas

| Situation | Commandes supplémentaires sur VPS |
|---|---|
| Modif code uniquement | `git pull` → `npm run build` → `pm2 restart` |
| + migration Prisma | + `prisma migrate deploy` + `prisma generate` |
| + données seed (carte) | + `prisma db seed` |


Autre aide avec la BDD : 
Cannot read properties of undefined (reading 'findUnique') sur prisma.siteSettings → le modèle existe dans le schéma mais le client généré ne le connaît pas → client obsolète → prisma generate
Unknown argument 'sortOrder' sur Space → même cause, le champ a été ajouté dans une migration mais le client n'a jamais été régénéré
Confirmation via le schéma : j'ai lu schema.prisma et vérifié que SiteSettings et sortOrder sur Space y étaient bien définis — donc le problème n'était pas dans le code mais dans la synchronisation client/DB.

Ordre logique :

D'abord generate (pour que le client TypeScript corresponde au schéma)
Ensuite migrate deploy (pour que la DB corresponde aussi au schéma) — ce qui a confirmé qu'il y avait 6 migrations jamais appliquées
Enfin npm run dev pour vérifier que tout passe en 200
Le contexte du repo dans /memories/repo/projet.md m'a aussi aidé à savoir que la stack utilise Prisma 6 et PostgreSQL via Docker.