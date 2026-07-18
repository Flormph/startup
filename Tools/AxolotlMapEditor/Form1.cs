namespace AxolotlMapEditor;

using System.Drawing;
using System.Windows.Forms;

public partial class Form1 : Form
{
    private const int GridWidth = 30;
    private const int GridHeight = 17;
    private const int CellSize = 20;
    private const int PaletteHeight = 40;

    private RoomData currentRoom;
    private TileType selectedTileType = TileType.Wall;

    public Form1()
    {
        currentRoom = new RoomData(GridWidth, GridHeight);

        this.Text = "Axolotl Map Editor";
        this.ClientSize = new Size(GridWidth * CellSize + 20, GridHeight * CellSize + 20);
        this.DoubleBuffered = true; // Reduce flickering

        BuildPalette();

        this.Paint += Form1_Paint;
        this.MouseClick += Form1_MouseClick;
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
                var tile = currentRoom.Tiles[y][x];
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

        currentRoom.Tiles[y][x] = new Tile(selectedTileType);
        this.Invalidate(); // Redraw the form
    }
}
