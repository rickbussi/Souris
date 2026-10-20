using System.Text.Json;

namespace Souris.App;

internal static class ProgressStore
{
    private const int CurrentVersion = 2;
    private sealed record ProgressData(int Version, int[] Completed);

    private static readonly string FilePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Souris", "progression.json");

    public static HashSet<int> Load()
    {
        try
        {
            if (!File.Exists(FilePath)) return [];

            var json = File.ReadAllText(FilePath);
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                // Les anciens numéros suivaient : clic gauche, clic droit,
                // double clic, glisser-déposer, sélection de texte, info-bulle.
                var oldIndexes = JsonSerializer.Deserialize<int[]>(json) ?? [];
                return new HashSet<int>(oldIndexes.Select(index => index switch
                {
                    1 => 3,
                    2 => 1,
                    3 => 2,
                    _ => index
                }));
            }

            var progress = JsonSerializer.Deserialize<ProgressData>(json);
            return progress?.Version == CurrentVersion
                ? new HashSet<int>(progress.Completed ?? [])
                : [];
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or JsonException)
        {
            return [];
        }
    }

    public static bool Save(IEnumerable<int> completed)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);
            File.WriteAllText(FilePath, JsonSerializer.Serialize(
                new ProgressData(CurrentVersion, completed.Order().ToArray())));
            return true;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            return false;
        }
    }
}
