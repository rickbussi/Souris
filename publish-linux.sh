#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Souris"
APP_BINARY="Souris"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_DIR="$HOME/.local/opt/souris"
ICON_DIR="$DATA_HOME/icons/hicolor/256x256/apps"
DESKTOP_DIR="$DATA_HOME/applications"

if [[ ! -f "$SCRIPT_DIR/$APP_BINARY" ]]; then
    echo "Binaire Linux introuvable : $SCRIPT_DIR/$APP_BINARY" >&2
    echo "Copiez les fichiers publies de Souris dans ce repertoire, puis relancez ce script." >&2
    exit 1
fi
if [[ ! -f "$SCRIPT_DIR/souris-icon.png" ]]; then
    echo "Icone introuvable : $SCRIPT_DIR/souris-icon.png" >&2
    exit 1
fi

mkdir -p "$APP_DIR" "$ICON_DIR" "$DESKTOP_DIR"
find "$SCRIPT_DIR" -mindepth 1 -maxdepth 1 \
    ! -name "$(basename -- "${BASH_SOURCE[0]}")" \
    ! -name "souris-icon.png" \
    -exec cp -a -t "$APP_DIR" -- {} +
chmod +x "$APP_DIR/$APP_BINARY"
install -m 0644 "$SCRIPT_DIR/souris-icon.png" "$ICON_DIR/souris.png"

cat > "$DESKTOP_DIR/souris.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=$APP_NAME
Comment=Application de bureau Souris
Exec="$APP_DIR/$APP_BINARY"
Icon=$ICON_DIR/souris.png
Terminal=false
Categories=Utility;
StartupNotify=true
StartupWMClass=Souris
EOF
chmod 0644 "$DESKTOP_DIR/souris.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi

echo "Souris est installee. Vous la trouverez dans le menu des applications."
echo "Binaire : $APP_DIR/$APP_BINARY"
