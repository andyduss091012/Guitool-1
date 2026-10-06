using System.Text.Json;
using System.Text.Json.Nodes;

namespace GuitarApp.Importer.Seed;

public static class SeedReader
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new LocalizableTextJsonConverter() },
    };

    public static SeedData Read(string seedDirectory)
    {
        if (!Directory.Exists(seedDirectory)) throw new DirectoryNotFoundException($"Seed folder not found: {seedDirectory}");

        return new SeedData
        {
            Tunings = Load<List<SeedTuning>>(seedDirectory, "tunings.json"),
            Artists = Load<List<SeedArtist>>(seedDirectory, "artists.json"),
            Songs = Load<List<SeedSong>>(seedDirectory, "songs.json"),
            Chords = Load<List<SeedChord>>(seedDirectory, "chords.json"),
            Concepts = ReadConcepts(Path.Combine(seedDirectory, "concepts.json")),
            ChordsDb = File.Exists(Path.Combine(seedDirectory, "chord-voicings.json"))
                ? Load<ChordsDbData>(seedDirectory, "chord-voicings.json")
                : null,
        };
    }

    private static T Load<T>(string dir, string file)
    {
        var path = Path.Combine(dir, file);
        if (!File.Exists(path)) throw new FileNotFoundException($"Seed file not found: {path}");
        try
        {
            return JsonSerializer.Deserialize<T>(File.ReadAllText(path), Options)
                   ?? throw new InvalidDataException($"{file} is empty.");
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException($"{file}: {ex.Message}", ex);
        }
    }

    private static List<SeedConcept> ReadConcepts(string path)
    {
        if (!File.Exists(path)) throw new FileNotFoundException($"Seed file not found: {path}");
        var array = JsonNode.Parse(File.ReadAllText(path)) as JsonArray
                    ?? throw new InvalidDataException("concepts.json must be a JSON array.");

        var result = new List<SeedConcept>();
        foreach (var node in array)
        {
            var obj = node as JsonObject ?? throw new InvalidDataException("concepts.json contains a non-object entry.");
            var id = obj["id"]?.GetValue<string>() ?? throw new InvalidDataException("A concept has no id.");
            var shapes = obj["shapes"] as JsonArray ?? throw new InvalidDataException($"Concept {id} has no shapes array.");
            var type = obj["type"]!.GetValue<string>();
            // Chord concepts carry "category"; scale concepts carry "family".
            var category = obj["category"]?.GetValue<string>() ?? obj["family"]?.GetValue<string>()
                           ?? throw new InvalidDataException($"Concept {id} has neither category nor family.");
            try
            {
                result.Add(new SeedConcept
                {
                    Slug = id,
                    Type = type,
                    Category = category,
                    Name = obj["name"].Deserialize<GuitarApp.Domain.Common.LocalizedText>(Options)!,
                    Description = obj["description"].Deserialize<GuitarApp.Domain.Common.LocalizedText>(Options)!,
                    Aliases = obj["aliases"]?.Deserialize<string[]>(Options) ?? Array.Empty<string>(),
                    Shapes = shapes.Deserialize<List<SeedShape>>(Options)!,
                    ShapesJson = shapes.ToJsonString(),
                });
            }
            catch (JsonException ex)
            {
                throw new InvalidDataException($"concepts.json, concept {id}: {ex.Message}", ex);
            }
        }
        return result;
    }
}
