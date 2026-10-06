using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

/// <summary>Where a voicing's frets came from (provenance; stored in chord_voicings.frets_source).</summary>
public static class FretsSources
{
    /// <summary>Written by hand in the app's own concept data (concepts/chords.ts).</summary>
    public const string Authored = "authored";
    /// <summary>Imported from the MIT-licensed tombatossals/chords-db dataset (see THIRD-PARTY-NOTICES.md).</summary>
    public const string ChordsDb = "chords-db";

    public static bool IsKnown(string value) => value is Authored or ChordsDb;
}

/// <summary>
/// One way to play a chord. Both arrays are optional but at least one must be known:
/// the library data (chord-fingers.csv) only provides FINGERS; hand-authored shapes and chords-db provide frets
/// (and fingers). <see cref="FretsSource"/> records which of those the frets came from.
/// </summary>
public sealed class ChordVoicing : Entity
{
    public const int StringCount = 6;
    public const int MaxFret = 24;

    private ChordVoicing() { }

    public Guid ChordId { get; private set; }
    /// <summary>0-based position within the chord (natural key: chord + index).</summary>
    public int Index { get; private set; }
    /// <summary>Fret per string, LOW E first … HIGH e last. -1 = muted, 0 = open. Null when unknown (library data).</summary>
    public int[]? Frets { get; private set; }
    /// <summary>Finger per string (same order). -1 = muted, 0 = open/unfingered, 1–4 = index…pinky. Null when unknown.</summary>
    public int[]? Fingers { get; private set; }
    /// <summary>Lowest fretted position (1 when everything is open/muted); null when frets are unknown.</summary>
    public int? BaseFret { get; private set; }
    /// <summary>"authored" or "chords-db" when <see cref="Frets"/> is known; null when only fingers are known.</summary>
    public string? FretsSource { get; private set; }
    public bool IsPreferred { get; private set; }
    public string? Label { get; private set; }

    internal static ChordVoicing Create(Guid chordId, int index, int[]? frets, int[]? fingers, bool isPreferred, string? label, string? fretsSource)
    {
        if (index < 0) throw new DomainException("Voicing index must be 0 or greater.");
        var voicing = new ChordVoicing { ChordId = chordId, Index = index };
        voicing.SetValues(frets, fingers, isPreferred, label, fretsSource);
        return voicing;
    }

    /// <summary>
    /// Replaces this voicing's content (used by the idempotent importer). Same validation as creation.
    /// <paramref name="fretsSource"/> defaults to "authored" when frets are given; it is ignored (and cleared) when they are not.
    /// </summary>
    public void SetValues(int[]? frets, int[]? fingers, bool isPreferred, string? label, string? fretsSource = null)
    {
        if (frets is null && fingers is null)
            throw new DomainException("A voicing needs frets, fingers, or both.");
        if (frets is not null)
        {
            if (frets.Length != StringCount) throw new DomainException($"A voicing needs exactly {StringCount} fret values (low E first).");
            if (frets.Any(f => f < -1 || f > MaxFret)) throw new DomainException($"Fret values must be between -1 (muted) and {MaxFret}.");
        }
        if (fingers is not null)
        {
            if (fingers.Length != StringCount) throw new DomainException($"Fingers must have exactly {StringCount} values.");
            if (fingers.Any(f => f < -1 || f > 4)) throw new DomainException("Finger values must be between -1 (muted) and 4.");
        }
        if (frets is not null && fretsSource is not null && !FretsSources.IsKnown(fretsSource))
            throw new DomainException($"Unknown frets source '{fretsSource}'.");
        Frets = frets is null ? null : (int[])frets.Clone();
        FretsSource = frets is null ? null : fretsSource ?? FretsSources.Authored;
        Fingers = fingers is null ? null : (int[])fingers.Clone();
        BaseFret = frets is null ? null : frets.Where(f => f > 0).DefaultIfEmpty(1).Min();
        IsPreferred = isPreferred;
        Label = Guard.OptionalText(label, "Voicing label", 60);
    }
}
