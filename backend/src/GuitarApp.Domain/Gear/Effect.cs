using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Gear;

public sealed class Effect : Entity
{
    private Effect() { }

    public string Slug { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    /// <summary>e.g. "overdrive", "delay", "reverb".</summary>
    public string Kind { get; private set; } = null!;

    public static Effect Create(string slug, string name, string kind) => new()
    {
        Slug = Guard.Slug(slug, "Effect slug"),
        Name = Guard.NotBlank(name, "Effect name", 120),
        Kind = Guard.NotBlank(kind, "Effect kind", 60),
    };
}
