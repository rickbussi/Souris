# Souris

Application de bureau pour apprendre les gestes de la souris. Une page d’accueil permet de démarrer, de reprendre à la première section non terminée ou de recommencer le tutoriel. Les six explications sont dans `Souris.App/Content/Tutoriel.md`. Chaque section comporte un exercice. Les réussites sont enregistrées entre les lancements.

## Démarrer

```bash
dotnet restore Souris.slnx
dotnet run --project Souris.App/Souris.App.csproj
```

## Publier et installer sous Linux x64

La publication se fait sur Windows avec le SDK .NET 10. Depuis PowerShell, à la racine du projet, exécutez :

```powershell
dotnet publish .\Souris.App\Souris.App.csproj -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\publish\linux-x64
```

Cette commande crée `publish/linux-x64`. Copiez **tout le contenu** de ce dossier vers un dossier sur votre machine Linux. Il contient le binaire `Souris`, le script `publish-linux.sh` et l'icône `souris-icon.png`.

Sur Linux, ouvrez un terminal dans le dossier copié et autorisez l'exécution du script, puis lancez-le :

```bash
chmod +x publish-linux.sh
./publish-linux.sh
```

Le script installe Souris dans `~/.local/opt/souris`, ajoute son icône au menu des applications et crée le lanceur. L'installation ne demande pas les droits administrateur. La publication autonome regroupe l'application et le runtime .NET dans un seul binaire, mais le script et l'icône doivent rester à côté du binaire jusqu'à l'installation.
