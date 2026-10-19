# Souris

Application de bureau pour apprendre les gestes de la souris. Une page d’accueil permet de démarrer, de reprendre à la première section non terminée ou de recommencer le tutoriel. Les six explications sont dans `Souris.App/Content/Tutoriel.md`. Chaque section comporte un exercice. Les réussites sont enregistrées entre les lancements.

## Démarrer

```bash
dotnet restore Souris.slnx
dotnet run --project Souris.App/Souris.App.csproj
```

## Publier et installer sous Linux x64

Sur Linux, avec le SDK .NET 10 :

```bash
dotnet publish Souris.App/Souris.App.csproj -c Release -r linux-x64 --self-contained false -o publish/linux-x64
cd publish/linux-x64
bash publish-linux.sh
```

L'installation place l'application dans `~/.local/opt/souris` et crée une entrée dans le menu utilisateur. Cette publication nécessite le runtime .NET 10 sur la machine qui exécute l'application.
