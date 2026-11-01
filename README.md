# Souris

Souris apprend les gestes de la souris avec six leçons et six exercices. L'application Angular fonctionne dans un navigateur et dans une fenêtre Electron sur Windows et Linux. Les deux versions partagent le même contenu et les mêmes interactions.

## Prérequis

- Node.js et npm compatibles avec la version d'Angular déclarée dans [`package.json`](package.json).
- Pour produire les installateurs, exécuter la commande Windows sur Windows et la commande Linux sur Linux.

Toutes les commandes ci-dessous se lancent depuis la racine du projet.

## Lancer dans un navigateur

```powershell
npm.cmd install
npm.cmd start
```

Ouvrir l'adresse indiquée par Angular, habituellement `http://localhost:4200`. La progression est enregistrée dans le stockage local de ce navigateur.

## Lancer l'application de bureau

```powershell
npm.cmd install
npm.cmd run desktop
```

Cette commande construit Angular puis ouvre la même interface dans Electron. La progression de bureau est enregistrée dans le dossier de données utilisateur de l'application. Au premier lancement, Electron peut importer un ancien fichier local `progression.json` s'il existe. Une progression enregistrée dans un navigateur ne peut pas être lue automatiquement par Electron.

## Créer les installateurs

Sur Windows :

```powershell
npm.cmd install
npm.cmd run dist:win
```

Pour lancer directement la version Windows générée, exécuter `& ".\release\win-unpacked\Souris.exe"` depuis la racine du projet. Pour installer l'application, lancer `& ".\release\Souris Setup 1.0.0.exe"`.

Sur Linux :

```bash
npm install
npm run dist:linux
```

Les fichiers produits sont dans `release/` : installateur NSIS pour Windows et AppImage pour Linux. Sur Linux, rendre l'AppImage exécutable avec `chmod +x`, puis la lancer. Pour héberger la version web, lancer `npm.cmd run build` sur Windows ou `npm run build` sur Linux, puis publier le contenu de `dist/souris-web/browser/` à la racine du site.

Le workflow GitHub Actions `Applications de bureau` peut être déclenché manuellement pour obtenir les deux fichiers en artefacts, chacun construit sur son système cible.

## Contenu

Les leçons sont dans [`content/Tutoriel.md`](content/Tutoriel.md). Le script de construction les convertit en données Angular. Les images utilisées par les exercices sont dans `public/assets/`.
