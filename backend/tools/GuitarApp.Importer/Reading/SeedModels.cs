using GuitarApp.Domain.Common;

namespace GuitarApp.Importer.Seed;

public sealed record SeedArtist(string Name, string Slug);

public sealed record SeedTuning(string Name, string Notes);

public sealed record SeedSong
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string ArtistSlug { get; init; }
    public required string Genre { get; init; }
    public int Difficulty { get; init; }
    public string? Tuning { get; init; }
    public int? Capo { get; init; }
    public string? KeySignature { get; init; }
    public LocalizedText? PracticeNotes { get; init; }
    public string[] Tags { get; init; } = Array.Empty<string>();
}

/// <summary>
/// NOTE: in chords.json the property is called "frets" because that is what the web app named it, but the values are
/// FINGER numbers (-1 muted, 0 open, 1-4). See DECISIONS.md ("chord library values are fingerings").
/// </summary>
public sealed record SeedVoicing(int Index, int[] Frets);

public sealed record SeedChord(string Root, string Quality, string Label, List<SeedVoicing> Voicings);

public sealed record SeedPosition(int String, int Fret, string? Role = null, int? Finger = null, string? Interval = null);

public sealed record SeedShape(string Id, string Label, int StartFret, int FretCount, List<SeedPosition> Positions, int[]? MutedStrings = null);

public sealed record SeedConcept
{
    public required string Slug { get; init; }
    public required string Type { get; init; }
    public required string Category { get; init; }
    public required LocalizedText Name { get; init; }
    public required LocalizedText Description { get; init; }
    public string[] Aliases { get; init; } = Array.Empty<string>();
    public required List<SeedShape> Shapes { get; init; }
    /// <summary>The "shapes" array exactly as written in the seed (kept verbatim in music_concepts.shapes_json).</summary>
    public required string ShapesJson { get; init; }
}

/// <summary>Provenance of the chords-db data (from chord-voicings.json; written by web/scripts/build-chord-voicings.mjs).</summary>
public sealed record ChordsDbSource(string Package, string Version, string License, string Copyright, string GuitarJsonSha256);

/// <summary>One voicing with REAL frets (absolute, low E first; -1 muted, 0 open) and per-string fingers (-1 muted, 0 unknown/open).</summary>
public sealed record ChordsDbVoicing(int[] Frets, int[] Fingers, int BaseFret);

/// <summary>All voicings of one chords-db key (12 enharmonic-collapsed roots) and this app's quality code.</summary>
public sealed record ChordsDbChord(string Key, string Quality, string Suffix, List<ChordsDbVoicing> Voicings);

public sealed record ChordsDbData(ChordsDbSource Source, Dictionary<string, string> RootToKey, List<ChordsDbChord> Chords);

public sealed record SeedData
{
    public required List<SeedTuning> Tunings { get; init; }
    public required List<SeedArtist> Artists { get; init; }
    public required List<SeedSong> Songs { get; init; }
    public required List<SeedChord> Chords { get; init; }
    public required List<SeedConcept> Concepts { get; init; }
    /// <summary>Real-fret voicings from chords-db; null when chord-voicings.json is not present.</summary>
    public ChordsDbData? ChordsDb { get; init; }
}
