namespace AxolotlMapEditor;

using System.Drawing;
using System.Windows.Forms;

public partial class Form1 : Form
{
    private const int GridWidth = 30;
    private const int GridHeight = 17;
    private const int CellSize = 20;
    private const int PaletteHeight = 40;

    private GameMapData currentGame;
    private string currentAreaKey;
    private string currentRoomKey;

    private RoomData currentRoom;
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

        BuildPalette();
        BuildExportButton();

        this.Paint += Form1_Paint;
        this.MouseClick += Form1_MouseClick;
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
