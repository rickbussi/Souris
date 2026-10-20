using System.Text.RegularExpressions;
using Avalonia;
using Avalonia.Automation;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Interactivity;
using Avalonia.Media;
using Avalonia.Threading;

namespace Souris.App;

public partial class MainWindow : Window
{
    private enum ViewStage { Home, Lesson, Exercise, Summary }

    private readonly IReadOnlyList<TutorialSection> _sections = TutorialContent.Load();
    private readonly HashSet<int> _completed = ProgressStore.Load();
    private int _sectionIndex;
    private ViewStage _stage = ViewStage.Home;
    private TextBlock? _exerciseFeedback;
    private DispatcherTimer? _hoverTimer;

    public MainWindow()
    {
        InitializeComponent();
        _completed.RemoveWhere(index => index < 0 || index >= _sections.Count);
        Render();
    }

    private static IBrush ColorBrush(string color) => new SolidColorBrush(Color.Parse(color));

    private void Render()
    {
        _hoverTimer?.Stop();
        _hoverTimer = null;
        _exerciseFeedback = null;

        ProgressLabel.Text = ProgressText();
        RenderNavigation();

        if (_stage == ViewStage.Home)
        {
            StageLabel.Text = "BIENVENUE";
            SectionHeading.Text = "Apprendre à utiliser la souris";
            StageContent.Content = BuildHome();
            BackButton.IsVisible = false;
            NextButton.IsVisible = false;
        }
        else if (_stage == ViewStage.Summary)
        {
            StageLabel.Text = "MA PROGRESSION";
            SectionHeading.Text = "Bravo pour ton parcours !";
            StageContent.Content = BuildSummary();
            BackButton.IsVisible = true;
            BackButton.Content = "Retour";
            BackButton.IsEnabled = true;
            NextButton.IsVisible = false;
        }
        else
        {
            var section = _sections[_sectionIndex];
            StageLabel.Text = $"SECTION {_sectionIndex + 1} SUR {_sections.Count} · {(_stage == ViewStage.Lesson ? "EXPLICATION" : "EXERCICE")}";
            SectionHeading.Text = section.Title;
            StageContent.Content = _stage == ViewStage.Lesson
                ? BuildLesson(section.Markdown)
                : BuildExercise();
            BackButton.IsVisible = true;
            BackButton.Content = _stage == ViewStage.Lesson && _sectionIndex == 0 ? "Accueil" : "Retour";
            BackButton.IsEnabled = true;
            NextButton.IsVisible = true;
            NextButton.Content = _stage == ViewStage.Lesson
                ? "Passer à l’exercice"
                : _sectionIndex == _sections.Count - 1 ? "Voir ma progression" : "Section suivante";
            NextButton.IsEnabled = _stage == ViewStage.Lesson || _completed.Contains(_sectionIndex);
        }

        ContentScroll.Offset = new Vector(0, 0);
    }

    private string ProgressText() => $"{_completed.Count} / {_sections.Count} exercices réussis";

