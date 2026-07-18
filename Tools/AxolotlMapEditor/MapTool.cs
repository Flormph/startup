using System.Text.Json;
using System.Text.Json.Serialization;

public enum TileType
{
    Empty,
    Wall,
    ExitLeft,
    ExitRight,
    ExitUp,
    ExitDown,
    ExitOverride,
    Teleport,
    PlayerSpawn,
    EnemySpawn,
    ItemSpawn,
}

public struct Tile
{
    public TileType Type;
    public int? TeleportId; // Optional teleport ID for teleport tiles
    public int? ExitOverride; // Optional exit Direction for exit tiles
    public int? EnemyId; // Optional enemy ID for enemy spawn tiles
    public int? ItemId; // Optional item ID for item spawn tiles
    public int? PlayerSpawnId; // Optional player spawn ID for player spawn tiles
    public int? TileWidth; // Optional width for tiles that need it
    public int? TileHeight; // Optional height for tiles that need it

    public Tile(TileType type, int? teleportId = null, int? exitOverride = null, int? enemyId = null, int? itemId = null, int? playerSpawnId = null, int? tileWidth = 1, int? tileHeight = 1)
    {
        Type = type;
        TeleportId = null;
        ExitOverride = null;
        EnemyId = null;
        ItemId = null;
        PlayerSpawnId = null;
        TileWidth = 1;
        TileHeight = 1;

        switch (type)
        {
            case TileType.Teleport:
                if (teleportId == null) throw new ArgumentException("Teleport tiles must have a teleport ID.");
                TeleportId = teleportId;
                break;
            case TileType.ExitOverride:
                if (exitOverride == null) throw new ArgumentException("Exit override tiles must have an exit direction.");
                ExitOverride = exitOverride;
                break;
            case TileType.EnemySpawn:
                if (enemyId == null) throw new ArgumentException("Enemy spawn tiles must have an enemy ID.");
                EnemyId = enemyId;
                break;
            case TileType.ItemSpawn:
                if (itemId == null) throw new ArgumentException("Item spawn tiles must have an item ID.");
                ItemId = itemId;
                break;
            case TileType.PlayerSpawn:
                if (playerSpawnId == null) throw new ArgumentException("Player spawn tiles must have a player spawn ID.");
                PlayerSpawnId = playerSpawnId;
                break;
            default:
                if (teleportId != null || exitOverride != null || enemyId != null || itemId != null || playerSpawnId != null)
                {
                    throw new ArgumentException("Only teleport, exit override, enemy spawn, item spawn, and player spawn tiles can have additional data.");
                }
                break;
        }

        TileWidth = tileWidth;
        TileHeight = tileHeight;
    }
}

public class PlayerSpawn
{
    public int X { get; set; }
    public int Y { get; set; }
    public int SpawnId { get; set; } // Optional spawn ID for player spawn tiles
}


public class EnemySpawn
{
    public required string Type { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
}

public class ItemSpawn
{
    public required string Type { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
}

public class TeleportData
{
    public int X { get; set; }
    public int Y { get; set; }
    public required string TargetRoom { get; set; }
    public int TargetX { get; set; }
    public int TargetY { get; set; }
}

public class RoomData //Represents the data for a room in the map editor
{
    public Tile[][] Tiles { get; set; } // 2D array of characters representing the room layout
    public int Width { get; }
    public int Height { get; }

    public List<EnemySpawn> Enemies { get; set; } = new List<EnemySpawn>(); // List of enemies in the room
    public List<ItemSpawn> Items { get; set; } = new List<ItemSpawn>(); // List of items in the room
    public List<PlayerSpawn> Players { get; set; } = new List<PlayerSpawn>(); // List of player spawn points in the room
    public List<TeleportData> Exits { get; set; } = new List<TeleportData>(); // List of exits in the room
    public List<TeleportData> Teleports { get; set; } = new List<TeleportData>(); // List of teleports in the room
    public string? Music { get; set; } = null; // Music track for the room

