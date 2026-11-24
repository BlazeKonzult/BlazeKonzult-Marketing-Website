#!/bin/bash
# Double-click to run the full BlazeKonzult website + admin locally (same server as production).
#   Website: http://localhost:3001        Admin: http://localhost:3001/admin/
# Needs Node.js 20.9+ and a local MySQL/MariaDB (installed automatically with Homebrew if missing).
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
PREVIEW_DIR="$ROOT/.local-preview"
mkdir -p "$PREVIEW_DIR" && chmod 700 "$PREVIEW_DIR"
LOG="$PREVIEW_DIR/setup.log"
say() { printf "\n\033[1;35m==>\033[0m %s\n" "$1"; }
fail() { printf "\n\033[1;31mERROR:\033[0m %s\n(Details: %s)\n\nPress Return to close." "$1" "$LOG"; read -r; exit 1; }

export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/opt/homebrew/opt/mariadb/bin:/opt/homebrew/opt/mysql/bin:$PATH"

say "Checking Node.js"
command -v node >/dev/null || fail "Node.js is not installed. Install it from https://nodejs.org (version 20 or newer) and run this again."
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)' || fail "Node.js $(node -v) is too old. Install version 20 or newer from https://nodejs.org."
node -v

say "Checking the database (MySQL/MariaDB)"
if ! command -v mysql >/dev/null; then
  command -v brew >/dev/null || fail "No MySQL/MariaDB found and Homebrew is not installed. Install Homebrew (https://brew.sh) or MySQL, then run this again."
  say "Installing MariaDB with Homebrew (one time, a few minutes)"
  brew install mariadb >>"$LOG" 2>&1 || fail "MariaDB installation failed."
fi
if ! mysqladmin ping >/dev/null 2>&1 && ! mysqladmin -uroot ping >/dev/null 2>&1; then
  say "Starting the database"
  (brew services start mariadb || brew services start mysql) >>"$LOG" 2>&1
  for i in $(seq 1 30); do (mysqladmin ping >/dev/null 2>&1 || mysqladmin -uroot ping >/dev/null 2>&1) && break; sleep 1; done
fi

DB_PASS_FILE="$PREVIEW_DIR/db-pass"
[ -f "$DB_PASS_FILE" ] || (openssl rand -hex 16 > "$DB_PASS_FILE"; chmod 600 "$DB_PASS_FILE")
DB_PASS="$(cat "$DB_PASS_FILE")"
SQL="CREATE DATABASE IF NOT EXISTS bk_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'bk_local'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER 'bk_local'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON bk_local.* TO 'bk_local'@'localhost';
CREATE USER IF NOT EXISTS 'bk_local'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
ALTER USER 'bk_local'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON bk_local.* TO 'bk_local'@'127.0.0.1'; FLUSH PRIVILEGES;"
(mysql -e "$SQL" || mysql -uroot -e "$SQL" || sudo mysql -uroot -e "$SQL") >>"$LOG" 2>&1 || fail "Could not create the local database. If MySQL has a root password, run: mysql -uroot -p  and create database bk_local manually."

ENV_FILE="$PREVIEW_DIR/env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
NODE_ENV=development
PORT=3001
SITE_URL=http://localhost:3001
DB_HOST=127.0.0.1
DB_NAME=bk_local
DB_USER=bk_local
DB_PASS=$DB_PASS
APP_KEY=$(openssl rand -base64 32)
INDEX_KEY=$(openssl rand -base64 32)
MAIL_DRIVER=log
MAIL_LOG_DIR=$PREVIEW_DIR/mail
MEDIA_DIR=$PREVIEW_DIR/media
EOF
  chmod 600 "$ENV_FILE"
fi
grep -q '^MEDIA_DIR=' "$ENV_FILE" || echo "MEDIA_DIR=$PREVIEW_DIR/media" >> "$ENV_FILE"
sed -i '' '/^STATIC_DIR=/d' "$ENV_FILE" 2>/dev/null
set -a; . "$ENV_FILE"; set +a

say "Installing dependencies (first run takes a minute)"
npm install --no-audit --no-fund >>"$LOG" 2>&1 || fail "npm install failed."
# Rebuild when there is no complete build, or when the source changed after the last build.
if [ ! -f .next/BUILD_ID ] || [ ! -f .next/.bk-build-ok ] || [ -n "$(find src backend/src -newer .next/.bk-build-ok -type f 2>/dev/null | head -1)" ]; then
  say "Building the website (a minute or two)"
  rm -f .next/BUILD_ID .next/.bk-build-ok
  # Next.js must build with NODE_ENV=production; the preview env file sets development for the API.
  NODE_ENV=production npx next build --webpack >>"$LOG" 2>&1 || { rm -f .next/BUILD_ID; fail "Website build failed."; }
  touch .next/.bk-build-ok
fi
cd "$ROOT/backend" || fail "backend folder missing"

say "Preparing the database (tables + starter assessments)"
node dist/cli.js seed >>"$LOG" 2>&1 || fail "Database setup failed."

OWNER_FILE="$PREVIEW_DIR/admin-login.txt"
if [ ! -f "$OWNER_FILE" ]; then
  ADMIN_PW="Preview-$(openssl rand -hex 6)"
  node dist/cli.js create-owner --email admin@blazekonzult.local --name "Mike" --password "$ADMIN_PW" >>"$LOG" 2>&1 || fail "Could not create the admin account."
  printf "Email:    admin@blazekonzult.local\nPassword: %s\n" "$ADMIN_PW" > "$OWNER_FILE"; chmod 600 "$OWNER_FILE"
fi
# Fast local testing: allow quick submissions
mysql -h localhost -ubk_local -p"$DB_PASS" bk_local -e "INSERT INTO settings (\`key\`,\`value\`) VALUES ('min_completion_seconds','3') ON DUPLICATE KEY UPDATE \`value\`='3'" >/dev/null 2>&1

lsof -ti tcp:3001 | xargs kill 2>/dev/null
cd "$ROOT" || exit 1
printf "\n\033[1;32mReady.\033[0m\n  Website:  http://localhost:3001/cybersecurity-assessment/\n  Admin:    http://localhost:3001/admin/\n\n%s\n(Emails are not sent locally; they are saved in .local-preview/mail)\nLeave this window open. Press Ctrl+C to stop.\n\n" "$(cat "$OWNER_FILE")"
(sleep 2; open "http://localhost:3001/admin/") &
exec node server.js
