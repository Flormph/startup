public interface IMapExporter
{
    string FormatName { get; }
    string FileExtension { get; }
    string ExportMap(RoomData room);
}

public class JsStringArrayExporter : IMapExporter
{
    public string FormatName => "JS String Array";
    public string FileExtension => ".json";

    public string ExportMap(RoomData room)
    {
        var lines = room.Tiles.Select(row => string.Concat(row));
        var layoutArray = string.Join(",\n", lines.Select(line => $"\"{line}\""));

        var enemiesJson = string.Join(",", room.Enemies.Select(e => $"{{\"x\":{e.X},\"y\":{e.Y},\"type\":\"{e.Type}\"}}"));
        var itemsJson = string.Join(",", room.Items.Select(i => $"{{\"x\":{i.X},\"y\":{i.Y},\"type\":\"{i.Type}\"}}"));
        var musicJson = room.Music == null ? "null" : $"\"{room.Music}\"";

        return $"{{\n  \"layout\": [\n  {layoutArray}\n  ],\n  \"enemies\": [{enemiesJson}],\n  \"items\": [{itemsJson}],\n  \"music\": {musicJson}\n}}";
    }
}

public class AxmapExporter : IMapExporter
{
    public string FormatName => "Axolotl Map (.axmap)";
    public string FileExtension => ".axmap";

    public string ExportMap(RoomData room)
    {
        return string.Join("\n", room.Tiles.Select(row => string.Concat(row)));
    }
}

public class RoomData
{
    public char[][] Tiles { get; set; }
    public int Width { get; }
    public int Height { get; }

    public List<EnemySpawn> Enemies { get; set; } = new List<EnemySpawn>();
    public List<ItemSpawn> Items { get; set; } = new List<ItemSpawn>();
    public string Music { get; set; } = "";

    public List<ExitData> Exits { get; set; } = new List<ExitData>();
    public List<TeleportData> Teleports { get; set; } = new List<TeleportData>();

    public RoomData(int width, int height)
    {
        Width = width;
        Height = height;
        Tiles = new char[height][];
        for (int y = 0; y < height; y++)
        {
            Tiles[y] = new char[width];
            for (int x = 0; x < width; x++)
            {
                Tiles[y][x] = ' ';
            }
        }
    }

    public class EnemySpawn
    {
        public string Type { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
    }

    public class ItemSpawn
    {
        public string Type { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
    }

    public class ExitData
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string TargetRoom { get; set; }
        public int TargetX { get; set; }
        public int TargetY { get; set; }
    }

    public class TeleportData
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string TargetRoom { get; set; }
        public int TargetX { get; set; }
        public int TargetY { get; set; }
    }
}