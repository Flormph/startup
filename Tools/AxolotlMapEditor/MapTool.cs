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
        return $"{{\n  \"layout\": [\n  {layoutArray}\n  ],\n  \"enemies\": [],\n  \"items\": [],\n  \"music\": [],\n  \"exits\": [],\n  \"teleports\": []\n}}";
    }
}

public class AxmapExporter : IMapExporter
{
    public string FormatName => "Axolotl Map (.axmap)";
    public string FileExtension => ".axmap";

    public string Export(RoomData room)
    {
        return string.Join("\n", room.Tiles.Select(row => string.Concat(row)));
    }
}