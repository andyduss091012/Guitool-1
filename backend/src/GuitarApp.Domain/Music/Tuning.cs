using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Music;

public sealed class Tuning : Entity
{
    private Tuning() { }

    /// <summary>Display name, e.g. "Standard (EADGBE)". The seed data matches songs on this exact text.</summary>
    public string Name { get; private set; } = null!;
    /// <summary>Space-separated notes from the lowest to the highest string, e.g. "E A D G B E".</summary>
    public string Notes { get; private set; } = null!;

    public static Tuning Create(string name, string notes)
    {
        var tuning = new Tuning();
        tuning.Update(name, notes);
        return tuning;
    }

    public void Update(string name, string notes)
    {
        var parts = Guard.NotBlank(notes, "Tuning notes", 60).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 6) throw new DomainException("Tuning notes must list exactly 6 notes, low string first.");
        Name = Guard.NotBlank(name, "Tuning name", 100);
        Notes = string.Join(' ', parts);
    }
}
