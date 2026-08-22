#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/portfolio"
DOMAIN="${1:-}"

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
fi

echo "==> Installing Caddy"
if ! command -v caddy >/dev/null 2>&1; then
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install -y caddy
fi

echo "==> Copying app"
sudo mkdir -p "$APP_DIR"
sudo cp -r . "$APP_DIR"
cd "$APP_DIR"

echo "==> Building & starting container"
sudo docker compose up -d --build

if [ -n "$DOMAIN" ]; then
  echo "==> Configuring Caddy for $DOMAIN"
  sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
$DOMAIN {
    reverse_proxy 127.0.0.1:3000
}
EOF
  sudo systemctl reload caddy
  echo "==> Done. https://$DOMAIN"
else
  IP=$(curl -4 -s ifconfig.me)
  echo "==> Done. http://$IP:3000"
  echo "    (open port 3000 in Oracle security list)"
fi
