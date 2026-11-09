# Souris

Souris apprend les gestes de la souris avec six leçons et six exercices au niveau 1. La navigation regroupe les sections dans des niveaux repliables. Le premier exercice du niveau 2 combine l'ouverture d'un dossier, le déplacement de plusieurs images vers la corbeille et leur restauration par le menu contextuel. Pour réussir, seule l'image demandée doit être dans la corbeille au moment de la vider. Une mauvaise image supprimée définitivement fait échouer l'exercice. Les réussites et les échecs sont annoncés dans une fenêtre modale, et les exercices échoués affichent un X rouge dans la navigation. Après le résultat, l'exercice est grisé et désactivé jusqu'à ce qu'il soit recommencé. L'application Angular fonctionne dans un navigateur et dans une fenêtre Electron sur Windows et Linux. Les deux versions partagent le même contenu et les mêmes interactions.

## Prérequis

- Node.js et npm compatibles avec la version d'Angular déclarée dans [`package.json`](package.json).
- L'installateur Windows se construit sur Windows. L'archive Linux `tar.gz` se construit depuis Windows ou Linux.

Toutes les commandes ci-dessous se lancent depuis la racine du projet.

## Lancer dans un navigateur

```powershell
npm.cmd install
npm.cmd start
```

Ouvrir l'adresse indiquée par Angular, habituellement `http://localhost:4200`. Les réussites et les échecs sont enregistrés dans le stockage local de ce navigateur.

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

L'installateur NSIS pour Windows et l'archive portable Linux `tar.gz` sont générés dans `release/`. Depuis Windows, la commande Linux produit l'archive sans nécessiter une machine Linux. Copiez l'archive sur Linux, extrayez-la, puis lancez le script d'installation :

```bash
tar -xzf souris-1.0.0.tar.gz
cd souris-1.0.0
bash install.sh
```

Le script installe Souris dans `~/.local/opt/souris`, ajoute l'application au menu et crée un raccourci sur le bureau pour l'utilisateur courant. Pour héberger la version web, lancer `npm.cmd run build` sur Windows ou `npm run build` sur Linux, puis publier le contenu de `dist/souris-web/browser/` à la racine du site.

Le workflow GitHub Actions `Applications de bureau` peut être déclenché manuellement pour obtenir les deux paquets en artefacts. Il construit l'installateur Windows sur Windows et l'archive Linux sur Linux.

## Contenu

Les leçons sont dans [`content/Tutoriel.md`](content/Tutoriel.md). Le script de construction les convertit en données Angular. Les images utilisées par les exercices sont dans `public/assets/`.
