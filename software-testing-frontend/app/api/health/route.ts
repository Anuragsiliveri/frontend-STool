import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "testforge-backend",
    timestamp: new Date().toISOString(),
  })
}
