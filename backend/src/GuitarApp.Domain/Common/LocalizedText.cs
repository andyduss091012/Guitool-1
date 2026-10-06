namespace GuitarApp.Domain.Common;

/// <summary>
/// User-facing text in the app's five languages. English is required and is the fallback;
/// stored as jsonb <c>{"en": "...", "vi": "..."}</c> (see DECISIONS.md, "localized content").
/// </summary>
public sealed record LocalizedText
{
    public required string En { get; init; }
    public string? Vi { get; init; }
    public string? Ja { get; init; }
    public string? Zh { get; init; }
    public string? Es { get; init; }

    public static readonly IReadOnlyList<string> Languages = new[] { "en", "vi", "ja", "zh", "es" };

    public static LocalizedText FromEnglish(string en) => new() { En = Guard.NotBlank(en, "English text", 8000) };

    /// <summary>Value for <paramref name="language"/> (en/vi/ja/zh/es), falling back to English.</summary>
    public string Get(string? language)
    {
        var value = language?.ToLowerInvariant() switch
        {
            "vi" => Vi,
            "ja" => Ja,
            "zh" => Zh,
            "es" => Es,
            _ => En,
        };
        return string.IsNullOrWhiteSpace(value) ? En : value;
    }
}
