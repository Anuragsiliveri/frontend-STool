import { NextResponse } from "next/server"
import { buildAnalysis } from "@/lib/api-data"

interface AnalysisRequestBody {
  fileName?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalysisRequestBody
  const fileName = body.fileName?.trim() || "all"

  const result = buildAnalysis(fileName)
  return NextResponse.json(result)
}
