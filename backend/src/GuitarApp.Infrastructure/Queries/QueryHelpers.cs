namespace GuitarApp.Infrastructure.Queries;

internal static class QueryHelpers
{
    /// <summary>Builds an ILIKE "contains" pattern, escaping LIKE wildcards so user input is matched literally.</summary>
    public static string Contains(string text)
    {
        var escaped = text.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
        return $"%{escaped}%";
    }
}
