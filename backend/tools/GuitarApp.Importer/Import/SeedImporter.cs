using System.Text.Json.Nodes;
using GuitarApp.Domain.Common;
using GuitarApp.Domain.Music;
using GuitarApp.Domain.Reference;
using GuitarApp.Importer.Seed;
using GuitarApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Importer.Import;

/// <summary>
/// Idempotent seed import. Every record is matched by its natural key (slug, name, or root+quality[+index]),
/// created when missing and updated when different, so running it twice changes nothing the second time.
/// All-or-nothing: if any record is invalid, nothing is saved and the report lists the errors.
/// </summary>
public sealed class SeedImporter
{
    private readonly GuitarAppDbContext _db;
    private ImportReport _report = new();

    public SeedImporter(GuitarAppDbContext db)
    {
        _db = db;
    }

    public async Task<ImportReport> RunAsync(SeedData seed, ImportOptions options, CancellationToken ct = default)
    {
        _report = new ImportReport { DryRun = options.DryRun };
        // Thousands of tracked rows: detect changes once, explicitly, instead of on every call.
        _db.ChangeTracker.AutoDetectChangesEnabled = false;

        var tunings = await StageTuningsAsync(seed, ct);
        var artists = await StageArtistsAsync(seed, ct);
        await StageSongsAsync(seed, tunings, artists, ct);
        var chords = await StageChordLibraryAsync(seed, ct);
        StageChordConceptShapes(seed, chords);
        StageChordsDbVoicings(seed, chords);
        await StageScalesAsync(seed, ct);
        await StageConceptDocumentsAsync(seed, ct);

        _db.ChangeTracker.DetectChanges();
        CountChanges();

        if (_report.Errors.Count == 0 && !options.DryRun)
        {
            await _db.SaveChangesAsync(ct);
            _report.Saved = true;
        }

        _db.ChangeTracker.Clear();
        return _report;
    }

    // ---------- reference rows ----------

    private async Task<Dictionary<string, Tuning>> StageTuningsAsync(SeedData seed, CancellationToken ct)
    {
        _report.Section("tunings").Seeded = seed.Tunings.Count;
        var existing = await _db.Tunings.ToDictionaryAsync(t => t.Name, ct);
        foreach (var s in seed.Tunings)
        {
            Try("tunings", s.Name, () =>
            {
                if (existing.TryGetValue(s.Name, out var tuning)) tuning.Update(s.Name, s.Notes);
                else
                {
                    tuning = Tuning.Create(s.Name, s.Notes);
                    _db.Tunings.Add(tuning);
                    existing[s.Name] = tuning;
                }
            });
        }
        return existing;
    }

    private async Task<Dictionary<string, Artist>> StageArtistsAsync(SeedData seed, CancellationToken ct)
    {
        _report.Section("artists").Seeded = seed.Artists.Count;
        var existing = await _db.Artists.ToDictionaryAsync(a => a.Slug, ct);
        foreach (var s in seed.Artists)
        {
            Try("artists", s.Slug, () =>
            {
                if (existing.TryGetValue(s.Slug, out var artist)) artist.Update(s.Name, artist.ImageKey);
                else
                {
                    artist = Artist.Create(s.Name, s.Slug);
                    _db.Artists.Add(artist);
                    existing[s.Slug] = artist;
                }
            });
        }
        return existing;
    }

