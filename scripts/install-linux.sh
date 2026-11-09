#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Souris"
APP_BINARY="souris"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$HOME/.local/opt/souris"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
ICON_DIR="$DATA_HOME/icons/hicolor/256x256/apps"
APPLICATIONS_DIR="$DATA_HOME/applications"

if [[ ! -f "$SCRIPT_DIR/$APP_BINARY" ]]; then
    echo "Binaire Linux introuvable : $SCRIPT_DIR/$APP_BINARY" >&2
    echo "Exécutez ce script depuis le dossier extrait de l'archive tar.gz de Souris." >&2
    exit 1
fi
if [[ ! -f "$SCRIPT_DIR/souris-icon.png" ]]; then
    echo "Icône introuvable : $SCRIPT_DIR/souris-icon.png" >&2
    exit 1
fi

mkdir -p "$APP_DIR" "$ICON_DIR" "$APPLICATIONS_DIR"
cp -a "$SCRIPT_DIR/." "$APP_DIR/"
chmod +x "$APP_DIR/$APP_BINARY"
chmod +x "$APP_DIR/chrome-sandbox" "$APP_DIR/chrome_crashpad_handler" 2>/dev/null || true
install -m 0644 "$APP_DIR/souris-icon.png" "$ICON_DIR/souris.png"

desktop_exec="$APP_DIR/$APP_BINARY"
desktop_exec="${desktop_exec//\\/\\\\}"
desktop_exec="${desktop_exec//\"/\\\"}"
desktop_file="$APPLICATIONS_DIR/souris.desktop"
cat > "$desktop_file" <<EOF
[Desktop Entry]
Type=Application
Name=$APP_NAME
Comment=Apprendre les gestes de la souris
Exec="$desktop_exec"
Icon=souris
Terminal=false
Categories=Education;
StartupNotify=true
EOF
chmod 0644 "$desktop_file"

desktop_dir=""
if command -v xdg-user-dir >/dev/null 2>&1; then
    desktop_dir="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
fi
desktop_dir="${desktop_dir:-$HOME/Desktop}"
mkdir -p "$desktop_dir"
desktop_shortcut="$desktop_dir/souris.desktop"
install -m 0755 "$desktop_file" "$desktop_shortcut"
if command -v gio >/dev/null 2>&1; then
    gio set "$desktop_shortcut" metadata::trusted true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
fi

echo "Souris est installée pour l'utilisateur courant."
echo "Entrée du menu : $desktop_file"
echo "Raccourci du bureau : $desktop_shortcut"