    public RoomData(int width, int height) // Constructor to initialize the room data with specified width and height
    {
        Width = width;
        Height = height;
        Tiles = new Tile[height][];
        for (int y = 0; y < height; y++)
        {
            Tiles[y] = new Tile[width];
            for (int x = 0; x < width; x++)
            {
                Tiles[y][x] = new Tile(TileType.Empty);
            }
        }
    }
}

public interface IMapExporter
{
    string FormatName { get; }
    string FileExtension { get; }
    string ExportMap(RoomData room);
}

public class JsStringArrayExporter : IMapExporter //Export to Json
{
    public string FormatName => "JS String Array";
    public string FileExtension => ".json";

    private char TileToChar(Tile tile)
    {
        switch (tile.Type)
        {
            case TileType.Empty: return ' ';
            case TileType.Wall: return '#';
            case TileType.ExitLeft: return 'L';
            case TileType.ExitRight: return 'R';
            case TileType.ExitUp: return 'U';
            case TileType.ExitDown: return 'D';
            case TileType.ExitOverride: return 'O';
            case TileType.Teleport: return 'T';
            case TileType.PlayerSpawn: return 'P';
            case TileType.EnemySpawn: return 'E';
            case TileType.ItemSpawn: return 'I';
            default: throw new ArgumentOutOfRangeException();
        }
        ;
    }

    public string ExportMap(RoomData room)
    {
        var enemiesInScanOrder = new List<EnemySpawn>();
        var itemsInScanOrder = new List<ItemSpawn>();
        var exitOverridesInScanOrder = new List<TeleportData>();
        var playersInScanOrder = new List<PlayerSpawn>();
        var teleportsInScanOrder = new List<TeleportData>();

        var layoutLines = new List<string>();

        for (int y = 0; y < room.Height; y++)
        {
            var rowChars = new List<char>();
            for (int x = 0; x < room.Width; x++)
            {
                var tile = room.Tiles[y][x];
                rowChars.Add(TileToChar(tile));

                if (tile.Type == TileType.EnemySpawn && tile.EnemyId.HasValue)
                {
                    enemiesInScanOrder.Add(room.Enemies[tile.EnemyId.Value]);
                }
                if (tile.Type == TileType.ItemSpawn && tile.ItemId.HasValue)
                {
                    itemsInScanOrder.Add(room.Items[tile.ItemId.Value]);
                }
                if (tile.Type == TileType.ExitOverride && tile.ExitOverride.HasValue)
                {
                    exitOverridesInScanOrder.Add(room.Exits[tile.ExitOverride.Value]);
                }
                if (tile.Type == TileType.PlayerSpawn && tile.PlayerSpawnId.HasValue)
                {
                    playersInScanOrder.Add(room.Players[tile.PlayerSpawnId.Value]);
                }
                if (tile.Type == TileType.Teleport && tile.TeleportId.HasValue)
                {
                    teleportsInScanOrder.Add(room.Teleports[tile.TeleportId.Value]);
                }
            }
            layoutLines.Add(new string(rowChars.ToArray()));
        }
        var exportObject = new
        {
            layout = layoutLines,
            enemies = enemiesInScanOrder,
            items = itemsInScanOrder,
            players = playersInScanOrder,
            exits = exitOverridesInScanOrder, // Export exit overrides in scan order
            teleports = teleportsInScanOrder,    // Export teleports in scan order
            music = room.Music,
        };

        var options = new JsonSerializerOptions { WriteIndented = true };
        return JsonSerializer.Serialize(exportObject, options);
    }
}

public class AxmapExporter : IMapExporter  //NotImplemented
{
    public string FormatName => "Axolotl Map (.axmap)";
    public string FileExtension => ".axmap";

    public string ExportMap(RoomData room)
    {
        return string.Join("\n", room.Tiles.Select(row => string.Concat(row.Select(tile => tile.ToString()))));
    }
}