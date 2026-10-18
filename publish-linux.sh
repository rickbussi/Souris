#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="Souris"
APP_DIR="${HOME}/.local/opt/souris"
ICON_DIR="${HOME}/.local/share/icons/hicolor/256x256/apps"
DESKTOP_DIR="${HOME}/.local/share/applications"

for required_file in "${SCRIPT_DIR}/Souris" "${SCRIPT_DIR}/souris-icon.png"; do
  if [[ ! -f "${required_file}" ]]; then
    echo "Fichier requis introuvable : ${required_file}" >&2
    echo "Placez le binaire publié Souris et souris-icon.png à côté de ce script." >&2
    exit 1
  fi
done

mkdir -p "${APP_DIR}" "${ICON_DIR}" "${DESKTOP_DIR}"
cp -a "${SCRIPT_DIR}/." "${APP_DIR}/"
chmod +x "${APP_DIR}/Souris"
install -m 644 "${SCRIPT_DIR}/souris-icon.png" "${ICON_DIR}/souris-icon.png"

cat > "${DESKTOP_DIR}/souris.desktop" <<EOF
[Desktop Entry]
Name=${APP_NAME}
Comment=Application de bureau Souris
Exec=${APP_DIR}/Souris
Icon=souris-icon
Terminal=false
Type=Application
Categories=Utility;
StartupWMClass=Souris
EOF
chmod 644 "${DESKTOP_DIR}/souris.desktop"

echo "Souris a été installé dans ${APP_DIR}."
