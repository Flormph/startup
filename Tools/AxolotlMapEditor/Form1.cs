namespace AxolotlMapEditor;

using System.Drawing;
using System.Windows.Forms;

public partial class Form1 : Form
{
    private const int GridWidth = 30;
    private const int GridHeight = 17;
    private const int CellSize = 20;
    private const int PaletteHeight = 40;
    private const int MenuHeight = 24; // Height of the menu bar

    private GameMapData currentGame;
    private string currentAreaKey;
    private string currentRoomKey;
    private string? currentProjectPath = null; // Path to the current project file, if any

    private TileType selectedTileType = TileType.Wall;
    private readonly List<IMapExporter> exporters = new List<IMapExporter>
    {
        new JsStringArrayExporter(),
        new AxmapExporter(),
    };

    public Form1()
    {
        currentGame = new GameMapData();
        var startingArea = new AreaData { Name = "New Area" };
        var startingRoom = new RoomData(GridWidth, GridHeight);
        startingArea.Rooms["0,0"] = startingRoom;
        currentGame.Areas["New Area"] = startingArea;
        currentAreaKey = "New Area";
        currentRoomKey = "0,0";

        this.Text = "Axolotl Map Editor";
        this.ClientSize = new Size(GridWidth * CellSize + 20, GridHeight * CellSize + 20);
        this.DoubleBuffered = true; // Reduce flickering

        BuildMenuBar();
        BuildPalette();
        BuildExportButton();

        this.Paint += Form1_Paint;
        this.MouseClick += Form1_MouseClick;
    }

    private void BuildMenuBar()
    {
        var menuStrip = new MenuStrip();

        var fileMenu = new ToolStripMenuItem("File");

        var newItem = new ToolStripMenuItem("New Project");
        newItem.Click += NewProject_Click;

        var openItem = new ToolStripMenuItem("Open Project");
        openItem.Click += OpenProject_Click;

        var saveItem = new ToolStripMenuItem("Save Project");
        saveItem.Click += SaveProject_Click;

        var saveAsItem = new ToolStripMenuItem("Save Project As...");
        saveAsItem.Click += SaveProjectAs_Click;

        fileMenu.DropDownItems.Add(newItem);
        fileMenu.DropDownItems.Add(openItem);
        fileMenu.DropDownItems.Add(new ToolStripSeparator());
        fileMenu.DropDownItems.Add(saveItem);
        fileMenu.DropDownItems.Add(saveAsItem);

        var editMenu = new ToolStripMenuItem("Edit");
        editMenu.DropDownItems.Add(new ToolStripMenuItem("Undo") { Enabled = false });
        editMenu.DropDownItems.Add(new ToolStripMenuItem("Redo") { Enabled = false });

        var viewMenu = new ToolStripMenuItem("View");
        viewMenu.DropDownItems.Add(new ToolStripMenuItem("Zoom In") { Enabled = false });
        viewMenu.DropDownItems.Add(new ToolStripMenuItem("Zoom Out") { Enabled = false });

        menuStrip.Items.Add(fileMenu);
        menuStrip.Items.Add(editMenu);
        menuStrip.Items.Add(viewMenu);
        this.MainMenuStrip = menuStrip;
        this.Controls.Add(menuStrip);
    }

    private void NewProject_Click(object? sender, EventArgs e)
    {
        var result = MessageBox.Show("Discard current project and start a new one?", "New Project", MessageBoxButtons.YesNo);
        if (result != DialogResult.Yes) return;

        currentGame = new GameMapData();
        var startingArea = new AreaData { Name = "New Area" };
        var startingRoom = new RoomData(GridWidth, GridHeight);
        startingArea.Rooms["0,0"] = startingRoom;
        currentGame.Areas["New Area"] = startingArea;
        currentAreaKey = "New Area";
        currentRoomKey = "0,0";
        currentProjectPath = null; // Reset the project path

        this.Invalidate(); // Redraw the form
    }

    private void OpenProject_Click(object? sender, EventArgs e)
    {
        using var dialog = new OpenFileDialog
        {
            Filter = "Axolotl Project (*.axproj)|*.axproj|All files (*.*)|*.*",
            Title = "Open Axolotl Project"
        };

        if (dialog.ShowDialog() != DialogResult.OK) return;

        currentGame = ProjectFile.Load(dialog.FileName);
        currentAreaKey = currentGame.Areas.Keys.First();
        currentRoomKey = currentGame.Areas[currentAreaKey].Rooms.Keys.First();
        currentProjectPath = dialog.FileName; // Store the path of the opened project

        this.Invalidate(); // Redraw the form
    }

