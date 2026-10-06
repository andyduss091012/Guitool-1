import { API_BASE_URL } from '../dataSource'

/** A non-2xx answer (or no answer at all) from the API. `status` is 0 when the request never reached it. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
}

/** GETs `path` (e.g. `/api/songs?page=1`) from the API and parses the JSON body. */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' }, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(`Could not reach the API at ${API_BASE_URL}`, 0)
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`.trim()
    try {
      const problem = (await response.json()) as ProblemDetails
      message = problem.detail || problem.title || message
    } catch {
      // not a problem+json body; keep the status line
    }
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}
