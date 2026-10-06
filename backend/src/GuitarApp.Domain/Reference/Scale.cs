using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

public sealed class Scale : Entity
{
    private readonly List<ScalePosition> _positions = new();

    private Scale() { }

    public string Slug { get; private set; } = null!;
    public LocalizedText Name { get; private set; } = null!;
    /// <summary>Grouping such as "pentatonic".</summary>
    public string Family { get; private set; } = null!;
    public LocalizedText? Description { get; private set; }
    /// <summary>Intervals from the root, e.g. ["1","b3","4","5","b7"].</summary>
    public string[] IntervalPattern { get; private set; } = Array.Empty<string>();
    public IReadOnlyCollection<ScalePosition> Positions => _positions;

    public static Scale Create(string slug, LocalizedText name, string family, IEnumerable<string> intervalPattern, LocalizedText? description = null)
    {
        var scale = new Scale { Slug = Guard.Slug(slug, "Scale slug") };
        scale.Update(name, family, intervalPattern, description);
        return scale;
    }

    public void Update(LocalizedText name, string family, IEnumerable<string> intervalPattern, LocalizedText? description = null)
    {
        var pattern = intervalPattern.Select(i => Guard.NotBlank(i, "Interval", 8)).ToArray();
        if (pattern.Length == 0) throw new DomainException("A scale needs at least one interval.");
        Name = name ?? throw new DomainException("Scale name is required.");
        Family = Guard.NotBlank(family, "Scale family", 60);
        Description = description;
        IntervalPattern = pattern;
    }

    public ScalePosition AddPosition(string label, int startFret, int fretCount)
    {
        var index = _positions.Count == 0 ? 0 : _positions.Max(p => p.Index) + 1;
        var position = ScalePosition.Create(Id, index, label, startFret, fretCount);
        _positions.Add(position);
        return position;
    }

    /// <summary>Removes every position (and, by cascade, their notes) so they can be rebuilt.</summary>
    public void ClearPositions() => _positions.Clear();

    /// <summary>Canonical text of all positions/notes — equal fingerprints mean identical fretboard content.</summary>
    public string PositionsFingerprint() =>
        string.Join(";", _positions.OrderBy(p => p.Index).Select(p =>
            $"{p.Index}|{p.Label}|{p.StartFret}|{p.FretCount}|" +
            string.Join(",", p.Notes
                .OrderBy(n => n.String).ThenBy(n => n.Fret)
                .Select(n => $"{n.String}.{n.Fret}.{n.Interval}.{(n.IsRoot ? 1 : 0)}.{n.Finger}"))));
}