    private async Task StageSongsAsync(SeedData seed, Dictionary<string, Tuning> tunings, Dictionary<string, Artist> artists, CancellationToken ct)
    {
        _report.Section("songs").Seeded = seed.Songs.Count;
        var existing = await _db.Songs.ToDictionaryAsync(s => s.Slug, ct);
        foreach (var s in seed.Songs)
        {
            Try("songs", s.Slug, () =>
            {
                if (!artists.TryGetValue(s.ArtistSlug, out var artist))
                    throw new DomainException($"artist '{s.ArtistSlug}' is not in artists.json");

                Guid? tuningId = null;
                if (!string.IsNullOrWhiteSpace(s.Tuning))
                {
                    if (tunings.TryGetValue(s.Tuning, out var tuning)) tuningId = tuning.Id;
                    else _report.Warnings.Add($"songs: {s.Slug}: tuning '{s.Tuning}' is not in tunings.json; imported without a tuning.");
                }

                if (existing.TryGetValue(s.Slug, out var song))
                {
                    // Keep fields the seed does not carry (album, bpm, year, duration) as they are in the database.
                    song.Update(s.Title, artist.Id, s.Genre, s.Difficulty, tuningId, song.AlbumId, s.Capo, s.KeySignature,
                        song.Bpm, song.Year, song.DurationSeconds, s.PracticeNotes, s.Tags);
                }
                else
                {
                    song = Song.Create(s.Slug, s.Title, artist.Id, s.Genre, s.Difficulty, tuningId, null, s.Capo, s.KeySignature,
                        null, null, null, s.PracticeNotes, s.Tags);
                    _db.Songs.Add(song);
                    existing[s.Slug] = song;
                }
            });
        }
    }

    // ---------- chords ----------

    private async Task<Dictionary<(string Root, string Quality), Chord>> StageChordLibraryAsync(SeedData seed, CancellationToken ct)
    {
        _report.Section("chords").Seeded = seed.Chords.Count;
        _report.Section("chordVoicings").Seeded = seed.Chords.Sum(c => c.Voicings.Count);

        var chords = await _db.Chords.Include(c => c.Voicings).ToListAsync(ct);
        var byKey = chords.ToDictionary(c => (c.Root, c.Quality));

        foreach (var s in seed.Chords)
        {
            Try("chords", $"{s.Root} {s.Quality}", () =>
            {
                if (byKey.TryGetValue((s.Root, s.Quality), out var chord)) chord.SetLabel(s.Label);
                else
                {
                    chord = Chord.Create(s.Root, s.Quality, s.Label);
                    _db.Chords.Add(chord);
                    byKey[(s.Root, s.Quality)] = chord;
                }

                // The library only knows fingerings (see SeedVoicing): frets stay unknown unless a concept shape supplies them.
                foreach (var v in s.Voicings)
                {
                    var voicing = chord.FindVoicing(v.Index);
                    if (voicing is null) _db.ChordVoicings.Add(chord.AddVoicingAt(v.Index, null, v.Frets));
                    else voicing.SetValues(null, v.Frets, false, null);
                }
            });
        }
        return byKey;
    }

    /// <summary>Hand-authored chord shapes have real frets + fingers: attach them to the matching library voicing, or add them.</summary>
    private void StageChordConceptShapes(SeedData seed, Dictionary<(string Root, string Quality), Chord> chords)
    {
        foreach (var concept in seed.Concepts.Where(c => c.Type == MusicConcept.ChordKind))
        {
            if (!ConceptMapper.ChordConceptTargets.TryGetValue(concept.Slug, out var target))
            {
                _report.Warnings.Add($"concepts: {concept.Slug}: no target chord configured in ConceptMapper; its shapes were not merged into chord voicings.");
                continue;
            }
            if (!chords.TryGetValue(target, out var chord))
            {
                _report.Warnings.Add($"concepts: {concept.Slug}: chord {target.Root} {target.Quality} is not in the chord library; shapes not merged.");
                continue;
            }

            foreach (var shape in concept.Shapes)
            {
                Try("concepts", $"{concept.Slug}/{shape.Id}", () =>
                {
                    var (frets, fingers, problem) = ConceptMapper.DeriveChordVoicing(shape);
                    if (frets is null) throw new DomainException($"shape '{shape.Label}': {problem}");

                    var match = chord.Voicings.FirstOrDefault(v => v.Frets is not null && v.Frets.SequenceEqual(frets))
                                ?? (fingers is null ? null : chord.Voicings.FirstOrDefault(v => v.Frets is null && v.Fingers is not null && v.Fingers.SequenceEqual(fingers)));

                    if (match is not null)
                    {
                        match.SetValues(frets, fingers ?? match.Fingers, true, shape.Label);
                    }
                    else
                    {
                        _db.ChordVoicings.Add(chord.AddVoicing(frets, fingers, true, shape.Label));
                        _report.Warnings.Add($"concepts: {concept.Slug}/{shape.Id} ('{shape.Label}') is not in the chord library; added as an extra preferred voicing of {target.Root} {target.Quality}.");
                    }
                });
            }
        }
    }

