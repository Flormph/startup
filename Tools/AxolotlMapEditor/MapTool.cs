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

public class TileTag
{
    public string? SpriteName { get; set; } = null;
    public bool HasCollision { get; set; } = false;
    public bool IsWater { get; set; } = false;
    public bool IsLava { get; set; } = false;
    public bool IsIce { get; set; } = false;
    public bool IsOneWay { get; set; } = false;
    public Dictionary<string, object> CustomProperties { get; set; } = new Dictionary<string, object>();

    public TileTag() { }

    public TileTag(TileTag other)
    {
        SpriteName = other.SpriteName;
        HasCollision = other.HasCollision;
        IsWater = other.IsWater;
        IsLava = other.IsLava;
        IsIce = other.IsIce;
        IsOneWay = other.IsOneWay;
        CustomProperties = new Dictionary<string, object>(other.CustomProperties);
    }
}

public struct Tile
{
    public TileType Type { get; set; }
    public int? TeleportId { get; set; } // Optional teleport ID for teleport tiles
    public int? ExitOverride { get; set; } // Optional exit Direction for exit tiles
    public int? EnemyId { get; set; } // Optional enemy ID for enemy spawn tiles
    public int? ItemId { get; set; } // Optional item ID for item spawn tiles
    public int? PlayerSpawnId { get; set; } // Optional player spawn ID for player spawn tiles
    public int? TileWidth { get; set; } // Optional width for tiles that need it
    public int? TileHeight { get; set; } // Optional height for tiles that need it
    public TileTag Tag { get; set; } // Tile tag for sprites and physical properties

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
        Tag = new TileTag();

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

    // ID tracking for auto-incrementing
    public int NextPlayerSpawnId { get; set; } = 0;
    public int NextEnemySpawnId { get; set; } = 0;
    public int NextItemSpawnId { get; set; } = 0;
    public int NextTeleportId { get; set; } = 0;
    public int NextExitOverrideId { get; set; } = 0;

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

    public int GetNextPlayerSpawnId()
    {
        return NextPlayerSpawnId++;
    }

    public int GetNextEnemySpawnId()
    {
        return NextEnemySpawnId++;
    }

    public int GetNextItemSpawnId()
    {
        return NextItemSpawnId++;
    }

    public int GetNextTeleportId()
    {
        return NextTeleportId++;
    }

    public int GetNextExitOverrideId()
    {
        return NextExitOverrideId++;
    }
}

public class AreaData
{
    public string Name { get; set; } = "New Area";
    public Dictionary<string, RoomData> Rooms { get; set; } = new Dictionary<string, RoomData>();
    // key = "x,y" coordinates of the room, value = RoomData
}

public class GameMapData
{
    public string Name { get; set; } = "New Map";
    public Dictionary<string, AreaData> Areas { get; set; } = new Dictionary<string, AreaData>();
    // key = area name, value = AreaData
}

public class ProjectFile
{
    public static void Save(GameMapData gameMap, string path)
    {
        var options = new JsonSerializerOptions { WriteIndented = true };
        var json = JsonSerializer.Serialize(gameMap, options);
        File.WriteAllText(path, json);
    }

    public static GameMapData Load(string path)
    {
        string json = File.ReadAllText(path);
        var options = new JsonSerializerOptions();
        return JsonSerializer.Deserialize<GameMapData>(json, options) ?? throw new InvalidOperationException("Failed to load project file.");
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
        var enemiesInScanOrder = new List<object>();
        var itemsInScanOrder = new List<object>();
        var exitOverridesInScanOrder = new List<TeleportData>();
        var playersInScanOrder = new List<object>();
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
                    int id = tile.EnemyId.Value;
                    while (room.Enemies.Count <= id) room.Enemies.Add(new EnemySpawn { Type = "unknown", X = x, Y = y });
                    var e = room.Enemies[id];
                    enemiesInScanOrder.Add(new { type = e.Type, x = e.X, y = e.Y });
                }
                if (tile.Type == TileType.ItemSpawn && tile.ItemId.HasValue)
                {
                    int id = tile.ItemId.Value;
                    while (room.Items.Count <= id) room.Items.Add(new ItemSpawn { Type = "unknown", X = x, Y = y });
                    var i = room.Items[id];
                    itemsInScanOrder.Add(new { type = i.Type, x = i.X, y = i.Y });
                }
                if (tile.Type == TileType.ExitOverride && tile.ExitOverride.HasValue)
                {
                    int id = tile.ExitOverride.Value;
                    while (room.Exits.Count <= id) room.Exits.Add(new TeleportData { TargetRoom = "", X = x, Y = y });
                    exitOverridesInScanOrder.Add(room.Exits[id]);
                }
                if (tile.Type == TileType.PlayerSpawn && tile.PlayerSpawnId.HasValue)
                {
                    int id = tile.PlayerSpawnId.Value;
                    while (room.Players.Count <= id) room.Players.Add(new PlayerSpawn { SpawnId = id, X = x, Y = y });
                    playersInScanOrder.Add(new { id });
                }
                if (tile.Type == TileType.Teleport && tile.TeleportId.HasValue)
                {
                    int id = tile.TeleportId.Value;
                    while (room.Teleports.Count <= id) room.Teleports.Add(new TeleportData { TargetRoom = "", X = x, Y = y });
                    teleportsInScanOrder.Add(room.Teleports[id]);
                }
            }
            layoutLines.Add(new string(rowChars.ToArray()));
        }

        // exits and teleports as objects keyed by index (matching map.jsx convention of {})
        var exitsObj = exitOverridesInScanOrder
            .Select((exit, i) => new { key = i.ToString(), val = (object)new { targetRoom = exit.TargetRoom, x = exit.X, y = exit.Y, targetX = exit.TargetX, targetY = exit.TargetY } })
            .ToDictionary(p => p.key, p => p.val);

        var teleportsObj = teleportsInScanOrder
            .Select((tp, i) => new { key = i.ToString(), val = (object)new { targetRoom = tp.TargetRoom, x = tp.X, y = tp.Y, targetX = tp.TargetX, targetY = tp.TargetY } })
            .ToDictionary(p => p.key, p => p.val);

        var exportObject = new
        {
            layout = layoutLines,
            enemies = enemiesInScanOrder,
            items = itemsInScanOrder,
            players = playersInScanOrder,
            exits = exitsObj,
            teleports = teleportsObj,
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

public static class BatchExporter
{
    public static void ExportArea(AreaData area, IMapExporter exporter, string folderPath)
    {
        Directory.CreateDirectory(folderPath);

        foreach (var (roomKey, room) in area.Rooms)
        {
            string output = exporter.ExportMap(room);
            string fileName = $"{SanitizeFileName(roomKey)}{exporter.FileExtension}";
            string fullPath = Path.Combine(folderPath, fileName);
            File.WriteAllText(fullPath, output);
        }
    }

    public static void ExportGameMap(GameMapData gameMap, IMapExporter exporter, string rootFolderPath)
    {
        foreach (var (areaName, area) in gameMap.Areas)
        {
            string areaFolderPath = Path.Combine(rootFolderPath, SanitizeFileName(areaName));
            ExportArea(area, exporter, areaFolderPath);
        }
    }

    private static string SanitizeFileName(string name)
    {
        foreach (char c in Path.GetInvalidFileNameChars())
        {
            name = name.Replace(c, '_');
        }
        return name;
    }
}