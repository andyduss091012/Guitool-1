using GuitarApp.Domain.Music;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuitarApp.Infrastructure.Persistence.Configurations;

internal sealed class ArtistConfiguration : IEntityTypeConfiguration<Artist>
{
    public void Configure(EntityTypeBuilder<Artist> builder)
    {
        builder.ToTable("artists", t => t.HasCheckConstraint("ck_artists_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.ImageKey).HasMaxLength(300);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.Name);
    }
}

internal sealed class AlbumConfiguration : IEntityTypeConfiguration<Album>
{
    public void Configure(EntityTypeBuilder<Album> builder)
    {
        builder.ToTable("albums", t => t.HasCheckConstraint("ck_albums_year", "year IS NULL OR year BETWEEN 1900 AND 2100"));
        builder.ConfigureEntity();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.HasOne(x => x.Artist).WithMany().HasForeignKey(x => x.ArtistId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ArtistId, x.Title }).IsUnique();
    }
}

internal sealed class TuningConfiguration : IEntityTypeConfiguration<Tuning>
{
    public void Configure(EntityTypeBuilder<Tuning> builder)
    {
        builder.ToTable("tunings");
        builder.ConfigureEntity();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
    }
}

internal sealed class SongConfiguration : IEntityTypeConfiguration<Song>
{
    public void Configure(EntityTypeBuilder<Song> builder)
    {
        builder.ToTable("songs", t =>
        {
            t.HasCheckConstraint("ck_songs_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}");
            t.HasCheckConstraint("ck_songs_difficulty", "difficulty BETWEEN 1 AND 5");
            t.HasCheckConstraint("ck_songs_capo", "capo IS NULL OR capo BETWEEN 0 AND 12");
            t.HasCheckConstraint("ck_songs_bpm", "bpm IS NULL OR bpm BETWEEN 20 AND 400");
        });
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Genre).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Key).HasMaxLength(30);
        builder.Property(x => x.ThumbnailKey).HasMaxLength(300);
        builder.Property(x => x.Description).AsLocalizedJson();
        builder.Property(x => x.Tags).HasColumnType("text[]");

        builder.HasOne(x => x.Artist).WithMany(a => a.Songs).HasForeignKey(x => x.ArtistId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Album).WithMany().HasForeignKey(x => x.AlbumId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.Tuning).WithMany().HasForeignKey(x => x.TuningId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.ArtistId);
        builder.HasIndex(x => x.Genre);
        builder.HasIndex(x => x.Difficulty);
        builder.HasIndex(x => x.Tags).HasMethod("gin");
    }
}
