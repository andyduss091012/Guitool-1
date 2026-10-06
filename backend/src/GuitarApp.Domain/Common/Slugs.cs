using System.Text.RegularExpressions;

namespace GuitarApp.Domain.Common;

public static class Slugs
{
    public const int MaxLength = 120;

    // lower-case letters/digits separated by single hyphens, e.g. "song-master-of-puppets"
    private static readonly Regex Pattern = new("^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static bool IsValid(string? value) =>
        !string.IsNullOrEmpty(value) && value.Length <= MaxLength && Pattern.IsMatch(value);
}
