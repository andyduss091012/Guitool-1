using System.Text.Json;
using System.Text.Json.Serialization;
using GuitarApp.Domain.Common;

namespace GuitarApp.Importer.Seed;

/// <summary>Reads the frontend's <c>LocalizableText</c>: a plain string (English only) or {en,vi,ja,zh,es}.</summary>
public sealed class LocalizableTextJsonConverter : JsonConverter<LocalizedText>
{
    public override LocalizedText? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        return FromElement(doc.RootElement);
    }

    public static LocalizedText FromElement(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String) return LocalizedText.FromEnglish(element.GetString()!);
        if (element.ValueKind != JsonValueKind.Object) throw new JsonException("Localized text must be a string or an object.");

        string? Get(string name) =>
            element.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

        var en = Get("en");
        if (string.IsNullOrWhiteSpace(en)) throw new JsonException("Localized text is missing its English ('en') value.");
        return new LocalizedText { En = en, Vi = Get("vi"), Ja = Get("ja"), Zh = Get("zh"), Es = Get("es") };
    }

    public override void Write(Utf8JsonWriter writer, LocalizedText value, JsonSerializerOptions options) =>
        throw new NotSupportedException("The importer only reads seed files.");
}
