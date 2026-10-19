using System.Text.Json;

namespace Souris.App;

internal static class ProgressStore
{
    private static readonly string FilePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Souris", "progression.json");

    public static HashSet<int> Load()
    {
        try
        {
            return File.Exists(FilePath)
                ? new HashSet<int>(JsonSerializer.Deserialize<int[]>(File.ReadAllText(FilePath)) ?? [])
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
            File.WriteAllText(FilePath, JsonSerializer.Serialize(completed.Order()));
            return true;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            return false;
        }
    }
}
