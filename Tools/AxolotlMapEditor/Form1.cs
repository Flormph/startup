namespace AxolotlMapEditor;

using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

public enum DrawingTool
{
    Pencil,
    Rectangle,
    Fill,
    Eraser,
    Select,
}

public partial class Form1 : Form
{
    private const int GridWidth = 30;
    private const int GridHeight = 17;
    private const int BaseCellSize = 40;
    private const int PaletteHeight = 40;
    private const int MenuHeight = 24; // Height of the menu bar

    private GameMapData currentGame;
    private string currentAreaKey;
    private string currentRoomKey;
    private string? currentProjectPath = null; // Path to the current project file, if any
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "AxolotlMapEditor", "settings.txt");

    private TileType selectedTileType = TileType.Wall;
    private DrawingTool currentTool = DrawingTool.Pencil;
    private int zoomLevel = 1; // 1x, 2x, 3x, etc
    private int panX = 0;
    private int panY = 0;
    private bool isDrawing = false;
    private Point lastDrawnCell = new Point(-1, -1);
    private Point rectangleStartCell = new Point(-1, -1);
    private Point selectedTileCell = new Point(-1, -1); // For select tool

    // Undo/Redo system
    private Stack<RoomData> undoStack = new Stack<RoomData>();
    private Stack<RoomData> redoStack = new Stack<RoomData>();

    private readonly List<IMapExporter> exporters = new List<IMapExporter>
    {
        new JsStringArrayExporter(),
        new AxmapExporter(),
    };

    private Panel gridPanel = null!;
    private ComboBox areaComboBox = null!;
    private ComboBox roomComboBox = null!;
    private Label toolStatusLabel = null!;

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
        this.ClientSize = new Size(1200, 800);
        this.DoubleBuffered = true; // Reduce flickering
        this.KeyPreview = true;
        this.KeyDown += Form1_KeyDown;

        BuildLayout();
        BuildMenuBar();
        UpdateToolStatus();

        // Auto-open most recent project
        this.Load += (s, e) => TryLoadRecentProject();
    }

    private void TryLoadRecentProject()
    {
        try
        {
            if (!File.Exists(SettingsPath)) return;
            string lastPath = File.ReadAllText(SettingsPath).Trim();
            if (!File.Exists(lastPath)) return;

            currentGame = ProjectFile.Load(lastPath);
            currentAreaKey = currentGame.Areas.Keys.First();
            currentRoomKey = currentGame.Areas[currentAreaKey].Rooms.Keys.First();
            currentProjectPath = lastPath;

            undoStack.Clear();
            redoStack.Clear();
            RefreshAreaComboBox();
            RefreshRoomComboBox();
            gridPanel.Invalidate();
            this.Text = $"Axolotl Map Editor - {Path.GetFileName(lastPath)}";
        }
        catch { /* silently ignore if anything goes wrong */ }
    }

    private void SaveRecentProject(string path)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(SettingsPath)!);
            File.WriteAllText(SettingsPath, path);
        }
        catch { }
    }

    private int CellSize => BaseCellSize * zoomLevel;

    private void Form1_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode == Keys.P) { currentTool = DrawingTool.Pencil; UpdateToolStatus(); e.Handled = true; }
        else if (e.KeyCode == Keys.R) { currentTool = DrawingTool.Rectangle; UpdateToolStatus(); e.Handled = true; }
        else if (e.KeyCode == Keys.F) { currentTool = DrawingTool.Fill; UpdateToolStatus(); e.Handled = true; }
        else if (e.KeyCode == Keys.E) { currentTool = DrawingTool.Eraser; UpdateToolStatus(); e.Handled = true; }
        else if (e.KeyCode == Keys.S) { currentTool = DrawingTool.Select; UpdateToolStatus(); e.Handled = true; }
        else if (e.KeyCode == Keys.Z && e.Control) { Undo(); e.Handled = true; }
        else if (e.KeyCode == Keys.Y && e.Control) { Redo(); e.Handled = true; }
        else if (e.KeyCode == Keys.Add) { ZoomIn(); e.Handled = true; }
        else if (e.KeyCode == Keys.Subtract) { ZoomOut(); e.Handled = true; }
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
        var undoItem = new ToolStripMenuItem("Undo (Ctrl+Z)");
        undoItem.Click += (s, e) => Undo();
        var redoItem = new ToolStripMenuItem("Redo (Ctrl+Y)");
        redoItem.Click += (s, e) => Redo();
        editMenu.DropDownItems.Add(undoItem);
        editMenu.DropDownItems.Add(redoItem);

        var viewMenu = new ToolStripMenuItem("View");
        var zoomInItem = new ToolStripMenuItem("Zoom In (+)");
        zoomInItem.Click += (s, e) => ZoomIn();
        var zoomOutItem = new ToolStripMenuItem("Zoom Out (-)");
        zoomOutItem.Click += (s, e) => ZoomOut();
        var resetViewItem = new ToolStripMenuItem("Reset View");
        resetViewItem.Click += (s, e) => ResetView();
        viewMenu.DropDownItems.Add(zoomInItem);
        viewMenu.DropDownItems.Add(zoomOutItem);
        viewMenu.DropDownItems.Add(new ToolStripSeparator());
        viewMenu.DropDownItems.Add(resetViewItem);

        var toolsMenu = new ToolStripMenuItem("Tools");
        var pencilItem = new ToolStripMenuItem("Pencil (P)");
        pencilItem.Click += (s, e) => { currentTool = DrawingTool.Pencil; UpdateToolStatus(); };
        var rectItem = new ToolStripMenuItem("Rectangle (R)");
        rectItem.Click += (s, e) => { currentTool = DrawingTool.Rectangle; UpdateToolStatus(); };
        var fillItem = new ToolStripMenuItem("Bucket Fill (F)");
        fillItem.Click += (s, e) => { currentTool = DrawingTool.Fill; UpdateToolStatus(); };
        var eraserItem = new ToolStripMenuItem("Eraser (E)");
        eraserItem.Click += (s, e) => { currentTool = DrawingTool.Eraser; UpdateToolStatus(); };
        var selectItem = new ToolStripMenuItem("Select (S)");
        selectItem.Click += (s, e) => { currentTool = DrawingTool.Select; UpdateToolStatus(); };
        toolsMenu.DropDownItems.Add(pencilItem);
        toolsMenu.DropDownItems.Add(rectItem);
        toolsMenu.DropDownItems.Add(fillItem);
        toolsMenu.DropDownItems.Add(eraserItem);
        toolsMenu.DropDownItems.Add(selectItem);

        menuStrip.Items.Add(fileMenu);
        menuStrip.Items.Add(editMenu);
        menuStrip.Items.Add(viewMenu);
        menuStrip.Items.Add(toolsMenu);
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

        undoStack.Clear();
        redoStack.Clear();
        RefreshAreaComboBox();
        RefreshRoomComboBox();
        gridPanel.Invalidate();
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
        SaveRecentProject(dialog.FileName);
        this.Text = $"Axolotl Map Editor - {Path.GetFileName(dialog.FileName)}";

        undoStack.Clear();
        redoStack.Clear();
        RefreshAreaComboBox();
        RefreshRoomComboBox();
        gridPanel.Invalidate();
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
        SaveRecentProject(currentProjectPath);
        this.Text = $"Axolotl Map Editor - {Path.GetFileName(currentProjectPath)}";
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

        gridPanel = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, AutoScroll = true };
        gridPanel.Paint += GridPanel_Paint;
        gridPanel.MouseDown += GridPanel_MouseDown;
        gridPanel.MouseMove += GridPanel_MouseMove;
        gridPanel.MouseUp += GridPanel_MouseUp;
        gridPanel.MouseWheel += GridPanel_MouseWheel;
        rightSplit.Panel1.Controls.Add(gridPanel);

        rightSplit.Panel2.Controls.Add(BuildAreasRoomsPanel());

        leftSplit.Panel2.Controls.Add(rightSplit);

        verticalSplit.Panel1.Controls.Add(leftSplit);
        verticalSplit.Panel2.Controls.Add(BuildInfoPanel());

        this.Controls.Add(verticalSplit);
        this.Load += (s, e) =>
        {
            leftSplit.SplitterDistance = 160;
            rightSplit.SplitterDistance = Math.Max(rightSplit.Panel1MinSize, rightSplit.Width - 200);
            verticalSplit.SplitterDistance = 500;
        };
    }

    private Panel BuildPalettePanel()
    {
        var panel = new Panel { Dock = DockStyle.Fill, AutoScroll = true };

        int y = 10;

        // Tools Section
        var toolsLabel = new Label { Text = "TOOLS", Location = new Point(5, y), AutoSize = true, Font = new Font(this.Font, FontStyle.Bold) };
        panel.Controls.Add(toolsLabel);
        y += 25;

        var tools = new[] { ("Pencil (P)", DrawingTool.Pencil), ("Rectangle (R)", DrawingTool.Rectangle), ("Fill (F)", DrawingTool.Fill), ("Eraser (E)", DrawingTool.Eraser), ("Select (S)", DrawingTool.Select) };
        foreach (var (label, tool) in tools)
        {
            var button = new Button
            {
                Text = label,
                Location = new Point(5, y),
                Size = new Size(120, 28),
                Tag = tool,
            };
            button.Click += ToolButton_Click;
            panel.Controls.Add(button);
            y += 33;
        }

        y += 15;

        // Tile Palette Section
        var tileLabel = new Label { Text = "TILES", Location = new Point(5, y), AutoSize = true, Font = new Font(this.Font, FontStyle.Bold) };
        panel.Controls.Add(tileLabel);
        y += 25;

        var tileTypes = new[]
        {
            TileType.Empty, TileType.Wall, TileType.ExitLeft, TileType.ExitRight,
            TileType.ExitUp, TileType.ExitDown, TileType.ExitOverride, TileType.Teleport,
            TileType.PlayerSpawn, TileType.EnemySpawn, TileType.ItemSpawn,
        };

        foreach (var type in tileTypes)
        {
            var button = new Button
            {
                Text = type.ToString(),
                Location = new Point(5, y),
                Size = new Size(115, 28),
                Tag = type,
            };
            button.Click += PaletteButton_Click;
            panel.Controls.Add(button);
            y += 33;
        }

        y += 15;

        // Template Section
        var templateLabel = new Label { Text = "TEMPLATES", Location = new Point(5, y), AutoSize = true, Font = new Font(this.Font, FontStyle.Bold) };
        panel.Controls.Add(templateLabel);
        y += 25;

        var templates = new[] { ("Fill Edges", TemplateType.FillEdges), ("Fill Ground", TemplateType.FillGround), ("Fill All", TemplateType.FillAll), ("Clear All", TemplateType.ClearAll) };
        foreach (var (label, template) in templates)
        {
            var button = new Button
            {
                Text = label,
                Location = new Point(5, y),
                Size = new Size(120, 28),
                Tag = template,
            };
            button.Click += TemplateButton_Click;
            panel.Controls.Add(button);
            y += 33;
        }

        return panel;
    }

    private enum TemplateType { FillEdges, FillGround, FillAll, ClearAll }

    private Panel BuildInfoPanel()
    {
        var panel = new Panel { Dock = DockStyle.Fill };

        toolStatusLabel = new Label
        {
            Text = "Current Tool: Pencil",
            Location = new Point(10, 10),
            AutoSize = true,
            Font = new Font(this.Font, FontStyle.Bold),
        };
        panel.Controls.Add(toolStatusLabel);

        var infoLabel = new Label
        {
            Text = "Zoom: Ctrl++/- or +/- key\nPan: Scroll wheel\nRoom / Project Info (music, sprite sheet, palette colors — coming next)",
            Location = new Point(10, 40),
            AutoSize = true,
        };
        panel.Controls.Add(infoLabel);

        return panel;
    }

    private void UpdateToolStatus()
    {
        string toolName = currentTool switch
        {
            DrawingTool.Pencil => "Pencil",
            DrawingTool.Rectangle => "Rectangle",
            DrawingTool.Fill => "Fill",
            DrawingTool.Eraser => "Eraser",
            DrawingTool.Select => "Select",
            _ => "Unknown"
        };

        string tileType = selectedTileType.ToString();
        toolStatusLabel.Text = $"Tool: {toolName} | Tile: {tileType} | Zoom: {zoomLevel}x";
    }

    private void ToolButton_Click(object? sender, EventArgs e)
    {
        var button = (Button)sender!;
        if (button.Tag is DrawingTool tool)
        {
            currentTool = tool;
            UpdateToolStatus();
        }
    }

    private void PaletteButton_Click(object? sender, EventArgs e)
    {
        var button = (Button)sender!;
        if (button.Tag is TileType type)
        {
            selectedTileType = type;
            UpdateToolStatus();
        }
    }

    private void TemplateButton_Click(object? sender, EventArgs e)
    {
        var button = (Button)sender!;
        if (button.Tag is TemplateType templateType)
        {
            SaveUndo();
            ApplyTemplate(templateType);
            gridPanel.Invalidate();
        }
    }

    private void ApplyTemplate(TemplateType template)
    {
        var room = CurrentRoom;
        var fillTile = new Tile(TileType.Wall);
        var emptyTile = new Tile(TileType.Empty);

        switch (template)
        {
            case TemplateType.FillEdges:
                // Fill top and bottom rows, left and right columns
                for (int x = 0; x < GridWidth; x++)
                {
                    room.Tiles[0][x] = fillTile;
                    room.Tiles[GridHeight - 1][x] = fillTile;
                }
                for (int y = 0; y < GridHeight; y++)
                {
                    room.Tiles[y][0] = fillTile;
                    room.Tiles[y][GridWidth - 1] = fillTile;
                }
                break;

            case TemplateType.FillGround:
                // Fill only the bottom row
                for (int x = 0; x < GridWidth; x++)
                {
                    room.Tiles[GridHeight - 1][x] = fillTile;
                }
                break;

            case TemplateType.FillAll:
                // Fill the entire room
                for (int y = 0; y < GridHeight; y++)
                {
                    for (int x = 0; x < GridWidth; x++)
                    {
                        room.Tiles[y][x] = fillTile;
                    }
                }
                break;

            case TemplateType.ClearAll:
                // Clear the entire room
                for (int y = 0; y < GridHeight; y++)
                {
                    for (int x = 0; x < GridWidth; x++)
                    {
                        room.Tiles[y][x] = emptyTile;
                    }
                }
                break;
        }
    }

    private void GridPanel_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.Clear(Color.White);
        var room = CurrentRoom;

        int cellSize = CellSize;

        for (int y = 0; y < GridHeight; y++)
        {
            for (int x = 0; x < GridWidth; x++)
            {
                var tile = room.Tiles[y][x];
                var rect = new Rectangle(x * cellSize + panX, y * cellSize + panY, cellSize, cellSize);
                g.FillRectangle(new SolidBrush(GetColorForTile(tile.Type)), rect);
                g.DrawRectangle(Pens.Gray, rect);

                // Highlight selected tile
                if (currentTool == DrawingTool.Select && selectedTileCell.X == x && selectedTileCell.Y == y)
                {
                    g.DrawRectangle(new Pen(Color.Blue, 3), rect);
                }
            }
        }
    }

    private void GridPanel_MouseDown(object? sender, MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Left) return;

        isDrawing = true;
        Point cell = ScreenToGridCoordinates(e.X, e.Y);

        if (cell.X < 0 || cell.X >= GridWidth || cell.Y < 0 || cell.Y >= GridHeight) return;

        if (currentTool == DrawingTool.Select)
        {
            selectedTileCell = cell;
            ShowTilePropertiesDialog(cell.X, cell.Y);
            gridPanel.Invalidate();
        }
        else
        {
            SaveUndo();

            if (currentTool == DrawingTool.Rectangle)
            {
                rectangleStartCell = cell;
            }
            else if (currentTool == DrawingTool.Fill)
            {
                FloodFill(cell.X, cell.Y);
                gridPanel.Invalidate();
            }
            else
            {
                PlaceOrErase(cell.X, cell.Y);
                lastDrawnCell = cell;
                gridPanel.Invalidate();
            }
        }
    }

    private void GridPanel_MouseMove(object? sender, MouseEventArgs e)
    {
        if (!isDrawing) return;

        Point cell = ScreenToGridCoordinates(e.X, e.Y);

        if (cell.X < 0 || cell.X >= GridWidth || cell.Y < 0 || cell.Y >= GridHeight) return;

        if (currentTool == DrawingTool.Pencil || currentTool == DrawingTool.Eraser)
        {
            if (lastDrawnCell != cell)
            {
                PlaceOrErase(cell.X, cell.Y);
                lastDrawnCell = cell;
                gridPanel.Invalidate();
            }
        }
    }

    private void GridPanel_MouseUp(object? sender, MouseEventArgs e)
    {
        if (currentTool == DrawingTool.Rectangle && rectangleStartCell.X >= 0)
        {
            Point endCell = ScreenToGridCoordinates(e.X, e.Y);
            if (endCell.X >= 0 && endCell.X < GridWidth && endCell.Y >= 0 && endCell.Y < GridHeight)
            {
                DrawRectangle(rectangleStartCell.X, rectangleStartCell.Y, endCell.X, endCell.Y);
                gridPanel.Invalidate();
            }
            rectangleStartCell = new Point(-1, -1);
        }

        isDrawing = false;
        lastDrawnCell = new Point(-1, -1);
    }

    private void GridPanel_MouseWheel(object? sender, MouseEventArgs e)
    {
        // Ctrl+Scroll to zoom
        if ((Control.ModifierKeys & Keys.Control) == Keys.Control)
        {
            if (e.Delta > 0) ZoomIn();
            else ZoomOut();
        }
        // Shift+Scroll to pan horizontally
        else if ((Control.ModifierKeys & Keys.Shift) == Keys.Shift)
        {
            panX += (e.Delta > 0) ? 20 : -20;
            gridPanel.Invalidate();
        }
        // Regular Scroll to pan vertically
        else
        {
            panY += (e.Delta > 0) ? 20 : -20;
            gridPanel.Invalidate();
        }
    }

    private Point ScreenToGridCoordinates(int screenX, int screenY)
    {
        return new Point((screenX - panX) / CellSize, (screenY - panY) / CellSize);
    }

    private void PlaceOrErase(int x, int y)
    {
        if (x < 0 || x >= GridWidth || y < 0 || y >= GridHeight) return;

        var room = CurrentRoom;
        Tile tile;

        if (currentTool == DrawingTool.Eraser)
        {
            tile = new Tile(TileType.Empty);
        }
        else
        {
            // Auto-assign IDs for spawn tiles
            switch (selectedTileType)
            {
                case TileType.PlayerSpawn:
                    tile = new Tile(selectedTileType, playerSpawnId: room.GetNextPlayerSpawnId());
                    break;
                case TileType.EnemySpawn:
                    tile = new Tile(selectedTileType, enemyId: room.GetNextEnemySpawnId());
                    break;
                case TileType.ItemSpawn:
                    tile = new Tile(selectedTileType, itemId: room.GetNextItemSpawnId());
                    break;
                case TileType.Teleport:
                    tile = new Tile(selectedTileType, teleportId: room.GetNextTeleportId());
                    break;
                case TileType.ExitOverride:
                    tile = new Tile(selectedTileType, exitOverride: room.GetNextExitOverrideId());
                    break;
                default:
                    tile = new Tile(selectedTileType);
                    break;
            }
        }

        room.Tiles[y][x] = tile;
    }

    private void DrawRectangle(int x1, int y1, int x2, int y2)
    {
        int minX = Math.Min(x1, x2);
        int maxX = Math.Max(x1, x2);
        int minY = Math.Min(y1, y2);
        int maxY = Math.Max(y1, y2);

        var room = CurrentRoom;

        for (int y = minY; y <= maxY; y++)
        {
            for (int x = minX; x <= maxX; x++)
            {
                if (x >= 0 && x < GridWidth && y >= 0 && y < GridHeight)
                {
                    // Auto-assign IDs for spawn tiles
                    Tile tile = selectedTileType switch
                    {
                        TileType.PlayerSpawn => new Tile(selectedTileType, playerSpawnId: room.GetNextPlayerSpawnId()),
                        TileType.EnemySpawn => new Tile(selectedTileType, enemyId: room.GetNextEnemySpawnId()),
                        TileType.ItemSpawn => new Tile(selectedTileType, itemId: room.GetNextItemSpawnId()),
                        TileType.Teleport => new Tile(selectedTileType, teleportId: room.GetNextTeleportId()),
                        TileType.ExitOverride => new Tile(selectedTileType, exitOverride: room.GetNextExitOverrideId()),
                        _ => new Tile(selectedTileType)
                    };
                    room.Tiles[y][x] = tile;
                }
            }
        }
    }

    private void FloodFill(int startX, int startY)
    {
        if (startX < 0 || startX >= GridWidth || startY < 0 || startY >= GridHeight) return;

        var room = CurrentRoom;
        var targetTile = room.Tiles[startY][startX];
        var replacementTile = new Tile(selectedTileType);

        if (targetTile.Type == replacementTile.Type) return; // No change needed

        var queue = new Queue<(int x, int y)>();
        var visited = new HashSet<(int, int)>();

        queue.Enqueue((startX, startY));

        while (queue.Count > 0)
        {
            var (x, y) = queue.Dequeue();

            if (visited.Contains((x, y))) continue;
            if (x < 0 || x >= GridWidth || y < 0 || y >= GridHeight) continue;
            if (room.Tiles[y][x].Type != targetTile.Type) continue;

            visited.Add((x, y));
            room.Tiles[y][x] = replacementTile;

            // Add adjacent cells
            queue.Enqueue((x + 1, y));
            queue.Enqueue((x - 1, y));
            queue.Enqueue((x, y + 1));
            queue.Enqueue((x, y - 1));
        }
    }

    private void ZoomIn()
    {
        if (zoomLevel < 5)
        {
            zoomLevel++;
            UpdateToolStatus();
            gridPanel.Invalidate();
        }
    }

    private void ZoomOut()
    {
        if (zoomLevel > 1)
        {
            zoomLevel--;
            UpdateToolStatus();
            gridPanel.Invalidate();
        }
    }

    private void ResetView()
    {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        UpdateToolStatus();
        gridPanel.Invalidate();
    }

    private void SaveUndo()
    {
        // Deep copy the current room state
        var currentRoom = CurrentRoom;
        var backup = new RoomData(currentRoom.Width, currentRoom.Height);
        for (int y = 0; y < currentRoom.Height; y++)
        {
            for (int x = 0; x < currentRoom.Width; x++)
            {
                backup.Tiles[y][x] = CopyTile(currentRoom.Tiles[y][x]);
            }
        }
        backup.NextPlayerSpawnId = currentRoom.NextPlayerSpawnId;
        backup.NextEnemySpawnId = currentRoom.NextEnemySpawnId;
        backup.NextItemSpawnId = currentRoom.NextItemSpawnId;
        backup.NextTeleportId = currentRoom.NextTeleportId;
        backup.NextExitOverrideId = currentRoom.NextExitOverrideId;
        undoStack.Push(backup);
        redoStack.Clear();
    }

    private Tile CopyTile(Tile sourceTile)
    {
        // Create a proper copy of the tile with all its data
        Tile copy = sourceTile.Type switch
        {
            TileType.PlayerSpawn => new Tile(sourceTile.Type, playerSpawnId: sourceTile.PlayerSpawnId),
            TileType.EnemySpawn => new Tile(sourceTile.Type, enemyId: sourceTile.EnemyId),
            TileType.ItemSpawn => new Tile(sourceTile.Type, itemId: sourceTile.ItemId),
            TileType.Teleport => new Tile(sourceTile.Type, teleportId: sourceTile.TeleportId),
            TileType.ExitOverride => new Tile(sourceTile.Type, exitOverride: sourceTile.ExitOverride),
            _ => new Tile(sourceTile.Type)
        };

        // Copy the tag (handle null case when loading projects)
        copy.Tag = sourceTile.Tag != null ? new TileTag(sourceTile.Tag) : new TileTag();
        return copy;
    }

    private void Undo()
    {
        if (undoStack.Count == 0) return;

        var currentRoom = CurrentRoom;
        var backup = new RoomData(currentRoom.Width, currentRoom.Height);
        for (int y = 0; y < currentRoom.Height; y++)
        {
            for (int x = 0; x < currentRoom.Width; x++)
            {
                backup.Tiles[y][x] = CopyTile(currentRoom.Tiles[y][x]);
            }
        }
        backup.NextPlayerSpawnId = currentRoom.NextPlayerSpawnId;
        backup.NextEnemySpawnId = currentRoom.NextEnemySpawnId;
        backup.NextItemSpawnId = currentRoom.NextItemSpawnId;
        backup.NextTeleportId = currentRoom.NextTeleportId;
        backup.NextExitOverrideId = currentRoom.NextExitOverrideId;
        redoStack.Push(backup);

        var previousState = undoStack.Pop();
        for (int y = 0; y < currentRoom.Height; y++)
        {
            for (int x = 0; x < currentRoom.Width; x++)
            {
                currentRoom.Tiles[y][x] = CopyTile(previousState.Tiles[y][x]);
            }
        }
        currentRoom.NextPlayerSpawnId = previousState.NextPlayerSpawnId;
        currentRoom.NextEnemySpawnId = previousState.NextEnemySpawnId;
        currentRoom.NextItemSpawnId = previousState.NextItemSpawnId;
        currentRoom.NextTeleportId = previousState.NextTeleportId;
        currentRoom.NextExitOverrideId = previousState.NextExitOverrideId;

        gridPanel.Invalidate();
    }

    private void Redo()
    {
        if (redoStack.Count == 0) return;

        var currentRoom = CurrentRoom;
        var backup = new RoomData(currentRoom.Width, currentRoom.Height);
        for (int y = 0; y < currentRoom.Height; y++)
        {
            for (int x = 0; x < currentRoom.Width; x++)
            {
                backup.Tiles[y][x] = CopyTile(currentRoom.Tiles[y][x]);
            }
        }
        backup.NextPlayerSpawnId = currentRoom.NextPlayerSpawnId;
        backup.NextEnemySpawnId = currentRoom.NextEnemySpawnId;
        backup.NextItemSpawnId = currentRoom.NextItemSpawnId;
        backup.NextTeleportId = currentRoom.NextTeleportId;
        backup.NextExitOverrideId = currentRoom.NextExitOverrideId;
        undoStack.Push(backup);

        var nextState = redoStack.Pop();
        for (int y = 0; y < currentRoom.Height; y++)
        {
            for (int x = 0; x < currentRoom.Width; x++)
            {
                currentRoom.Tiles[y][x] = CopyTile(nextState.Tiles[y][x]);
            }
        }
        currentRoom.NextPlayerSpawnId = nextState.NextPlayerSpawnId;
        currentRoom.NextEnemySpawnId = nextState.NextEnemySpawnId;
        currentRoom.NextItemSpawnId = nextState.NextItemSpawnId;
        currentRoom.NextTeleportId = nextState.NextTeleportId;
        currentRoom.NextExitOverrideId = nextState.NextExitOverrideId;

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

        var addAreaButton = new Button
        {
            Text = "+",
            Location = new Point(165, 40),
            Width = 50,
            Height = 40,
        };
        addAreaButton.Click += (s, e) => AddNewArea();

        var roomLabel = new Label { Text = "Room:", Location = new Point(10, 75), AutoSize = true };
        roomComboBox = new ComboBox
        {
            Location = new Point(10, 95),
            Width = 150,
            DropDownStyle = ComboBoxStyle.DropDownList,
        };
        roomComboBox.SelectedIndexChanged += RoomComboBox_SelectedIndexChanged;

        var addRoomButton = new Button
        {
            Text = "+",
            Location = new Point(165, 95),
            Width = 50,
            Height = 40,
        };
        addRoomButton.Click += (s, e) => AddNewRoom();

        panel.Controls.Add(areaLabel);
        panel.Controls.Add(areaComboBox);
        panel.Controls.Add(addAreaButton);
        panel.Controls.Add(roomLabel);
        panel.Controls.Add(roomComboBox);
        panel.Controls.Add(addRoomButton);

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

    private void AddNewArea()
    {
        var dialog = new Form
        {
            Text = "New Area",
            Width = 340,
            Height = 200,
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
        };

        var label = new Label { Text = "Area Name:", Location = new Point(10, 10), AutoSize = true };
        var textBox = new TextBox { Text = "Area " + (currentGame.Areas.Count + 1), Location = new Point(10, 35), Width = 300 };
        var okButton = new Button { Text = "OK", Location = new Point(170, 130), Width = 70, DialogResult = DialogResult.OK };
        var cancelButton = new Button { Text = "Cancel", Location = new Point(250, 130), Width = 70, DialogResult = DialogResult.Cancel };

        dialog.Controls.Add(label);
        dialog.Controls.Add(textBox);
        dialog.Controls.Add(okButton);
        dialog.Controls.Add(cancelButton);
        dialog.AcceptButton = okButton;
        dialog.CancelButton = cancelButton;

        if (dialog.ShowDialog(this) == DialogResult.OK)
        {
            string areaName = textBox.Text.Trim();
            if (string.IsNullOrEmpty(areaName))
            {
                MessageBox.Show("Area name cannot be empty!", "Error");
                return;
            }

            if (currentGame.Areas.ContainsKey(areaName))
            {
                MessageBox.Show("An area with this name already exists!", "Error");
                return;
            }

            // Create new area with a starting room
            var newArea = new AreaData { Name = areaName };
            var newRoom = new RoomData(GridWidth, GridHeight);
            newArea.Rooms["0,0"] = newRoom;
            currentGame.Areas[areaName] = newArea;

            // Switch to the new area
            currentAreaKey = areaName;
            currentRoomKey = "0,0";
            RefreshAreaComboBox();
            RefreshRoomComboBox();
            gridPanel.Invalidate();

            MessageBox.Show($"Area '{areaName}' created!", "Success");
        }
    }

    private void AddNewRoom()
    {
        var dialog = new Form
        {
            Text = "New Room",
            Width = 340,
            Height = 240,
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
        };

        var label = new Label { Text = "Room Coordinates (x,y):", Location = new Point(10, 10), AutoSize = true };
        var xLabel = new Label { Text = "X:", Location = new Point(10, 45), AutoSize = true };
        var xTextBox = new TextBox { Text = "1", Location = new Point(30, 42), Width = 50 };
        var yLabel = new Label { Text = "Y:", Location = new Point(100, 45), AutoSize = true };
        var yTextBox = new TextBox { Text = "0", Location = new Point(120, 42), Width = 50 };

        var okButton = new Button { Text = "OK", Location = new Point(170, 165), Width = 70, DialogResult = DialogResult.OK };
        var cancelButton = new Button { Text = "Cancel", Location = new Point(250, 165), Width = 70, DialogResult = DialogResult.Cancel };

        dialog.Controls.Add(label);
        dialog.Controls.Add(xLabel);
        dialog.Controls.Add(xTextBox);
        dialog.Controls.Add(yLabel);
        dialog.Controls.Add(yTextBox);
        dialog.Controls.Add(okButton);
        dialog.Controls.Add(cancelButton);
        dialog.AcceptButton = okButton;
        dialog.CancelButton = cancelButton;

        if (dialog.ShowDialog(this) == DialogResult.OK)
        {
            if (!int.TryParse(xTextBox.Text, out int x) || !int.TryParse(yTextBox.Text, out int y))
            {
                MessageBox.Show("X and Y must be integers!", "Error");
                return;
            }

            string roomKey = $"{x},{y}";
            if (currentGame.Areas[currentAreaKey].Rooms.ContainsKey(roomKey))
            {
                MessageBox.Show($"Room {roomKey} already exists in this area!", "Error");
                return;
            }

            // Create new room
            var newRoom = new RoomData(GridWidth, GridHeight);
            currentGame.Areas[currentAreaKey].Rooms[roomKey] = newRoom;

            // Switch to the new room
            currentRoomKey = roomKey;
            RefreshRoomComboBox();
            gridPanel.Invalidate();

            MessageBox.Show($"Room {roomKey} created!", "Success");
        }
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

    private void ShowTilePropertiesDialog(int x, int y)
    {
        var tile = CurrentRoom.Tiles[y][x];

        var dialog = new Form
        {
            Text = $"Tile Properties ({x}, {y})",
            Width = 400,
            Height = 500,
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
        };

        int controlY = 10;

        // Tile Type
        var typeLabel = new Label { Text = "Tile Type:", Location = new Point(10, controlY), AutoSize = true };
        dialog.Controls.Add(typeLabel);
        controlY += 25;

        var typeCombo = new ComboBox
        {
            Location = new Point(10, controlY),
            Width = 360,
            DropDownStyle = ComboBoxStyle.DropDownList,
        };

        foreach (TileType tileType in Enum.GetValues(typeof(TileType)))
        {
            typeCombo.Items.Add(tileType.ToString());
        }
        typeCombo.SelectedItem = tile.Type.ToString();
        dialog.Controls.Add(typeCombo);
        controlY += 35;

        // ID fields (only show for spawn types)
        Label? idLabel = null;
        TextBox? idBox = null;

        if (tile.Type == TileType.PlayerSpawn && tile.PlayerSpawnId.HasValue)
        {
            idLabel = new Label { Text = "Player Spawn ID:", Location = new Point(10, controlY), AutoSize = true };
            dialog.Controls.Add(idLabel);
            controlY += 25;

            idBox = new TextBox { Text = tile.PlayerSpawnId.ToString(), Location = new Point(10, controlY), Width = 360, ReadOnly = true };
            dialog.Controls.Add(idBox);
            controlY += 35;
        }
        else if (tile.Type == TileType.EnemySpawn && tile.EnemyId.HasValue)
        {
            idLabel = new Label { Text = "Enemy ID:", Location = new Point(10, controlY), AutoSize = true };
            dialog.Controls.Add(idLabel);
            controlY += 25;

            idBox = new TextBox { Text = tile.EnemyId.ToString(), Location = new Point(10, controlY), Width = 360, ReadOnly = true };
            dialog.Controls.Add(idBox);
            controlY += 35;
        }
        else if (tile.Type == TileType.ItemSpawn && tile.ItemId.HasValue)
        {
            idLabel = new Label { Text = "Item ID:", Location = new Point(10, controlY), AutoSize = true };
            dialog.Controls.Add(idLabel);
            controlY += 25;

            idBox = new TextBox { Text = tile.ItemId.ToString(), Location = new Point(10, controlY), Width = 360, ReadOnly = true };
            dialog.Controls.Add(idBox);
            controlY += 35;
        }
        else if (tile.Type == TileType.Teleport && tile.TeleportId.HasValue)
        {
            idLabel = new Label { Text = "Teleport ID:", Location = new Point(10, controlY), AutoSize = true };
            dialog.Controls.Add(idLabel);
            controlY += 25;

            idBox = new TextBox { Text = tile.TeleportId.ToString(), Location = new Point(10, controlY), Width = 360, ReadOnly = true };
            dialog.Controls.Add(idBox);
            controlY += 35;
        }

        // Tile Tag - Sprite Name
        var spriteLabel = new Label { Text = "Sprite Name:", Location = new Point(10, controlY), AutoSize = true };
        dialog.Controls.Add(spriteLabel);
        controlY += 25;

        var spriteBox = new TextBox
        {
            Text = tile.Tag.SpriteName ?? "",
            Location = new Point(10, controlY),
            Width = 360,
        };
        dialog.Controls.Add(spriteBox);
        controlY += 35;

        // Tile Tag - Physical Properties
        var collisionCheck = new CheckBox { Text = "Has Collision", Location = new Point(10, controlY), AutoSize = true, Checked = tile.Tag.HasCollision };
        dialog.Controls.Add(collisionCheck);
        controlY += 25;

        var waterCheck = new CheckBox { Text = "Is Water", Location = new Point(10, controlY), AutoSize = true, Checked = tile.Tag.IsWater };
        dialog.Controls.Add(waterCheck);
        controlY += 25;

        var lavaCheck = new CheckBox { Text = "Is Lava", Location = new Point(10, controlY), AutoSize = true, Checked = tile.Tag.IsLava };
        dialog.Controls.Add(lavaCheck);
        controlY += 25;

        var iceCheck = new CheckBox { Text = "Is Ice", Location = new Point(10, controlY), AutoSize = true, Checked = tile.Tag.IsIce };
        dialog.Controls.Add(iceCheck);
        controlY += 25;

        var oneWayCheck = new CheckBox { Text = "Is One-Way", Location = new Point(10, controlY), AutoSize = true, Checked = tile.Tag.IsOneWay };
        dialog.Controls.Add(oneWayCheck);
        controlY += 35;

        // Buttons
        var okButton = new Button { Text = "OK", Location = new Point(220, controlY), Width = 80, DialogResult = DialogResult.OK };
        var cancelButton = new Button { Text = "Cancel", Location = new Point(310, controlY), Width = 80, DialogResult = DialogResult.Cancel };

        dialog.Controls.Add(okButton);
        dialog.Controls.Add(cancelButton);
        dialog.AcceptButton = okButton;
        dialog.CancelButton = cancelButton;

        if (dialog.ShowDialog(this) == DialogResult.OK)
        {
            SaveUndo();

            // Create new tile with proper ID assignment based on type
            if (Enum.TryParse<TileType>(typeCombo.SelectedItem?.ToString(), out var newType))
            {
                Tile newTile = newType switch
                {
                    TileType.PlayerSpawn => new Tile(newType, playerSpawnId: tile.PlayerSpawnId ?? CurrentRoom.GetNextPlayerSpawnId()),
                    TileType.EnemySpawn => new Tile(newType, enemyId: tile.EnemyId ?? CurrentRoom.GetNextEnemySpawnId()),
                    TileType.ItemSpawn => new Tile(newType, itemId: tile.ItemId ?? CurrentRoom.GetNextItemSpawnId()),
                    TileType.Teleport => new Tile(newType, teleportId: tile.TeleportId ?? CurrentRoom.GetNextTeleportId()),
                    TileType.ExitOverride => new Tile(newType, exitOverride: tile.ExitOverride ?? CurrentRoom.GetNextExitOverrideId()),
                    _ => new Tile(newType)
                };

                // Copy the tag from the old tile
                newTile.Tag = new TileTag(tile.Tag);

                // Update tag properties
                newTile.Tag.SpriteName = string.IsNullOrWhiteSpace(spriteBox.Text) ? null : spriteBox.Text;
                newTile.Tag.HasCollision = collisionCheck.Checked;
                newTile.Tag.IsWater = waterCheck.Checked;
                newTile.Tag.IsLava = lavaCheck.Checked;
                newTile.Tag.IsIce = iceCheck.Checked;
                newTile.Tag.IsOneWay = oneWayCheck.Checked;

                CurrentRoom.Tiles[y][x] = newTile;
            }

            gridPanel.Invalidate();
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
}
