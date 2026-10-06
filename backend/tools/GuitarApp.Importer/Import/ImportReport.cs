using System.Text.Json;
using System.Text.Json.Serialization;

namespace GuitarApp.Importer.Import;

public sealed class SectionReport
{
    /// <summary>Records present in the seed.</summary>
    public int Seeded { get; set; }
    public int Created { get; set; }
    public int Updated { get; set; }
    /// <summary>Rows removed so they could be rebuilt (e.g. scale positions whose notes changed).</summary>
    public int Deleted { get; set; }
    /// <summary>Seeded records that already matched the database exactly.</summary>
    public int Unchanged => Math.Max(0, Seeded - Created - Updated);
}

public sealed class ImportReport
{
    public string SeedDirectory { get; set; } = "";
    public bool DryRun { get; set; }
    public bool Saved { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public Dictionary<string, SectionReport> Sections { get; } = new();
    public List<string> Warnings { get; } = new();
    public List<string> Errors { get; } = new();

    public SectionReport Section(string name)
    {
        if (!Sections.TryGetValue(name, out var s)) Sections[name] = s = new SectionReport();
        return s;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    public string ToJson() => JsonSerializer.Serialize(this, JsonOptions);
}
