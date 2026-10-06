using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

public sealed class ScalePositionNote : Entity
{
    private ScalePositionNote() { }

    public Guid ScalePositionId { get; private set; }
    /// <summary>1 = low E … 6 = high e (the app's convention, kept end-to-end).</summary>
    public int String { get; private set; }
    public int Fret { get; private set; }
    public string? Interval { get; private set; }
    public bool IsRoot { get; private set; }
    public int? Finger { get; private set; }

    internal static ScalePositionNote Create(Guid scalePositionId, int stringNumber, int fret, string? interval, bool isRoot, int? finger) => new()
    {
        ScalePositionId = scalePositionId,
        String = Guard.InRange(stringNumber, 1, 6, "String"),
        Fret = Guard.InRange(fret, 0, 24, "Fret"),
        Interval = Guard.OptionalText(interval, "Interval", 8),
        IsRoot = isRoot,
        Finger = Guard.InRangeOrNull(finger, 1, 4, "Finger"),
    };
}
