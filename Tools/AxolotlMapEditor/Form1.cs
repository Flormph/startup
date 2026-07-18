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

    private Panel gridPanel = null!;
    private ComboBox areaComboBox = null!;
    private ComboBox roomComboBox = null!;

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
        this.ClientSize = new Size(1000, 700);
        this.DoubleBuffered = true; // Reduce flickering

        BuildLayout();
        BuildMenuBar();
    }

    private void BuildMenuBar()
    {
        var menuStrip = new MenuStrip();
        menuStrip.Dock = DockStyle.Top;

        var fileMenu = new ToolStripMenuItem("File");

        var newItem = new ToolStripMenuItem("New Project");
        newItem.Click += NewProject_Click;

        var openItem = new ToolStripMenuItem("Open Project");
        openItem.Click += OpenProject_Click;

        var saveItem = new ToolStripMenuItem("Save Project");
        saveItem.Click += SaveProject_Click;

        var saveAsItem = new ToolStripMenuItem("Save Project As...");
        saveAsItem.Click += SaveProjectAs_Click;

        var exportRoomItem = new ToolStripMenuItem("Export Room...");
        exportRoomItem.Click += ExportRoom_Click;

        var exportAreaItem = new ToolStripMenuItem("Export Area...");
        exportAreaItem.Click += ExportArea_Click;

        var exportGameItem = new ToolStripMenuItem("Export Game...");
        exportGameItem.Click += ExportGame_Click;

        fileMenu.DropDownItems.Add(newItem);
        fileMenu.DropDownItems.Add(openItem);
        fileMenu.DropDownItems.Add(new ToolStripSeparator());
        fileMenu.DropDownItems.Add(saveItem);
        fileMenu.DropDownItems.Add(saveAsItem);
        fileMenu.DropDownItems.Add(new ToolStripSeparator());
        fileMenu.DropDownItems.Add(exportRoomItem);
        fileMenu.DropDownItems.Add(exportAreaItem);
        fileMenu.DropDownItems.Add(exportGameItem);

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

    private void BuildLayout()
    {
        var verticalSplit = new SplitContainer
        {
            Dock = DockStyle.Fill,
            Orientation = Orientation.Horizontal,
        };

        var leftSplit = new SplitContainer
        {
            Dock = DockStyle.Fill,
            Orientation = Orientation.Vertical,
        };

        var rightSplit = new SplitContainer
        {
            Dock = DockStyle.Fill,
            Orientation = Orientation.Vertical,
        };

        leftSplit.Panel1.Controls.Add(BuildPalettePanel());

        gridPanel = new Panel { Dock = DockStyle.Fill, BackColor = Color.White };
        gridPanel.Paint += GridPanel_Paint;
        gridPanel.MouseClick += GridPanel_MouseClick;
        rightSplit.Panel1.Controls.Add(gridPanel);

        rightSplit.Panel2.Controls.Add(BuildAreasRoomsPanel());

        leftSplit.Panel2.Controls.Add(rightSplit);

        verticalSplit.Panel1.Controls.Add(leftSplit);
        verticalSplit.Panel2.Controls.Add(BuildInfoPanel());

        this.Controls.Add(verticalSplit);
        this.Load += (s, e) =>
        {
            leftSplit.SplitterDistance = 140;
            rightSplit.SplitterDistance = Math.Max(rightSplit.Panel1MinSize, rightSplit.Width - 200);
            verticalSplit.SplitterDistance = 500;
        };
    }

    private Panel BuildPalettePanel()
    {
        var panel = new Panel { Dock = DockStyle.Fill, AutoScroll = true };

        var tileTypes = new[]
        {
        TileType.Empty, TileType.Wall, TileType.ExitLeft, TileType.ExitRight,
        TileType.ExitUp, TileType.ExitDown, TileType.ExitOverride, TileType.Teleport,
        TileType.PlayerSpawn, TileType.EnemySpawn, TileType.ItemSpawn,
    };

        int y = 40;
        foreach (var type in tileTypes)
        {
            var button = new Button
            {
                Text = type.ToString(),
                Location = new Point(5, y),
                Size = new Size(90, 28),
                Tag = type,
            };
            button.Click += PaletteButton_Click;
            panel.Controls.Add(button);
            y += 33;
        }

        return panel;
    }

    private Panel BuildInfoPanel()
    {
        var panel = new Panel { Dock = DockStyle.Fill };
        var label = new Label
        {
            Text = "Room / Project Info (music, sprite sheet, palette colors — coming next)",
            Location = new Point(10, 10),
            AutoSize = true,
        };
        panel.Controls.Add(label);
        return panel;
    }

    private void PaletteButton_Click(object? sender, EventArgs e)
    {
        var button = (Button)sender!;
        if (button.Tag is TileType type) selectedTileType = type;
    }

    private void GridPanel_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        var room = CurrentRoom;

        for (int y = 0; y < GridHeight; y++)
        {
            for (int x = 0; x < GridWidth; x++)
            {
                var tile = room.Tiles[y][x];
                var rect = new Rectangle(x * CellSize, y * CellSize, CellSize, CellSize);
                g.FillRectangle(new SolidBrush(GetColorForTile(tile.Type)), rect);
                g.DrawRectangle(Pens.Gray, rect);
            }
        }
    }

    private void GridPanel_MouseClick(object? sender, MouseEventArgs e)
    {
        int x = e.X / CellSize;
        int y = e.Y / CellSize;

        if (x < 0 || x >= GridWidth || y < 0 || y >= GridHeight) return;

        CurrentRoom.Tiles[y][x] = new Tile(selectedTileType);
        gridPanel.Invalidate();
    }

    private Panel BuildAreasRoomsPanel()
    {
        var panel = new Panel { Dock = DockStyle.Fill };

        var areaLabel = new Label { Text = "Area:", Location = new Point(10, 10), AutoSize = true };
        areaComboBox = new ComboBox
        {
            Location = new Point(10, 40),
            Width = 150,
            DropDownStyle = ComboBoxStyle.DropDownList, // prevents free-typing, only allows picking from the list
        };
        areaComboBox.SelectedIndexChanged += AreaComboBox_SelectedIndexChanged;

        var roomLabel = new Label { Text = "Room:", Location = new Point(10, 75), AutoSize = true };
        roomComboBox = new ComboBox
        {
            Location = new Point(10, 95),
            Width = 150,
            DropDownStyle = ComboBoxStyle.DropDownList,
        };
        roomComboBox.SelectedIndexChanged += RoomComboBox_SelectedIndexChanged;

        panel.Controls.Add(areaLabel);
        panel.Controls.Add(areaComboBox);
        panel.Controls.Add(roomLabel);
        panel.Controls.Add(roomComboBox);

        RefreshAreaComboBox();

        return panel;
    }

    private void RefreshAreaComboBox()
    {
        areaComboBox.Items.Clear();
        foreach (var key in currentGame.Areas.Keys)
            areaComboBox.Items.Add(key);
        areaComboBox.SelectedItem = currentAreaKey;
    }

    private void RefreshRoomComboBox()
    {
        roomComboBox.Items.Clear();
        foreach (var key in currentGame.Areas[currentAreaKey].Rooms.Keys)
            roomComboBox.Items.Add(key);
        roomComboBox.SelectedItem = currentRoomKey;
    }

    private void AreaComboBox_SelectedIndexChanged(object? sender, EventArgs e)
    {
        if (areaComboBox.SelectedItem is not string selected) return;
        currentAreaKey = selected;
        currentRoomKey = currentGame.Areas[currentAreaKey].Rooms.Keys.First();
        RefreshRoomComboBox();
        gridPanel.Invalidate();
    }

    private void RoomComboBox_SelectedIndexChanged(object? sender, EventArgs e)
    {
        if (roomComboBox.SelectedItem is not string selected) return;
        currentRoomKey = selected;
        gridPanel.Invalidate();
    }

    private RoomData CurrentRoom => currentGame.Areas[currentAreaKey].Rooms[currentRoomKey];

    private void ExportRoom_Click(object? sender, EventArgs e)
    {
        var exporter = exporters[0]; // format selection UI still TODO

        using var dialog = new SaveFileDialog
        {
            Filter = $"{exporter.FormatName}|*{exporter.FileExtension}",
            FileName = $"{currentRoomKey}{exporter.FileExtension}",
        };

        if (dialog.ShowDialog() != DialogResult.OK) return;

        File.WriteAllText(dialog.FileName, exporter.ExportMap(CurrentRoom));
        MessageBox.Show("Room exported!", "Export");
    }

    private void ExportArea_Click(object? sender, EventArgs e)
    {
        var exporter = exporters[0];

        using var folderDialog = new FolderBrowserDialog { Description = "Choose export destination" };
        if (folderDialog.ShowDialog() != DialogResult.OK) return;

        BatchExporter.ExportArea(currentGame.Areas[currentAreaKey], exporter, folderDialog.SelectedPath);
        MessageBox.Show("Area exported!", "Export");
    }

    private void ExportGame_Click(object? sender, EventArgs e)
    {
        var exporter = exporters[0];

        using var folderDialog = new FolderBrowserDialog { Description = "Choose export destination" };
        if (folderDialog.ShowDialog() != DialogResult.OK) return;

        BatchExporter.ExportGameMap(currentGame, exporter, folderDialog.SelectedPath);
        MessageBox.Show("Game exported!", "Export");
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
}
