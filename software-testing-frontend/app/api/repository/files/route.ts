import { NextResponse } from "next/server"
import { isSupportedRepoUrl, getLanguageFromExtension, formatFileSize } from "@/lib/api-data"
import type { FileItem } from "@/lib/api-data"

interface RepositoryRequestBody {
  url?: string
}

// ── GitHub API types ────────────────────────────────────────────────────────

interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree" | "commit"
  sha: string
  size?: number
  url: string
}

interface GitHubTreeResponse {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

// ── GitLab API types ────────────────────────────────────────────────────────

interface GitLabTreeItem {
  id: string
  name: string
  type: "blob" | "tree"
  path: string
  mode: string
}

// ── URL parsers ─────────────────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null
    const parts = parsed.pathname
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .replace(/\.git$/, "")
      .split("/")
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return null
  }
}

function parseGitLabUrl(url: string): { namespace: string } | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== "gitlab.com" && parsed.hostname !== "www.gitlab.com") return null
    const namespace = parsed.pathname
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .replace(/\.git$/, "")
    if (!namespace) return null
    return { namespace }
  } catch {
    return null
  }
}

// ── Fetchers ────────────────────────────────────────────────────────────────

async function fetchGitHubFiles(owner: string, repo: string): Promise<FileItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "TestForge-App",
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`GitHub API error ${res.status}: ${errorBody}`)
  }

  const data = (await res.json()) as GitHubTreeResponse

  return data.tree
    .filter((item) => item.type === "blob" || item.type === "tree")
    .map((item): FileItem => ({
      name: item.path,
      type: item.type === "tree" ? "folder" : "file",
      size: item.size !== undefined ? formatFileSize(item.size) : undefined,
      language: item.type === "blob" ? getLanguageFromExtension(item.path) : undefined,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

async function fetchGitLabFiles(namespace: string): Promise<FileItem[]> {
  const encodedId = encodeURIComponent(namespace)
  const headers: Record<string, string> = { "User-Agent": "TestForge-App" }

  const token = process.env.GITLAB_TOKEN
  if (token) {
    headers["PRIVATE-TOKEN"] = token
  }

  const allItems: GitLabTreeItem[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedId}/repository/tree?recursive=true&per_page=100&page=${page}`,
      { headers },
    )

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`GitLab API error ${res.status}: ${errorBody}`)
    }

    const items = (await res.json()) as GitLabTreeItem[]
    allItems.push(...items)

    const totalPages = parseInt(res.headers.get("X-Total-Pages") ?? "1", 10)
    if (page >= totalPages) break
    page++
  }

  return allItems
    .map((item): FileItem => ({
      name: item.path,
      type: item.type === "tree" ? "folder" : "file",
      language: item.type === "blob" ? getLanguageFromExtension(item.path) : undefined,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = (await request.json()) as RepositoryRequestBody
  const url = body.url?.trim()

  if (!url) {
    return NextResponse.json({ error: "Repository URL is required." }, { status: 400 })
  }

  if (!isSupportedRepoUrl(url)) {
    return NextResponse.json({ files: [], message: "Unsupported repository host." }, { status: 200 })
  }

  try {
    const githubInfo = parseGitHubUrl(url)
    if (githubInfo) {
      const files = await fetchGitHubFiles(githubInfo.owner, githubInfo.repo)
      return NextResponse.json({ files })
    }

    const gitlabInfo = parseGitLabUrl(url)
    if (gitlabInfo) {
      const files = await fetchGitLabFiles(gitlabInfo.namespace)
      return NextResponse.json({ files })
    }

    return NextResponse.json({ files: [], message: "Could not parse repository URL." }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repository files."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
