using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Gear;

public sealed class PresetBlock : Entity
{
    private PresetBlock() { }

    public Guid PresetId { get; private set; }
    public int Order { get; private set; }
    public Guid? EffectId { get; private set; }
    public string SettingsJson { get; private set; } = "{}";

    internal static PresetBlock Create(Guid presetId, int order, Guid? effectId, string settingsJson)
    {
        var json = Guard.NotBlank(settingsJson, "Settings", 4000);
        if (!json.StartsWith('{') || !json.EndsWith('}')) throw new DomainException("Settings must be a JSON object.");
        return new PresetBlock { PresetId = presetId, Order = order, EffectId = effectId, SettingsJson = json };
    }
}