    /// <summary>
    /// Real-fret voicings from chords-db (frets_source = "chords-db"). Matched to existing voicings by their frets, so a re-run
    /// changes nothing and a hand-authored voicing with the same frets keeps its "authored" source. Finger-only library
    /// voicings are never merged with these (the same finger pattern can be played at different frets).
    /// Enharmonic spellings (A# / Bb) each get their own copy, mirroring the library's separate rows.
    /// </summary>
    private void StageChordsDbVoicings(SeedData seed, Dictionary<(string Root, string Quality), Chord> chords)
    {
        var data = seed.ChordsDb;
        if (data is null)
        {
            _report.Warnings.Add("chord-voicings.json not found: chords-db voicings were not imported.");
            return;
        }

        var labelByQuality = seed.Chords.GroupBy(c => c.Quality).ToDictionary(g => g.Key, g => g.First().Label);
        var seededPairs = seed.Chords.Select(c => (c.Root, c.Quality)).ToHashSet();
        var newPairs = new HashSet<(string, string)>();
        var voicingCount = 0;

        foreach (var source in data.Chords)
        {
            foreach (var root in data.RootToKey.Where(kv => kv.Value == source.Key).Select(kv => kv.Key))
            {
                voicingCount += source.Voicings.Count;
                Try("chordsDb", $"{root} {source.Quality}", () =>
                {
                    if (!chords.TryGetValue((root, source.Quality), out var chord))
                    {
                        if (!labelByQuality.TryGetValue(source.Quality, out var label))
                        {
                            label = source.Quality;
                            _report.Warnings.Add($"chordsDb: no display label known for quality '{source.Quality}'; using the code.");
                        }
                        chord = Chord.Create(root, source.Quality, label);
                        _db.Chords.Add(chord);
                        chords[(root, source.Quality)] = chord;
                    }
                    if (!seededPairs.Contains((root, source.Quality))) newPairs.Add((root, source.Quality));

                    foreach (var v in source.Voicings)
                    {
                        var match = chord.Voicings.FirstOrDefault(x => x.Frets is not null && x.Frets.SequenceEqual(v.Frets));
                        if (match is null)
                        {
                            _db.ChordVoicings.Add(chord.AddVoicing(v.Frets, v.Fingers, false, null, FretsSources.ChordsDb));
                        }
                        else if (match.FretsSource == FretsSources.ChordsDb && !(match.Fingers?.SequenceEqual(v.Fingers) ?? false))
                        {
                            match.SetValues(v.Frets, v.Fingers, match.IsPreferred, match.Label, FretsSources.ChordsDb);
                        }
                    }
                });
            }
        }

        _report.Section("chords").Seeded += newPairs.Count;
        _report.Section("chordVoicings").Seeded += voicingCount;
    }

    // ---------- scales ----------

