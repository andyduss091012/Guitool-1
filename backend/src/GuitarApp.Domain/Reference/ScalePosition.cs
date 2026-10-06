using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

public sealed class ScalePosition : Entity
{
    private readonly List<ScalePositionNote> _notes = new();

    private ScalePosition() { }

    public Guid ScaleId { get; private set; }
    public int Index { get; private set; }
    /// <summary>e.g. "Shape 1".</summary>
    public string Label { get; private set; } = null!;
    public int StartFret { get; private set; }
    public int FretCount { get; private set; }
    public IReadOnlyCollection<ScalePositionNote> Notes => _notes;

    internal static ScalePosition Create(Guid scaleId, int index, string label, int startFret, int fretCount) => new()
    {
        ScaleId = scaleId,
        Index = Guard.InRange(index, 0, 99, "Position index"),
        Label = Guard.NotBlank(label, "Position label", 60),
        StartFret = Guard.InRange(startFret, 0, 24, "Start fret"),
        FretCount = Guard.InRange(fretCount, 1, 24, "Fret count"),
    };

    /// <param name="stringNumber">App convention: 1 = low E … 6 = high e (see DECISIONS.md).</param>
    public ScalePositionNote AddNote(int stringNumber, int fret, string? interval = null, bool isRoot = false, int? finger = null)
    {
        var note = ScalePositionNote.Create(Id, stringNumber, fret, interval, isRoot, finger);
        _notes.Add(note);
        return note;
    }
}
