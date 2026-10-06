using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Reference;

public sealed class Technique : Entity
{
    private Technique() { }

    public string Slug { get; private set; } = null!;
    public LocalizedText Name { get; private set; } = null!;
    public LocalizedText? Description { get; private set; }

    public static Technique Create(string slug, LocalizedText name, LocalizedText? description = null) => new()
    {
        Slug = Guard.Slug(slug, "Technique slug"),
        Name = name ?? throw new DomainException("Technique name is required."),
        Description = description,
    };
}
