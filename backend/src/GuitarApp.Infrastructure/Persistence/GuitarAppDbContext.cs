using GuitarApp.Domain.Gear;
using GuitarApp.Domain.Music;
using GuitarApp.Domain.Reference;
using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Infrastructure.Persistence;

public sealed class GuitarAppDbContext : DbContext
{
    public GuitarAppDbContext(DbContextOptions<GuitarAppDbContext> options) : base(options)
    {
    }

    // Music
    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<Tuning> Tunings => Set<Tuning>();
    public DbSet<Song> Songs => Set<Song>();

    // Reference
    public DbSet<Chord> Chords => Set<Chord>();
    public DbSet<ChordVoicing> ChordVoicings => Set<ChordVoicing>();
    public DbSet<Scale> Scales => Set<Scale>();
    public DbSet<ScalePosition> ScalePositions => Set<ScalePosition>();
    public DbSet<ScalePositionNote> ScalePositionNotes => Set<ScalePositionNote>();
    public DbSet<Technique> Techniques => Set<Technique>();
    public DbSet<MusicConcept> MusicConcepts => Set<MusicConcept>();

    // Gear (tables ship empty — no source data yet, see DECISIONS.md)
    public DbSet<Amp> Amps => Set<Amp>();
    public DbSet<Effect> Effects => Set<Effect>();
    public DbSet<Preset> Presets => Set<Preset>();
    public DbSet<PresetBlock> PresetBlocks => Set<PresetBlock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GuitarAppDbContext).Assembly);
    }
}
