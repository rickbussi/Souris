using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Controls.Primitives;
using Path = Avalonia.Controls.Shapes.Path;
using Avalonia.Platform;
using Avalonia.Threading;

namespace Souris.App;

public partial class MainWindow
{
    private static Border ObjectCard(string kind, string label, int width = 150, int height = 118)
    {
        var card = new Border
        {
            Width = width,
            Height = height,
            Background = ColorBrush("#FFFFFF"),
            BorderBrush = ColorBrush("#8CAAD3"),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(14),
            Padding = new Thickness(12)
        };
        card.Child = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Spacing = 8,
            Children =
            {
                new TextBlock
                {
                    Text = kind,
                    FontSize = 13,
                    FontWeight = FontWeight.Bold,
                    Foreground = ColorBrush("#2266CC"),
                    HorizontalAlignment = HorizontalAlignment.Center
                },
                new TextBlock
                {
                    Text = label,
                    FontSize = 19,
                    FontWeight = FontWeight.SemiBold,
                    Foreground = ColorBrush("#17345C"),
                    HorizontalAlignment = HorizontalAlignment.Center
                }
            }
        };
        return card;
    }

    private Control BuildLeftClickExercise()
    {
        var button = new Button
        {
            Content = "Lecture",
            FontSize = 24,
            FontWeight = FontWeight.SemiBold,
            MinWidth = 185,
            MinHeight = 82,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
        button.Classes.Add("primary");
        button.Click += (_, _) =>
        {
            button.Content = "Lecture lancée";
            CompleteExercise();
        };
        return button;
    }

    private Control BuildClickSynonymsExercise()
    {
        var clicked = false;
        var choseCoffee = false;
        var printed = false;

        var button = new Button
        {
            Content = "Lecture",
            FontSize = 20,
            FontWeight = FontWeight.SemiBold,
            MinWidth = 150,
            MinHeight = 58
        };
        button.Classes.Add("primary");
        button.Click += (_, _) =>
        {
            clicked = true;
            button.Content = "Lecture lancée";
            TryComplete();
        };

        var coffeeChoices = new StackPanel { Spacing = 8 };
        foreach (var choice in new[] { "Espresso", "Cappuccino", "Café filtre" })
        {
            var radio = new RadioButton
            {
                Content = choice,
                GroupName = "CoffeeChoice",
                FontSize = 16,
                Foreground = ColorBrush("#17345C"),
                Padding = new Thickness(8, 5)
            };
            radio.IsCheckedChanged += (_, _) =>
            {
                if (radio.IsChecked != true) return;
                choseCoffee = choice == "Cappuccino";
                if (!choseCoffee) ShowTryAgain();
                TryComplete();
            };
            coffeeChoices.Children.Add(new Border
            {
                Background = ColorBrush("#E3EAF4"),
                CornerRadius = new CornerRadius(6),
                Child = radio
            });
        }

        var fileMenu = new StackPanel { Spacing = 0, Width = 180 };
        var fileMenuBorder = new Border
        {
            Background = ColorBrush("#FFFFFF"),
            BorderBrush = ColorBrush("#AEB4BE"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(5),
            Padding = new Thickness(5),
            Child = fileMenu
        };
        var filePopup = new Popup
        {
            Placement = PlacementMode.Top,
            IsLightDismissEnabled = true
        };
        var filePopupContent = new Viewbox { Child = fileMenuBorder };
        filePopup.Child = filePopupContent;
        var fileButton = new Button
        {
            Content = "Fichier",
            FontSize = 16,
            MinHeight = 38,
            HorizontalContentAlignment = HorizontalAlignment.Stretch,
            Padding = new Thickness(12, 6),
            HorizontalAlignment = HorizontalAlignment.Stretch
        };
        filePopup.PlacementTarget = fileButton;
        fileButton.Classes.Add("contextMenuItem");
        fileButton.Click += (_, _) =>
        {
            if (filePopup.IsOpen)
            {
                filePopup.IsOpen = false;
                return;
            }

            var scale = Math.Min(1d, Math.Min(ClientSize.Width / 1180d, ClientSize.Height / 780d));
            filePopupContent.Width = 192 * scale;
            filePopupContent.Height = 164 * scale;
            filePopup.IsOpen = true;
        };

        foreach (var item in new[] { "Nouveau", "Ouvrir…", "Enregistrer", "Imprimer" })
        {
            var menuItem = new Button
            {
                Content = item,
                FontSize = 16,
                MinHeight = 38,
                HorizontalContentAlignment = HorizontalAlignment.Stretch,
                Padding = new Thickness(14, 6),
                HorizontalAlignment = HorizontalAlignment.Stretch,
                Background = ColorBrush("#FFFFFF"),
                Foreground = ColorBrush("#202020"),
                BorderThickness = new Thickness(0),
                CornerRadius = new CornerRadius(3)
            };
            menuItem.Classes.Add("contextMenuItem");
            menuItem.PointerEntered += (_, _) => menuItem.Background = ColorBrush("#BFD8FF");
            menuItem.PointerExited += (_, _) => menuItem.Background = ColorBrush("#FFFFFF");
            menuItem.Click += (_, _) =>
            {
                menuItem.Background = ColorBrush("#FFFFFF");
                filePopup.IsOpen = false;
                if (item == "Imprimer")
                {
                    printed = true;
                    TryComplete();
                }
                else ShowTryAgain();
            };
            fileMenu.Children.Add(menuItem);
        }

        void TryComplete()
        {
            if (clicked && choseCoffee && printed) CompleteExercise();
        }

        var fileGroup = new StackPanel
        {
            Spacing = 0,
            Children =
            {
                new Border
                {
                    BorderBrush = ColorBrush("#AEB4BE"),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(5),
                    Background = ColorBrush("#FFFFFF"),
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    Child = fileButton
                }
            }
        };
        var buttonGroup = new StackPanel
        {
            Spacing = 14,
            HorizontalAlignment = HorizontalAlignment.Center,
            Children =
            {
                button
            }
        };
        var coffeeGroup = new StackPanel
        {
            Spacing = 10,
            Children =
            {
                new Border
                {
                    BorderBrush = ColorBrush("#8CAAD3"),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(12),
                    Child = new StackPanel
                    {
                        Spacing = 8,
                        Children =
                        {
                            new TextBlock { Text = "Nos cafés disponibles ce matin", FontSize = 15, FontWeight = FontWeight.SemiBold, Foreground = ColorBrush("#405777"), TextWrapping = TextWrapping.Wrap },
                            coffeeChoices
                        }
                    }
                }
            }
        };
        var menuGroup = new StackPanel
        {
            Spacing = 10,
            Children =
            {
                new Border
                {
                    BorderBrush = ColorBrush("#8CAAD3"),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(8),
                    Child = fileGroup
                }
            }
        };
        var columns = new Grid
        {
            ColumnDefinitions = new ColumnDefinitions("*,*,*"),
            ColumnSpacing = 18,
            VerticalAlignment = VerticalAlignment.Top
        };
        Grid.SetColumn(buttonGroup, 0);
        Grid.SetColumn(coffeeGroup, 1);
        Grid.SetColumn(menuGroup, 2);
        columns.Children.Add(buttonGroup);
        columns.Children.Add(coffeeGroup);
        columns.Children.Add(menuGroup);
        return columns;
    }

    private Control BuildRightClickExercise()
    {
        var image = new Border
        {
            Width = 220,
            Height = 220,
            Background = ColorBrush("#FFFFFF"),
            BorderBrush = ColorBrush("#8CAAD3"),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(8),
            ClipToBounds = true,
            Child = new Image
            {
                Source = new Bitmap(AssetLoader.Open(new Uri("avares://Souris/Assets/cappuccino-heart.png"))),
                Stretch = Stretch.UniformToFill
            }
        };

        var menuItems = new StackPanel { Spacing = 0 };
        var menu = new Popup
        {
            PlacementTarget = image,
            Placement = PlacementMode.Pointer,
            HorizontalOffset = 0,
            VerticalOffset = 0,
            IsLightDismissEnabled = true,
            Child = new Border
            {
                Background = ColorBrush("#FFFFFF"),
                BorderBrush = ColorBrush("#AEB4BE"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(5),
                Padding = new Thickness(5),
                Child = menuItems
            }
        };
        foreach (var action in new[] { "Ouvrir", "Renommer", "Mettre à la corbeille" })
        {
            var menuButton = new Button
            {
                Content = action,
                FontSize = 16,
                MinWidth = 220,
                MinHeight = 38,
                HorizontalContentAlignment = HorizontalAlignment.Left,
                Padding = new Thickness(12, 6)
            };
            menuButton.Classes.Add("contextMenuItem");
            menuButton.Click += (_, _) =>
            {
                menu.IsOpen = false;
                if (action == "Ouvrir")
                {
                    CompleteExercise();
                }
                else
                    ShowTryAgain();
            };
            menuItems.Children.Add(menuButton);
        }
        image.PointerPressed += (_, args) =>
        {
            if (args.GetCurrentPoint(image).Properties.IsRightButtonPressed)
            {
                menu.IsOpen = false;
                menu.IsOpen = true;
                args.Handled = true;
            }
        };
        return new Grid
        {
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Children = { image, menu }
        };
    }

    private Control BuildDoubleClickExercise()
    {
        var scene = new Canvas
        {
            Width = 520,
            Height = 330,
            Background = ColorBrush("#F1F5FC"),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };

        // Le dos et la languette restent visibles lorsque la face avant s'abaisse.
        scene.Children.Add(CreateFolderBack());

        var opening = new Path
        {
            Data = Geometry.Parse("M 83 163 L 444 163 L 438 200 L 89 200 Z"),
            Fill = ColorBrush("#916222"),
            IsVisible = false
        };
        scene.Children.Add(opening);

        var imageFiles = new[]
        {
            "cappuccino-heart.png", "suv-gris.png", "ballon-plage.png", "cavalier-echecs.png"
        };
        var previews = new List<Border>();
        for (var index = 0; index < imageFiles.Length; index++)
        {
            var preview = new Border
            {
                Width = 78,
                Height = 92,
                Padding = new Thickness(4),
                Background = ColorBrush("#FFFFFF"),
                BorderBrush = ColorBrush("#D3D7DF"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(2),
                RenderTransform = new RotateTransform(new[] { -5, -2, 3, 6 }[index]),
                Child = new Image
                {
                    Source = new Bitmap(AssetLoader.Open(new Uri($"avares://Souris/Assets/{imageFiles[index]}"))),
                    Width = 68,
                    Height = 68,
                    Stretch = Stretch.UniformToFill
                }
            };
            Canvas.SetLeft(preview, 97 + index * 87);
            Canvas.SetTop(preview, 176);
            previews.Add(preview);
            scene.Children.Add(preview);
        }

        var front = CreateFolderFront();
        scene.Children.Add(front);

        var folderName = new TextBlock
        {
            Text = "Images",
            FontSize = 21,
            FontWeight = FontWeight.SemiBold,
            Foreground = ColorBrush("#17345C"),
            Width = 120,
            TextAlignment = TextAlignment.Center
        };
        Canvas.SetLeft(folderName, 200);
        Canvas.SetTop(folderName, 288);
        scene.Children.Add(folderName);

        var opened = false;
        scene.PointerPressed += (_, args) =>
        {
            var point = args.GetPosition(scene);
            var onFolder = point.X >= 78 && point.X <= 449 && point.Y >= 106 && point.Y <= 277;
            var onName = point.X >= 200 && point.X <= 320 && point.Y >= 288 && point.Y <= 316;
            if (opened || !args.GetCurrentPoint(scene).Properties.IsLeftButtonPressed
                || args.ClickCount < 2 || !(onFolder || onName))
                return;

            opened = true;
            opening.IsVisible = true;
            CompleteExercise();

            var frame = 0;
            const int frameCount = 18;
            var animation = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(20) };
            animation.Tick += (_, _) =>
            {
                frame++;
                var progress = Math.Min(1.0, frame / (double)frameCount);
                var eased = 1 - Math.Pow(1 - progress, 3);
                front.Data = FolderFrontGeometry(151 + (int)Math.Round(34 * eased));
                foreach (var preview in previews)
                    Canvas.SetTop(preview, 176 - 58 * eased);
                if (frame >= frameCount)
                    animation.Stop();
            };
            animation.Start();
            args.Handled = true;
        };
        return scene;
    }

    private static Geometry FolderFrontGeometry(int top) =>
        Geometry.Parse($"M 82 {top} L 446 {top} L 433 269 Q 432 278 422 278 L 105 278 Q 96 278 94 269 Z");

    private static Path CreateFolderBack() => new()
    {
        Data = Geometry.Parse("M 78 132 L 78 113 Q 78 106 86 106 L 181 106 L 201 128 L 438 128 Q 449 128 449 139 L 449 267 Q 449 277 438 277 L 89 277 Q 78 277 78 267 Z"),
        Fill = ColorBrush("#DCA23C"),
        Stroke = ColorBrush("#AA711E"),
        StrokeThickness = 2
    };

    private static Path CreateFolderFront() => new()
    {
        Data = FolderFrontGeometry(151),
        Fill = ColorBrush("#F8C958"),
        Stroke = ColorBrush("#B67B20"),
        StrokeThickness = 2
    };

    private static Border CreateFolderIcon()
    {
        var icon = new Canvas { Width = 372, Height = 173, ClipToBounds = true };
        var back = CreateFolderBack();
        var front = CreateFolderFront();
        back.RenderTransform = new TranslateTransform(-78, -106);
        front.RenderTransform = new TranslateTransform(-78, -106);
        icon.Children.Add(back);
        icon.Children.Add(front);

        return new Border
        {
            Width = 150,
            Height = 125,
            Background = ColorBrush("#FFFFFF"),
            CornerRadius = new CornerRadius(10),
            Child = new StackPanel
            {
                Spacing = 5,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                Children =
                {
                    new Viewbox { Width = 136, Height = 68, Child = icon },
                    new TextBlock
                    {
                        Text = "Images",
                        FontSize = 17,
                        FontWeight = FontWeight.SemiBold,
                        Foreground = ColorBrush("#17345C"),
                        HorizontalAlignment = HorizontalAlignment.Center
                    }
                }
            }
        };
    }

    private Control BuildDragExercise()
    {
        const double fileStartLeft = 16;
        const double fileStartTop = 58;
        const double folderLeft = 330;
        const double folderTop = 70;
        var canvas = new Canvas
        {
            Width = 500,
            Height = 260,
            ClipToBounds = true,
            Background = ColorBrush("#F1F5FC")
        };
        var file = new Border
        {
            Width = 125,
            Height = 145,
            Background = ColorBrush("#FFFFFF"),
            BorderBrush = ColorBrush("#8CAAD3"),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(6),
            Child = new StackPanel
            {
                Spacing = 4,
                HorizontalAlignment = HorizontalAlignment.Center,
                Children =
                {
                    new Image
                    {
                        Source = new Bitmap(AssetLoader.Open(new Uri("avares://Souris/Assets/ballon-plage.png"))),
                        Width = 105,
                        Height = 105,
                        Stretch = Stretch.UniformToFill
                    },
                    new TextBlock
                    {
                        Text = "ballon.jpg",
                        FontSize = 16,
                        FontWeight = FontWeight.SemiBold,
                        Foreground = ColorBrush("#17345C"),
                        HorizontalAlignment = HorizontalAlignment.Center
                    }
                }
            }
        };
        var folder = CreateFolderIcon();
        Canvas.SetLeft(file, fileStartLeft);
        Canvas.SetTop(file, fileStartTop);
        Canvas.SetLeft(folder, folderLeft);
        Canvas.SetTop(folder, folderTop);
        canvas.Children.Add(folder);
        canvas.Children.Add(file);

        var dragging = false;
        var offset = new Point();
        bool FileOverFolder()
        {
            var centerX = Canvas.GetLeft(file) + file.Width / 2;
            var centerY = Canvas.GetTop(file) + file.Height / 2;
            return centerX >= folderLeft && centerX <= folderLeft + folder.Width
                && centerY >= folderTop && centerY <= folderTop + folder.Height;
        }

        file.PointerPressed += (_, args) =>
        {
            if (!args.GetCurrentPoint(file).Properties.IsLeftButtonPressed) return;
            dragging = true;
            var point = args.GetPosition(canvas);
            offset = new Point(point.X - Canvas.GetLeft(file), point.Y - Canvas.GetTop(file));
            args.Pointer.Capture(file);
            args.Handled = true;
        };
        file.PointerMoved += (_, args) =>
        {
            if (!dragging) return;
            var point = args.GetPosition(canvas);
            Canvas.SetLeft(file, Math.Clamp(point.X - offset.X, 0, canvas.Width - file.Width));
            Canvas.SetTop(file, Math.Clamp(point.Y - offset.Y, 0, canvas.Height - file.Height));
            folder.Background = ColorBrush(FileOverFolder() ? "#CDEEDB" : "#FFFFFF");
        };
        file.PointerReleased += (_, args) =>
        {
            if (!dragging) return;
            dragging = false;
            args.Pointer.Capture(null);
            if (FileOverFolder())
            {
                file.IsVisible = false;
                folder.Background = ColorBrush("#CDEEDB");
                CompleteExercise();
            }
            else
            {
                Canvas.SetLeft(file, fileStartLeft);
                Canvas.SetTop(file, fileStartTop);
                folder.Background = ColorBrush("#FFFFFF");
                ShowTryAgain();
            }
        };
        return canvas;
    }

    private Control BuildTextSelectionExercise()
    {
        var box = new TextBox
        {
            Text = "La petite barre clignote dans la zone où tu écris.",
            IsReadOnly = true,
            FontSize = 23,
            TextWrapping = TextWrapping.Wrap,
            MinHeight = 140,
            Padding = new Thickness(18),
            VerticalContentAlignment = VerticalAlignment.Center
        };
        box.PropertyChanged += (_, args) =>
        {
            if ((args.Property == TextBox.SelectionStartProperty || args.Property == TextBox.SelectionEndProperty)
                && box.SelectedText?.Trim().Equals("petite barre", StringComparison.OrdinalIgnoreCase) == true)
                CompleteExercise();
        };
        return box;
    }

    private Control BuildHoverExercise(string[] actions, string targetAction)
    {
        var scene = new Canvas
        {
            Width = 520,
            Height = 240,
            ClipToBounds = true,
            Background = ColorBrush("#F1F5FC"),
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
        var tooltipText = new TextBlock
        {
            FontSize = 17,
            Foreground = ColorBrush("#443914"),
            TextWrapping = TextWrapping.Wrap
        };
        var bubble = new Border
        {
            Width = 300,
            IsVisible = false,
            IsHitTestVisible = false,
            Background = ColorBrush("#FFF6D9"),
            BorderBrush = ColorBrush("#D7BA68"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(12),
            Child = tooltipText
        };
        var targetIndex = Array.IndexOf(actions, targetAction);
        var tooltipSeen = new bool[actions.Length];
        var hoveredIndex = -1;
        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(1000) };
        _hoverTimer = timer;
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            if (hoveredIndex < 0) return;
            tooltipSeen[hoveredIndex] = true;
            var action = actions[hoveredIndex];
            tooltipText.Text = char.ToUpperInvariant(action[0]) + action[1..] + ".";
            Canvas.SetLeft(bubble, 28 + hoveredIndex * 82);
            Canvas.SetTop(bubble, 145);
            bubble.IsVisible = true;
        };
        for (var index = 0; index < actions.Length; index++)
        {
            var buttonIndex = index;
            var button = new Button
            {
                Content = new[] { "A", "B", "C" }[index],
                FontSize = 25,
                FontWeight = FontWeight.Bold,
                Width = 110,
                Height = 70
            };
            button.Classes.Add("primary");
            Canvas.SetLeft(button, 35 + index * 170);
            Canvas.SetTop(button, 45);
            scene.Children.Add(button);

            void RestartTooltip()
            {
                hoveredIndex = buttonIndex;
                bubble.IsVisible = false;
                timer.Stop();
                timer.Start();
            }
            button.PointerEntered += (_, _) => RestartTooltip();
            button.PointerMoved += (_, _) => RestartTooltip();
            button.PointerExited += (_, _) =>
            {
                if (hoveredIndex != buttonIndex) return;
                hoveredIndex = -1;
                timer.Stop();
                bubble.IsVisible = false;
            };
            button.Click += (_, _) =>
            {
                if (buttonIndex == targetIndex && tooltipSeen[buttonIndex])
                    CompleteExercise();
                else if (_exerciseFeedback is not null && !_completed.Contains(_sectionIndex))
                    _exerciseFeedback.Text = !tooltipSeen[buttonIndex]
                        ? "Attends que l’info-bulle de ce bouton apparaisse avant de choisir."
                        : "Ce n’est pas le bon bouton. Lis les autres info-bulles.";
            };
        }
        scene.Children.Add(bubble);
        return scene;
    }
}
