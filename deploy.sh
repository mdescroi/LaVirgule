#!/bin/bash
# ============================================================
#  La Virgule — Script de déploiement VPS (Ubuntu 24.04)
# ============================================================
set -e

REPO="https://github.com/mdescroi/LaVirgule.git"
APP_DIR="/opt/lavirgule"
NODE_VERSION="20"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   La Virgule — Déploiement VPS       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Paquets système ─────────────────────────────────────
echo "▶ Mise à jour des paquets système..."
apt-get update -qq
apt-get install -y -qq curl git openssl nginx

# ── 2. Docker ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "▶ Installation de Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
else
  echo "✓ Docker déjà installé ($(docker --version | cut -d' ' -f3 | tr -d ','))"
fi

# ── 3. Node.js 20 ──────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
  echo "▶ Installation de Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
else
  echo "✓ Node.js déjà installé ($(node -v))"
fi

# ── 4. PM2 ─────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "▶ Installation de PM2..."
  npm install -g pm2 --silent
else
  echo "✓ PM2 déjà installé"
fi

# ── 5. Clone / Update du repo ──────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▶ Mise à jour du dépôt..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "▶ Clonage du dépôt..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
cd "$APP_DIR"

# ── 6. Fichier .env de production ──────────────────────────
if [ ! -f .env ]; then
  echo "▶ Création du fichier .env de production..."
  AUTH_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
DATABASE_URL="postgresql://lavirgule:lavirgule_dev_password@localhost:5432/lavirgule?schema=public"
AUTH_SECRET="$AUTH_SECRET"
ADMIN_EMAIL="admin@restaurantlavirgule.fr"
ADMIN_PASSWORD="ChangezMoi79!"
NODE_ENV=production
EOF
  echo "✓ .env créé (AUTH_SECRET généré automatiquement)"
else
  echo "✓ .env existant conservé"
fi

# ── 7. Dépendances npm ─────────────────────────────────────
echo "▶ Installation des dépendances npm..."
npm ci --silent

# ── 8. PostgreSQL via Docker Compose ───────────────────────
echo "▶ Démarrage de PostgreSQL..."
docker compose up -d db
echo "   Attente du démarrage PostgreSQL (15s)..."
sleep 15

# ── 9. Schéma BDD + Seed ───────────────────────────────────
echo "▶ Application du schéma Prisma..."
npx prisma db push --accept-data-loss

echo "▶ Chargement des données initiales..."
npx prisma db seed || echo "   (seed ignoré — données déjà présentes)"

# ── 10. Build Next.js ──────────────────────────────────────
echo "▶ Build de l'application..."
npm run build

# ── 11. PM2 ────────────────────────────────────────────────
echo "▶ (Re)démarrage via PM2..."
pm2 stop lavirgule 2>/dev/null || true
pm2 delete lavirgule 2>/dev/null || true
pm2 start npm --name lavirgule -- start -- -p 3000
pm2 save

# Démarrage automatique au reboot
PM2_STARTUP=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo env" || true)
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP"
fi

# ── 12. Nginx ──────────────────────────────────────────────
echo "▶ Configuration Nginx..."
cat > /etc/nginx/sites-available/lavirgule <<'NGINXCONF'
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 10m;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/lavirgule /etc/nginx/sites-enabled/lavirgule
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

# ── Fin ────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  Déploiement terminé !                   ║"
echo "║                                              ║"
echo "║  🌐  Site     : http://82.29.175.32          ║"
echo "║  🔐  Admin    : http://82.29.175.32/admin    ║"
echo "║  📧  Email    : admin@restaurantlavirgule.fr ║"
echo "║  🔑  Password : ChangezMoi79!               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
