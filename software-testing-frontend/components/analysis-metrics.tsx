"use client"

import { useState, useEffect, useCallback } from "react"

interface AnalysisMetricsProps {
  fileName: string
  onRetry: () => void
}

interface MetricResult {
  label: string
  value: string
  status: "pass" | "warn" | "fail"
  detail: string
}

interface TestCase {
  name: string
  status: "pass" | "fail" | "skip"
  duration: string
}

const STATUS_COLORS = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-[hsl(var(--primary))]",
  skip: "text-muted-foreground",
}

const STATUS_BG = {
  pass: "bg-emerald-400/10 border-emerald-400/20",
  warn: "bg-amber-400/10 border-amber-400/20",
  fail: "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.2)]",
  skip: "bg-muted border-border",
}

function generateMetrics(): MetricResult[] {
  return [
    { label: "Code Coverage", value: "84.2%", status: "pass", detail: "Lines covered by tests" },
    { label: "Cyclomatic Complexity", value: "12", status: "warn", detail: "Average per function" },
    { label: "Type Safety", value: "96.1%", status: "pass", detail: "Typed declarations" },
    { label: "Lint Issues", value: "3", status: "warn", detail: "Warnings found" },
    { label: "Security Vulns", value: "0", status: "pass", detail: "No vulnerabilities" },
    { label: "Duplication", value: "2.4%", status: "pass", detail: "Duplicate code blocks" },
  ]
}

function generateTests(): TestCase[] {
  return [
    { name: "renders without crashing", status: "pass", duration: "23ms" },
    { name: "handles loading state", status: "pass", duration: "45ms" },
    { name: "displays error on fetch failure", status: "pass", duration: "38ms" },
    { name: "renders items from API", status: "pass", duration: "67ms" },
    { name: "handles empty response", status: "fail", duration: "120ms" },
    { name: "matches snapshot", status: "pass", duration: "12ms" },
    { name: "cleans up on unmount", status: "pass", duration: "31ms" },
    { name: "accessibility: keyboard nav", status: "skip", duration: "0ms" },
    { name: "performance: under 100ms render", status: "pass", duration: "8ms" },
  ]
}

export function AnalysisMetrics({ fileName, onRetry }: AnalysisMetricsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [metrics, setMetrics] = useState<MetricResult[]>([])
  const [tests, setTests] = useState<TestCase[]>([])
  const [progress, setProgress] = useState(0)

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true)
    setMetrics([])
    setTests([])
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return p + Math.random() * 15
      })
    }, 200)

    setTimeout(() => {
      clearInterval(progressInterval)
      setProgress(100)
      setMetrics(generateMetrics())
      setTests(generateTests())
      setIsAnalyzing(false)
    }, 2500)
  }, [])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const passCount = tests.filter((t) => t.status === "pass").length
  const failCount = tests.filter((t) => t.status === "fail").length
  const skipCount = tests.filter((t) => t.status === "skip").length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span className="text-xs font-medium text-foreground">Test Analysis</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">{fileName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center gap-5 py-16">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--primary))]" />
            </div>
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Analyzing code...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Running static analysis and test suites</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Overall score */}
            <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-muted/30 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-400/10">
                <span className="text-lg font-bold text-emerald-400">B+</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Overall Health: Good</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {passCount} passed, {failCount} failed, {skipCount} skipped of {tests.length} tests
                </p>
              </div>
            </div>

            {/* Metrics grid */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quality Metrics
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className={`rounded-[var(--radius)] border p-3 ${STATUS_BG[metric.status]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{metric.label}</span>
                      <span className={`font-mono text-sm font-bold ${STATUS_COLORS[metric.status]}`}>
                        {metric.value}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test results */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Test Results
              </h3>
              <div className="flex flex-col gap-1">
                {tests.map((test) => (
                  <div
                    key={test.name}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
                  >
                    {test.status === "pass" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-emerald-400">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : test.status === "fail" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    )}
                    <span className="flex-1 truncate text-xs text-foreground">{test.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{test.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Retry button */}
      <div className="border-t border-border bg-muted/30 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            runAnalysis()
            onRetry()
          }}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {isAnalyzing ? "Analyzing..." : "Retry Test"}
        </button>
      </div>
    </div>
  )
}