    private void SaveProject_Click(object? sender, EventArgs e)
    {
        if (currentProjectPath == null)
        {
            SaveProjectAs_Click(sender, e);
            return;
        }

        ProjectFile.Save(currentGame, currentProjectPath);
    }

    private void SaveProjectAs_Click(object? sender, EventArgs e)
    {
        using var dialog = new SaveFileDialog
        {
            Filter = "Axolotl Project (*.axproj)|*.axproj|All files (*.*)|*.*",
            Title = "Save Axolotl Project As"
        };

        if (dialog.ShowDialog() != DialogResult.OK) return;

        currentProjectPath = dialog.FileName;
        ProjectFile.Save(currentGame, currentProjectPath);
    }

    private RoomData CurrentRoom => currentGame.Areas[currentAreaKey].Rooms[currentRoomKey];

    private void BuildExportButton()
    {
        var exportButton = new Button
        {
            Text = "Export Map",
            Location = new Point(10, GridHeight * CellSize + PaletteHeight + 10),
            Size = new Size(100, 30)
        };
        exportButton.Click += ExportButton_Click;
        this.Controls.Add(exportButton);
    }

    private void ExportButton_Click(object? sender, EventArgs e)
    {
        var exporter = exporters[0]; // format selection UI comes later — for now, hardcoded to JSON

        using var folderDialog = new FolderBrowserDialog
        {
            Description = "Choose export destination",
        };

        if (folderDialog.ShowDialog() != DialogResult.OK) return;

        // for now, always exports the whole current Game — scope selection (Room/Area/Game) comes next
        BatchExporter.ExportGameMap(currentGame, exporter, folderDialog.SelectedPath);

        MessageBox.Show("Export complete!", "Export");
    }

    private void BuildPalette()
    {
        var tileTypes = new[]
        {
            TileType.Empty,
            TileType.Wall,
            TileType.ExitLeft,
            TileType.ExitRight,
            TileType.ExitUp,
            TileType.ExitDown,
            TileType.ExitOverride,
            TileType.Teleport,
            TileType.PlayerSpawn,
            TileType.EnemySpawn,
            TileType.ItemSpawn
        };

        int buttonWidth = 70;
        int x = 10;

        foreach (var type in tileTypes)
        {
            var button = new Button
            {
                Text = type.ToString(),
                Location = new Point(x, GridHeight * CellSize + 10),
                Size = new Size(buttonWidth, PaletteHeight - 10),
                Tag = type // Store the tile type in the button's Tag property
            };
            button.Click += PaletteButton_Click;
            this.Controls.Add(button);

            x += buttonWidth + 5;
        }
    }

    private void PaletteButton_Click(object? sender, EventArgs e)
    {
        var button = (Button)sender!;
        if (button.Tag is TileType type)
        {
            selectedTileType = type;
        }
    }

    private void Form1_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;

        // Draw grid
        for (int x = 0; x < GridWidth; x++)
        {
            for (int y = 0; y < GridHeight; y++)
            {
                var tile = CurrentRoom.Tiles[y][x];
                var color = GetColorForTile(tile.Type);

                var rect = new Rectangle(x * CellSize, y * CellSize, CellSize, CellSize);
                g.FillRectangle(new SolidBrush(color), rect);
                g.DrawRectangle(Pens.Black, rect);
            }
        }
    }

    private Color GetColorForTile(TileType type)
    {
        switch (type)
        {
            case TileType.Empty: return Color.White;
            case TileType.Wall: return Color.SaddleBrown;
            case TileType.ExitLeft:
            case TileType.ExitRight:
            case TileType.ExitUp:
            case TileType.ExitDown: return Color.Gold;
            case TileType.Teleport: return Color.Purple;
            case TileType.EnemySpawn: return Color.Red;
            case TileType.ItemSpawn: return Color.LimeGreen;
            case TileType.PlayerSpawn: return Color.DodgerBlue;
            default: return Color.LightGray;
        }
    }

    private void Form1_MouseClick(object? sender, MouseEventArgs e)
    {
        int x = e.X / CellSize;
        int y = e.Y / CellSize;

        if (x < 0 || x >= GridWidth || y < 0 || y >= GridHeight) return;

        CurrentRoom.Tiles[y][x] = new Tile(selectedTileType);
        this.Invalidate(); // Redraw the form
    }
}
