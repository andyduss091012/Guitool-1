using GuitarApp.Importer.Seed;

namespace GuitarApp.Importer.Import;

/// <summary>Pure mapping helpers between the authored concept shapes and the queryable chord/scale tables.</summary>
public static class ConceptMapper
{
    /// <summary>Which library chord each authored chord concept describes. Explicit on purpose: names are free text.</summary>
    public static readonly IReadOnlyDictionary<string, (string Root, string Quality)> ChordConceptTargets =
        new Dictionary<string, (string, string)>
        {
            ["chord-open-a-major"] = ("A", "maj"),
            ["chord-open-a-minor"] = ("A", "m"),
            ["chord-open-c-major"] = ("C", "maj"),
            ["chord-open-d-major"] = ("D", "maj"),
            ["chord-open-e-major"] = ("E", "maj"),
            ["chord-open-e-minor"] = ("E", "m"),
            ["chord-open-g-major"] = ("G", "maj"),
            ["chord-caged-major-g"] = ("G", "maj"),
        };

    private static readonly string[] IntervalOrder =
        { "1", "b2", "2", "#2", "b3", "3", "4", "#4", "b5", "5", "#5", "b6", "6", "b7", "7" };

    /// <summary>
    /// Frets per string (low E first) from a hand-authored shape: muted strings = -1, listed notes = their fret,
    /// any other string = open (0). Returns null with a reason if a string is listed twice.
    /// </summary>
    public static (int[]? Frets, int[]? Fingers, string? Problem) DeriveChordVoicing(SeedShape shape)
    {
        var frets = new int[6];
        var fingers = new int[6];
        var seen = new HashSet<int>();
        var anyFinger = false;

        foreach (var s in shape.MutedStrings ?? Array.Empty<int>())
        {
            if (s is < 1 or > 6) return (null, null, $"muted string {s} is out of range");
            frets[s - 1] = -1;
            fingers[s - 1] = -1;
            seen.Add(s);
        }

        foreach (var p in shape.Positions)
        {
            if (p.String is < 1 or > 6) return (null, null, $"string {p.String} is out of range");
            if (!seen.Add(p.String)) return (null, null, $"string {p.String} is listed more than once");
            frets[p.String - 1] = p.Fret;
            if (p.Finger is { } f)
            {
                fingers[p.String - 1] = f;
                anyFinger = true;
            }
        }

        return (frets, anyFinger ? fingers : null, null);
    }

    /// <summary>Distinct intervals used by the shapes, in musical order (1, b3, 4, 5, b7 …).</summary>
    public static string[] IntervalPattern(IEnumerable<SeedShape> shapes)
    {
        var used = shapes.SelectMany(s => s.Positions).Select(p => p.Interval).Where(i => !string.IsNullOrWhiteSpace(i)).Distinct().Select(i => i!).ToList();
        return used
            .OrderBy(i => { var idx = Array.IndexOf(IntervalOrder, i); return idx < 0 ? int.MaxValue : idx; })
            .ThenBy(i => i, StringComparer.Ordinal)
            .ToArray();
    }
}
