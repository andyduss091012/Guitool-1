using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Gear;

public sealed class Amp : Entity
{
    private Amp() { }

    public string Slug { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string? Brand { get; private set; }

    public static Amp Create(string slug, string name, string? brand = null) => new()
    {
        Slug = Guard.Slug(slug, "Amp slug"),
        Name = Guard.NotBlank(name, "Amp name", 120),
        Brand = Guard.OptionalText(brand, "Amp brand", 120),
    };
}
