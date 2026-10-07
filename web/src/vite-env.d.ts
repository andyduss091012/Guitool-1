/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the `tabs-server` Docker service — see `src/services/tabShareApi.ts`. */
  readonly VITE_TABS_SERVER_URL?: string
  /** `local` (default) reads built-in content from `src/data/`; `api` reads it from the backend — see `src/services/dataSource.ts`. */
  readonly VITE_DATA_SOURCE?: 'local' | 'api'
  /** Base URL of the backend API as the browser sees it (default http://localhost:5080). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
