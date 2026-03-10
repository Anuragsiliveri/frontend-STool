"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { CodePreview } from "@/components/code-preview"
import { AnalysisMetrics } from "@/components/analysis-metrics"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

function AnalysisContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileName = searchParams.get("file") || "unknown"
  const language = searchParams.get("lang") || ""
  const repoUrl = searchParams.get("repo") || ""

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--primary-foreground))"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">TestForge</span>
            </div>
            <div className="hidden items-center gap-1.5 md:flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-muted-foreground"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {fileName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 md:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400">Analysis Running</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Resizable panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left panel: Code preview */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <CodePreview fileName={fileName} language={language} repoUrl={repoUrl} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel: Metrics */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <AnalysisMetrics
              fileName={fileName}
              onRetry={() => {}}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--primary))]" />
            <p className="text-sm text-muted-foreground">Loading analysis...</p>
          </div>
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  )
}
