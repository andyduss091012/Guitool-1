using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Gear;

public sealed class Preset : Entity
{
    private readonly List<PresetBlock> _blocks = new();

    private Preset() { }

    public string Slug { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public Guid? AmpId { get; private set; }
    public IReadOnlyCollection<PresetBlock> Blocks => _blocks;

    public static Preset Create(string slug, string name, Guid? ampId = null) => new()
    {
        Slug = Guard.Slug(slug, "Preset slug"),
        Name = Guard.NotBlank(name, "Preset name", 120),
        AmpId = ampId,
    };

    /// <param name="settingsJson">JSON object with the block's knob values; must start with '{'.</param>
    public PresetBlock AddBlock(Guid? effectId, string settingsJson)
    {
        var order = _blocks.Count == 0 ? 0 : _blocks.Max(b => b.Order) + 1;
        var block = PresetBlock.Create(Id, order, effectId, settingsJson);
        _blocks.Add(block);
        return block;
    }
}
