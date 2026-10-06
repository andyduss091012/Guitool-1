# Third-party notices

## @tombatossals/chords-db 0.5.1

Guitar chord fingering data used for the chord library (web app and backend importer).

- Source: https://github.com/tombatossals/chords-db (npm package `@tombatossals/chords-db`)
- License: MIT
- Vendored file: `backend/tools/GuitarApp.Importer/third-party/chords-db/package/lib/guitar.json`
- SHA-256 of `guitar.json`: `23731147b3d070fa59b30e79570818a9689f126f76e77b04899d73934ba54d4e`
- SHA-256 of the npm tarball: `12cb3d49e4df882e2a7eb212321a961b0e6e1576d3442edae52bc8433136b674`
- Only the data file is used; no code from the package is executed. `web/scripts/build-chord-voicings.mjs` refuses to run
  if the data file's hash changes, validates every voicing against the dataset's own MIDI notes, and writes
  `web/src/data/chordVoicings.generated.ts` and `backend/tools/GuitarApp.Importer/seed/chord-voicings.json`.

```
MIT License

Copyright (c) 2016 David Rubert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
