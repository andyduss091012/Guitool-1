namespace GuitarApp.Importer.Tests;

internal static class SeedFiles
{
    /// <summary>The importer project copies its seed folder next to its binaries; the tests reference that project.</summary>
    public static string Directory
    {
        get
        {
            var path = Path.Combine(AppContext.BaseDirectory, "seed");
            if (!System.IO.Directory.Exists(path))
                throw new DirectoryNotFoundException($"Seed folder not found at {path}. Run `node scripts/export-seed.mjs` in web/ and rebuild.");
            return path;
        }
    }
}
