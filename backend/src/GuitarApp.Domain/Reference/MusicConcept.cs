using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

/// <summary>
/// A hand-authored teaching concept (e.g. "CAGED Major Chord Shapes", "Minor Pentatonic Scale"):
/// localized name/description plus its fretboard shapes. The shapes are kept as one JSON document exactly as the
/// frontend's <c>FretShape[]</c> so nothing (captions, roles, fingers) is lost; the queryable chord/scale tables are
/// derived from the same seed.
/// </summary>
public sealed class MusicConcept : Entity
{
    public const string ChordKind = "chord";
    public const string ScaleKind = "scale";

    private MusicConcept() { }

    public string Slug { get; private set; } = null!;
    /// <summary>"chord" or "scale" (arpeggio/technique kinds have no data yet).</summary>
    public string Kind { get; private set; } = null!;
    /// <summary>Chord category (open/barre/…) or scale family.</summary>
    public string Category { get; private set; } = null!;
    public LocalizedText Name { get; private set; } = null!;
    public string[] Aliases { get; private set; } = Array.Empty<string>();
    public LocalizedText Description { get; private set; } = null!;
    /// <summary>JSON array of shapes (frontend FretShape format).</summary>
    public string ShapesJson { get; private set; } = "[]";

    public static MusicConcept Create(string slug, string kind, string category, LocalizedText name, LocalizedText description, string shapesJson, IEnumerable<string>? aliases = null)
    {
        var concept = new MusicConcept { Slug = Guard.Slug(slug, "Concept slug") };
        concept.Update(kind, category, name, description, shapesJson, aliases);
        return concept;
    }

    public void Update(string kind, string category, LocalizedText name, LocalizedText description, string shapesJson, IEnumerable<string>? aliases = null)
    {
        if (kind != ChordKind && kind != ScaleKind) throw new DomainException($"Concept kind must be '{ChordKind}' or '{ScaleKind}'.");
        var json = Guard.NotBlank(shapesJson, "Shapes", 200_000);
        if (!json.StartsWith('[') || !json.EndsWith(']')) throw new DomainException("Shapes must be a JSON array.");
        Kind = kind;
        Category = Guard.NotBlank(category, "Concept category", 60);
        Name = name ?? throw new DomainException("Concept name is required.");
        Description = description ?? throw new DomainException("Concept description is required.");
        ShapesJson = json;
        Aliases = (aliases ?? Array.Empty<string>()).Select(a => a?.Trim() ?? "").Where(a => a.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }
}
