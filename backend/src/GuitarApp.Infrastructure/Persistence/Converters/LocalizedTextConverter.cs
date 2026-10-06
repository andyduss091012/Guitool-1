using System.Text.Json;
using System.Text.Json.Serialization;
using GuitarApp.Domain.Common;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace GuitarApp.Infrastructure.Persistence.Converters;

/// <summary>Stores <see cref="LocalizedText"/> as a jsonb document: {"en":"…","vi":"…"} (nulls omitted).</summary>
public sealed class LocalizedTextConverter : ValueConverter<LocalizedText, string>
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public LocalizedTextConverter() : base(v => ToJson(v), s => FromJson(s))
    {
    }

    public static string ToJson(LocalizedText value) => JsonSerializer.Serialize(value, Options);

    public static LocalizedText FromJson(string json) =>
        JsonSerializer.Deserialize<LocalizedText>(json, Options)
        ?? throw new InvalidOperationException("Localized text column contained JSON null.");
}
