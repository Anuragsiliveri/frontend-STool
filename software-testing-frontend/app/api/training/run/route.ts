import { NextResponse } from "next/server"
import { runTraining } from "@/lib/api-data"

interface TrainingRequestBody {
  selectedMetrics?: string[]
  fileCount?: number
}

export async function POST(request: Request) {
  const body = (await request.json()) as TrainingRequestBody
  const selectedMetrics = Array.isArray(body.selectedMetrics) ? body.selectedMetrics : []
  const fileCount = typeof body.fileCount === "number" ? body.fileCount : 0

  const result = runTraining(selectedMetrics, fileCount)
  return NextResponse.json(result)
}
