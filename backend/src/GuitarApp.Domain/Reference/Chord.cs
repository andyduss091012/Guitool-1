using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

/// <summary>A chord by spelled root + quality, e.g. ("A#", "m7"). Enharmonic twins (A#/Bb) are separate rows.</summary>
public sealed class Chord : Entity
{
    private readonly List<ChordVoicing> _voicings = new();

    private Chord() { }

    /// <summary>Spelled root: A–G with an optional "#" or "b".</summary>
    public string Root { get; private set; } = null!;
    /// <summary>Quality code as used by the app's chord library (maj, m, 7, m7, 7(#9), 6/9 …).</summary>
    public string Quality { get; private set; } = null!;
    /// <summary>Human label for the quality, e.g. "Minor 7th".</summary>
    public string Label { get; private set; } = null!;
    public IReadOnlyCollection<ChordVoicing> Voicings => _voicings;

    public static Chord Create(string root, string quality, string label)
    {
        var r = Guard.NotBlank(root, "Chord root", 3);
        if (r.Length is < 1 or > 2 || !"ABCDEFG".Contains(r[0]) || (r.Length == 2 && r[1] != '#' && r[1] != 'b'))
            throw new DomainException("Chord root must be A–G with an optional # or b.");
        return new Chord
        {
            Root = r,
            Quality = Guard.NotBlank(quality, "Chord quality", 20),
            Label = Guard.NotBlank(label, "Chord label", 80),
        };
    }

    /// <summary>Adds a voicing; its Index is the next free position (0-based, stable per chord).</summary>
    public ChordVoicing AddVoicing(int[]? frets, int[]? fingers = null, bool isPreferred = false, string? label = null, string? fretsSource = null)
    {
        var index = _voicings.Count == 0 ? 0 : _voicings.Max(v => v.Index) + 1;
        return AddVoicingAt(index, frets, fingers, isPreferred, label, fretsSource);
    }

    /// <summary>Adds a voicing at an explicit index (importer: the library's own order). Throws if the index is taken.</summary>
    public ChordVoicing AddVoicingAt(int index, int[]? frets, int[]? fingers = null, bool isPreferred = false, string? label = null, string? fretsSource = null)
    {
        if (_voicings.Any(v => v.Index == index)) throw new DomainException($"Chord {Root}{Quality} already has a voicing at index {index}.");
        var voicing = ChordVoicing.Create(Id, index, frets, fingers, isPreferred, label, fretsSource);
        _voicings.Add(voicing);
        return voicing;
    }

    public ChordVoicing? FindVoicing(int index) => _voicings.FirstOrDefault(v => v.Index == index);

    public void SetLabel(string label) => Label = Guard.NotBlank(label, "Chord label", 80);
}
