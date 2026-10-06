namespace GuitarApp.Domain.Common;

/// <summary>Small guard-clause helpers that throw <see cref="DomainException"/> with a field name.</summary>
public static class Guard
{
    public static string NotBlank(string? value, string name, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException($"{name} is required.");
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength) throw new DomainException($"{name} must be at most {maxLength} characters.");
        return trimmed;
    }

    public static string? OptionalText(string? value, string name, int maxLength = 500) =>
        string.IsNullOrWhiteSpace(value) ? null : NotBlank(value, name, maxLength);

    public static string Slug(string? value, string name)
    {
        if (!Slugs.IsValid(value))
            throw new DomainException($"{name} must be lower-case letters/digits separated by single hyphens (max {Slugs.MaxLength} characters).");
        return value!;
    }

    public static int InRange(int value, int min, int max, string name)
    {
        if (value < min || value > max) throw new DomainException($"{name} must be between {min} and {max}.");
        return value;
    }

    public static int? InRangeOrNull(int? value, int min, int max, string name) =>
        value is null ? null : InRange(value.Value, min, max, name);

    public static Guid NotEmpty(Guid value, string name)
    {
        if (value == Guid.Empty) throw new DomainException($"{name} is required.");
        return value;
    }
}