    private void RenderNavigation()
    {
        SectionNavigation.Children.Clear();
        for (var index = 0; index < _sections.Count; index++)
        {
            var sectionIndex = index;
            var selected = (_stage is ViewStage.Lesson or ViewStage.Exercise) && index == _sectionIndex;
            var done = _completed.Contains(index);
            var title = new TextBlock
            {
                Text = $"{index + 1}. {_sections[index].Title}",
                FontSize = 16,
                FontWeight = selected ? FontWeight.Bold : FontWeight.SemiBold,
                Foreground = ColorBrush("#17345C"),
                TextWrapping = TextWrapping.Wrap,
                TextAlignment = TextAlignment.Center,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
            };
            var checkmark = new Border
            {
                Width = 22,
                Height = 22,
                BorderThickness = new Thickness(2),
                BorderBrush = ColorBrush(done ? "#16834F" : "#7D8EA8"),
                Background = ColorBrush(done ? "#E7F7ED" : "#FFFFFF"),
                CornerRadius = new CornerRadius(4),
                Child = done ? new TextBlock
                {
                    Text = "✓",
                    FontSize = 17,
                    FontWeight = FontWeight.Bold,
                    Foreground = ColorBrush("#16834F"),
                    TextAlignment = TextAlignment.Center,
                    VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center
                } : null
            };
            var row = new Grid { ColumnDefinitions = new ColumnDefinitions("24,*,24") };
            Grid.SetColumn(title, 1);
            Grid.SetColumn(checkmark, 2);
            row.Children.Add(title);
            row.Children.Add(checkmark);
            var button = new Button
            {
                Content = row,
                IsEnabled = _stage != ViewStage.Home,
                Background = ColorBrush(selected ? "#D8E7FF" : "#FFFFFF"),
                BorderBrush = ColorBrush(selected ? "#2266CC" : "#CFD9E8"),
                BorderThickness = new Thickness(selected ? 2 : 1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(10),
                MinHeight = 60,
                HorizontalContentAlignment = Avalonia.Layout.HorizontalAlignment.Stretch,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Stretch
            };
            AutomationProperties.SetName(button,
                $"{index + 1}. {_sections[index].Title}, exercice {(done ? "réussi" : "à faire")}");
            button.Click += (_, _) =>
            {
                _sectionIndex = sectionIndex;
                _stage = ViewStage.Lesson;
                Render();
            };
            SectionNavigation.Children.Add(button);
        }
    }

    private Control BuildHome()
    {
        var content = new StackPanel
        {
            Spacing = 28,
            MaxWidth = 650,
            Margin = new Thickness(0, 55, 0, 0),
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
        };
        content.Children.Add(new TextBlock
        {
            Text = "Découvre les gestes de base de la souris avec de petites explications et des exercices. Tu pourras ensuite les utiliser dans Windows ou Linux.",
            FontSize = 23,
            LineHeight = 35,
            Foreground = ColorBrush("#213450"),
            TextWrapping = TextWrapping.Wrap,
            TextAlignment = TextAlignment.Center
        });

        var actions = new StackPanel { Spacing = 14 };
        void AddAction(string label, Action action)
        {
            var button = new Button
            {
                Content = label,
                Width = 380,
                MinHeight = 60,
                FontSize = 20,
                FontWeight = FontWeight.SemiBold,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
            };
            button.Classes.Add("primary");
            button.Click += (_, _) => action();
            actions.Children.Add(button);
        }

        if (_completed.Count == 0)
        {
            AddAction("Démarrer", () =>
            {
                _sectionIndex = 0;
                _stage = ViewStage.Lesson;
                Render();
            });
        }
        else if (_completed.Count < _sections.Count)
        {
            var nextSection = Enumerable.Range(0, _sections.Count)
                .First(index => !_completed.Contains(index));
            AddAction($"Continuer vers {_sections[nextSection].Title}", () =>
            {
                _sectionIndex = nextSection;
                _stage = ViewStage.Lesson;
                Render();
            });
        }

        var resetError = new TextBlock
        {
            Text = "La progression n’a pas pu être remise à zéro. Réessaie.",
            FontSize = 17,
            Foreground = ColorBrush("#A12B2B"),
            TextWrapping = TextWrapping.Wrap,
            TextAlignment = TextAlignment.Center,
            IsVisible = false
        };
        if (_completed.Count > 0)
        {
            AddAction("Recommencer le tutoriel", () =>
            {
                if (!ProgressStore.Save(Array.Empty<int>()))
                {
                    resetError.IsVisible = true;
                    return;
                }
                _completed.Clear();
                _sectionIndex = 0;
                _stage = ViewStage.Lesson;
                Render();
            });
        }
        content.Children.Add(actions);
        content.Children.Add(resetError);
        return content;
    }

    private static Control BuildLesson(string markdown)
    {
        var content = new StackPanel { Spacing = 16 };
        var paragraph = new List<string>();

        void AddBlock(string raw, bool isListItem)
        {
            var normalized = Regex.Replace(raw, @"\s+", " ").Trim();
            if (normalized.Length == 0) return;
            var block = new TextBlock
            {
                FontSize = 19,
                LineHeight = 30,
                Inlines = new InlineCollection(),
                Foreground = ColorBrush("#213450"),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(isListItem ? 18 : 0, 0, 0, 0)
            };
            AddFormattedText(block, normalized);
            content.Children.Add(block);
        }

        void FlushParagraph()
        {
            if (paragraph.Count == 0) return;
            AddBlock(string.Join(" ", paragraph), false);
            paragraph.Clear();
        }

        foreach (var line in markdown.Replace("\r", "").Split('\n'))
        {
            if (string.IsNullOrWhiteSpace(line))
                FlushParagraph();
            else if (Regex.IsMatch(line.TrimStart(), @"^(?:\d+\.|-) "))
            {
                FlushParagraph();
                var item = line.TrimStart();
                AddBlock(item.StartsWith("- ") ? $"• {item[2..]}" : item, true);
            }
            else
                paragraph.Add(line);
        }
        FlushParagraph();
        return content;
    }

    private static void AddFormattedText(TextBlock block, string text)
    {
        var position = 0;
        foreach (Match match in Regex.Matches(text, @"\*\*(.*?)\*\*"))
        {
            if (match.Index > position)
                block.Inlines!.Add(new Run(text[position..match.Index]));
            block.Inlines!.Add(new Run(match.Groups[1].Value) { FontWeight = FontWeight.Bold });
            position = match.Index + match.Length;
        }
        if (position < text.Length)
            block.Inlines!.Add(new Run(text[position..]));
    }

    private Control BuildExercise()
    {
        var hoverActions = new[]
        {
            "ouvrir un document",
            "lancer l’impression",
            "enregistrer le document"
        };
        for (var index = hoverActions.Length - 1; index > 0; index--)
        {
            var swapIndex = Random.Shared.Next(index + 1);
            (hoverActions[index], hoverActions[swapIndex]) = (hoverActions[swapIndex], hoverActions[index]);
        }
        var hoverTarget = hoverActions[Random.Shared.Next(hoverActions.Length)];
        var instructions = new[]
        {
            "Réaliser ces trois instructions pour passer à la section suivante.",
            "Double-clique sur le dossier « Images » pour l’ouvrir.",
            "Fais glisser le fichier « ballon.jpg » sur le dossier « Images », puis relâche.",
            "Fais un clic droit sur l’image, puis choisis « Ouvrir » dans le menu.",
            "Sélectionne les mots « petite barre » dans la phrase.",
            $"Clique sur le bon bouton pour {hoverTarget}. Utilise l’info-bulle pour te guider."
        };
        var content = new StackPanel { Spacing = 22 };
        if (_sectionIndex == 0)
        {
            content.Children.Add(new TextBlock
            {
                Text = instructions[0],
                FontSize = 23,
                FontWeight = FontWeight.SemiBold,
                Foreground = ColorBrush("#17345C"),
                TextWrapping = TextWrapping.Wrap
            });
            foreach (var instruction in new[]
            {
                "1. Clique une fois sur le bouton « Lecture ». ",
                "2. Choisis « Cappuccino » dans la liste des cafés.",
                "3. Ouvre le menu « Fichier », puis clique sur « Imprimer » ."
            })
                content.Children.Add(new TextBlock
                {
                    Text = instruction.Trim(),
                    FontSize = 19,
                    Foreground = ColorBrush("#213450"),
                    TextWrapping = TextWrapping.Wrap
                });
        }
        else
            content.Children.Add(new TextBlock
            {
                Text = instructions[_sectionIndex],
                FontSize = 23,
                FontWeight = FontWeight.SemiBold,
                Foreground = ColorBrush("#17345C"),
                TextWrapping = TextWrapping.Wrap
            });
        var scene = _sectionIndex switch
        {
            0 => BuildClickSynonymsExercise(),
            1 => BuildDoubleClickExercise(),
            2 => BuildDragExercise(),
            3 => BuildRightClickExercise(),
            4 => BuildTextSelectionExercise(),
            _ => BuildHoverExercise(hoverActions, hoverTarget)
        };
        content.Children.Add(new Border
        {
            Background = ColorBrush("#F1F5FC"),
            CornerRadius = new CornerRadius(16),
            Padding = new Thickness(24),
            MinHeight = 245,
            Child = scene
        });
        _exerciseFeedback = new TextBlock
        {
            Text = _completed.Contains(_sectionIndex)
                ? "Cet exercice est déjà réussi. Tu peux le refaire ou passer à la suite."
                : "Prends ton temps. Tu peux essayer autant de fois que tu veux.",
            FontSize = 18,
            Foreground = ColorBrush("#405777"),
            TextWrapping = TextWrapping.Wrap
        };
        content.Children.Add(_exerciseFeedback);
        var restart = new Button
        {
            Content = "Recommencer l’exercice",
            FontSize = 16,
            MinHeight = 48,
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Left
        };
        restart.Click += (_, _) => Render();
        content.Children.Add(restart);
        return content;
    }

    private Control BuildSummary()
    {
        var content = new StackPanel { Spacing = 22 };
        content.Children.Add(new TextBlock
        {
            Text = $"Tu as réussi {_completed.Count} exercice{(_completed.Count > 1 ? "s" : "")} sur {_sections.Count}.",
            FontSize = 25,
            FontWeight = FontWeight.SemiBold,
            Foreground = ColorBrush("#176B43"),
            TextWrapping = TextWrapping.Wrap
        });
        content.Children.Add(new TextBlock
        {
            Text = "Tu peux choisir une section à gauche pour relire son explication ou refaire son exercice.",
            FontSize = 19,
            Foreground = ColorBrush("#213450"),
            TextWrapping = TextWrapping.Wrap
        });
        return content;
    }

    private void CompleteExercise()
    {
        if (_stage != ViewStage.Exercise) return;
        var isNew = _completed.Add(_sectionIndex);
        var saved = !isNew || ProgressStore.Save(_completed);
        ProgressLabel.Text = ProgressText();
        RenderNavigation();
        NextButton.IsEnabled = true;
        if (_exerciseFeedback is not null)
        {
            _exerciseFeedback.Text = saved
                ? "Bravo ! Tu as réussi l’exercice. Tu peux passer à la suite."
                : "Bravo ! Tu as réussi l’exercice. La progression n’a pas pu être gardée pour la prochaine fois.";
            _exerciseFeedback.Foreground = ColorBrush("#176B43");
            _exerciseFeedback.FontWeight = FontWeight.SemiBold;
        }
    }

    private void ShowTryAgain()
    {
        if (_exerciseFeedback is not null && !_completed.Contains(_sectionIndex))
            _exerciseFeedback.Text = "Presque ! Essaie encore doucement.";
    }

    private void OnBackClicked(object? sender, RoutedEventArgs e)
    {
        if (_stage == ViewStage.Summary)
        {
            _sectionIndex = _sections.Count - 1;
            _stage = ViewStage.Lesson;
        }
        else if (_stage == ViewStage.Exercise)
            _stage = ViewStage.Lesson;
        else if (_sectionIndex > 0)
            _sectionIndex--;
        else
            _stage = ViewStage.Home;
        Render();
    }

    private void OnNextClicked(object? sender, RoutedEventArgs e)
    {
        if (_stage == ViewStage.Lesson)
            _stage = ViewStage.Exercise;
        else if (_stage == ViewStage.Exercise && _completed.Contains(_sectionIndex))
        {
            if (_sectionIndex == _sections.Count - 1)
                _stage = ViewStage.Summary;
            else
            {
                _sectionIndex++;
                _stage = ViewStage.Lesson;
            }
        }
        Render();
    }
}