    private async Task StageScalesAsync(SeedData seed, CancellationToken ct)
    {
        var scaleConcepts = seed.Concepts.Where(c => c.Type == MusicConcept.ScaleKind).ToList();
        _report.Section("scales").Seeded = scaleConcepts.Count;
        _report.Section("scalePositions").Seeded = scaleConcepts.Sum(c => c.Shapes.Count);

        var existing = await _db.Scales.Include(s => s.Positions).ThenInclude(p => p.Notes).ToDictionaryAsync(s => s.Slug, ct);
        foreach (var c in scaleConcepts)
        {
            Try("scales", c.Slug, () =>
            {
                var pattern = ConceptMapper.IntervalPattern(c.Shapes);
                if (!existing.TryGetValue(c.Slug, out var scale))
                {
                    scale = Scale.Create(c.Slug, c.Name, c.Category, pattern, c.Description);
                    _db.Scales.Add(scale);
                    existing[c.Slug] = scale;
                    BuildPositions(scale, c, track: true);
                    return;
                }

                scale.Update(c.Name, c.Category, pattern, c.Description);
                var probe = Scale.Create(c.Slug, c.Name, c.Category, pattern, c.Description);
                BuildPositions(probe, c, track: false);
                if (probe.PositionsFingerprint() == scale.PositionsFingerprint()) return;

                foreach (var position in scale.Positions.ToList()) _db.ScalePositions.Remove(position);
                scale.ClearPositions();
                BuildPositions(scale, c, track: true);
            });
        }
    }

    private void BuildPositions(Scale scale, SeedConcept concept, bool track)
    {
        foreach (var shape in concept.Shapes)
        {
            var position = scale.AddPosition(shape.Label, shape.StartFret, shape.FretCount);
            if (track) _db.ScalePositions.Add(position);
            foreach (var p in shape.Positions)
            {
                var note = position.AddNote(p.String, p.Fret, p.Interval, p.Role == "root", p.Finger);
                if (track) _db.ScalePositionNotes.Add(note);
            }
        }
    }

    // ---------- concept documents ----------

    private async Task StageConceptDocumentsAsync(SeedData seed, CancellationToken ct)
    {
        _report.Section("musicConcepts").Seeded = seed.Concepts.Count;
        var existing = await _db.MusicConcepts.ToDictionaryAsync(c => c.Slug, ct);
        foreach (var c in seed.Concepts)
        {
            Try("musicConcepts", c.Slug, () =>
            {
                if (!existing.TryGetValue(c.Slug, out var concept))
                {
                    concept = MusicConcept.Create(c.Slug, c.Type, c.Category, c.Name, c.Description, c.ShapesJson, c.Aliases);
                    _db.MusicConcepts.Add(concept);
                    existing[c.Slug] = concept;
                    return;
                }

                // jsonb normalises key order/whitespace, so compare shapes as JSON values, not as text.
                var same = concept.Kind == c.Type
                           && concept.Category == c.Category
                           && concept.Name == c.Name
                           && concept.Description == c.Description
                           && concept.Aliases.SequenceEqual(c.Aliases)
                           && JsonNode.DeepEquals(JsonNode.Parse(concept.ShapesJson), JsonNode.Parse(c.ShapesJson));
                if (!same) concept.Update(c.Type, c.Category, c.Name, c.Description, c.ShapesJson, c.Aliases);
            });
        }
    }

    // ---------- helpers ----------

    private void Try(string area, string what, Action action)
    {
        try
        {
            action();
        }
        catch (DomainException ex)
        {
            _report.Errors.Add($"{area}: {what}: {ex.Message}");
        }
    }

    private void CountChanges()
    {
        var names = new Dictionary<Type, string>
        {
            [typeof(Tuning)] = "tunings",
            [typeof(Artist)] = "artists",
            [typeof(Song)] = "songs",
            [typeof(Chord)] = "chords",
            [typeof(ChordVoicing)] = "chordVoicings",
            [typeof(Scale)] = "scales",
            [typeof(ScalePosition)] = "scalePositions",
            [typeof(MusicConcept)] = "musicConcepts",
        };

        foreach (var entry in _db.ChangeTracker.Entries())
        {
            if (!names.TryGetValue(entry.Entity.GetType(), out var name)) continue;
            var section = _report.Section(name);
            switch (entry.State)
            {
                case EntityState.Added: section.Created++; break;
                case EntityState.Modified: section.Updated++; break;
                case EntityState.Deleted: section.Deleted++; break;
            }
        }
    }
}
