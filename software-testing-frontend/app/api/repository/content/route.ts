import { NextResponse } from "next/server"
import { throwIfGitHubRateLimited } from "@/lib/api-data"

interface ContentRequestBody {
  repoUrl?: string
  filePath?: string
}

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

async function fetchGitHubFileContent(owner: string, repo: string, filePath: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "TestForge-App",
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/")
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`,
    { headers, next: { revalidate: 300 } },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throwIfGitHubRateLimited(res.status, res.headers.get("x-ratelimit-remaining"), errorBody)
    throw new Error(`GitHub API error ${res.status}: ${errorBody}`)
  }

  return res.text()
}

async function fetchGitLabFileContent(namespace: string, filePath: string): Promise<string> {
  const encodedId = encodeURIComponent(namespace)
  const encodedPath = encodeURIComponent(filePath)
  const headers: Record<string, string> = { "User-Agent": "TestForge-App" }

  const token = process.env.GITLAB_TOKEN
  if (token) {
    headers["PRIVATE-TOKEN"] = token
  }

  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/${encodedPath}/raw?ref=HEAD`,
    { headers },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`GitLab API error ${res.status}: ${errorBody}`)
  }

  return res.text()
}

export async function POST(request: Request) {
  const body = (await request.json()) as ContentRequestBody
  const repoUrl = body.repoUrl?.trim()
  const filePath = body.filePath?.trim()

  if (!repoUrl || !filePath) {
    return NextResponse.json({ error: "repoUrl and filePath are required." }, { status: 400 })
  }

  try {
    const githubInfo = parseGitHubUrl(repoUrl)
    if (githubInfo) {
      const content = await fetchGitHubFileContent(githubInfo.owner, githubInfo.repo, filePath)
      return new NextResponse(content, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    const gitlabInfo = parseGitLabUrl(repoUrl)
    if (gitlabInfo) {
      const content = await fetchGitLabFileContent(gitlabInfo.namespace, filePath)
      return new NextResponse(content, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    return NextResponse.json({ error: "Could not parse repository URL." }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch file content."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
