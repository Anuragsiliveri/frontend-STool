import { NextResponse } from "next/server"
import { getRepositoryFiles, isSupportedRepoUrl } from "@/lib/api-data"

interface RepositoryRequestBody {
  url?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as RepositoryRequestBody
  const url = body.url?.trim()

  if (!url) {
    return NextResponse.json({ error: "Repository URL is required." }, { status: 400 })
  }

  if (!isSupportedRepoUrl(url)) {
    return NextResponse.json({ files: [], message: "Unsupported repository host." }, { status: 200 })
  }

  const files = getRepositoryFiles(url)
  return NextResponse.json({ files })
}
