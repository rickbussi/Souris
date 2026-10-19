using System.Reflection;
using System.Text.RegularExpressions;

namespace Souris.App;

internal sealed record TutorialSection(string Title, string Markdown);

internal static class TutorialContent
{
    public static IReadOnlyList<TutorialSection> Load()
    {
        using var stream = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream("Souris.App.Content.Tutoriel.md")
            ?? throw new InvalidOperationException("Le tutoriel est introuvable.");
        using var reader = new StreamReader(stream);
        var text = reader.ReadToEnd();
        var headings = Regex.Matches(text, @"(?m)^# ([^\r\n]+)");
        var sections = new List<TutorialSection>(headings.Count);

        for (var index = 0; index < headings.Count; index++)
        {
            var heading = headings[index];
            var start = heading.Index + heading.Length;
            var end = index + 1 < headings.Count ? headings[index + 1].Index : text.Length;
            sections.Add(new TutorialSection(
                heading.Groups[1].Value,
                text[start..end].Trim('\r', '\n')));
        }

        return sections;
    }
}
