using GuitarApp.Domain.Common;
using GuitarApp.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuitarApp.Infrastructure.Persistence.Configurations;

internal static class ConfigurationExtensions
{
    public const string SlugRegex = "'^[a-z0-9]+(-[a-z0-9]+)*$'";

    /// <summary>Key, client-generated id and the two timestamp columns shared by every entity.</summary>
    public static void ConfigureEntity<T>(this EntityTypeBuilder<T> builder) where T : Entity
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz");
        builder.Property(x => x.UpdatedAt).HasColumnType("timestamptz");
    }

    public static PropertyBuilder<LocalizedText> AsLocalizedJson(this PropertyBuilder<LocalizedText> property) =>
        property.HasConversion(new LocalizedTextConverter()).HasColumnType("jsonb");
}
