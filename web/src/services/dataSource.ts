/**
 * Where built-in content (the chord library, the built-in song catalog) comes from.
 *
 *   VITE_DATA_SOURCE=local   (default) — the typed modules under src/data/, no backend needed.
 *   VITE_DATA_SOURCE=api               — the ASP.NET Core API (backend/), which serves the same content from PostgreSQL.
 *
 * `VITE_API_URL` is the address your BROWSER can reach the API at (default http://localhost:5080, the docker-compose port).
 * Both are read at build time. User-created data (custom songs, progress, sessions) stays in localStorage either way until Phase 4.
 */
export type DataSource = 'local' | 'api'

export const DATA_SOURCE: DataSource = import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'local'

export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || 'http://localhost:5080').replace(/\/+$/, '')
