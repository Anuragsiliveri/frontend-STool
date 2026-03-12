"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { evaluateCode } from "@/lib/ml-engine"

interface AnalysisMetricsProps {
  fileName: string
  /** Language/file-extension hint for the ML engine (e.g. "TypeScript"). */
  language?: string
  /** Actual source code to analyse client-side. When provided the ML engine
   *  is used instead of the remote API. */
  code?: string
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

interface AnalysisApiResponse {
  score: string
  health: string
  metrics: MetricResult[]
  tests: TestCase[]
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

export function AnalysisMetrics({ fileName, language = "", code = "", onRetry }: AnalysisMetricsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [metrics, setMetrics] = useState<MetricResult[]>([])
  const [tests, setTests] = useState<TestCase[]>([])
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState("--")
  const [health, setHealth] = useState("Running")
  const [isMLMode, setIsMLMode] = useState(false)
  const [mlConfidence, setMlConfidence] = useState(0)
  const [mlScore, setMlScore] = useState(0)

  // Track code version so stale results from a previous run aren't applied
  const runIdRef = useRef(0)

  const runAnalysis = useCallback(async () => {
    const runId = ++runIdRef.current
    setIsAnalyzing(true)
    setMetrics([])
    setTests([])
    setProgress(0)

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return p + Math.random() * 18
      })
    }, 150)

    try {
      if (code && code.trim().length > 0) {
        // ── Client-side ML analysis ──────────────────────────────────────
        // Give the progress bar a moment so the UX feels responsive
        await new Promise<void>((resolve) => setTimeout(resolve, 700))

        if (runId !== runIdRef.current) return // superseded

        const result = evaluateCode(code, language)

        clearInterval(progressInterval)
        setProgress(100)

        if (runId !== runIdRef.current) return

        setMetrics(result.metrics)
        setTests(result.tests)
        setScore(result.score)
        setHealth(result.health)
        setMlConfidence(result.confidence)
        setMlScore(result.overallScore)
        setIsMLMode(true)
      } else {
        // ── Fallback: remote API (used when no code is available yet) ────
        const response = await fetch("/api/analysis/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName }),
        })

        clearInterval(progressInterval)
        setProgress(100)

        if (runId !== runIdRef.current) return

        if (!response.ok) {
          setScore("--")
          setHealth("Failed")
          setIsMLMode(false)
          return
        }

        const data = (await response.json()) as AnalysisApiResponse
        setMetrics(data.metrics)
        setTests(data.tests)
        setScore(data.score)
        setHealth(data.health)
        setIsMLMode(false)
      }
    } catch {
      clearInterval(progressInterval)
      setProgress(100)
      if (runId !== runIdRef.current) return
      setScore("--")
      setHealth("Failed")
      setIsMLMode(false)
    } finally {
      if (runId === runIdRef.current) {
        setIsAnalyzing(false)
      }
    }
  }, [code, language, fileName])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const passCount = tests.filter((t) => t.status === "pass").length
  const failCount = tests.filter((t) => t.status === "fail").length
  const skipCount = tests.filter((t) => t.status === "skip").length
  const codeLineCount = code ? code.split("\n").length : 0

  // Colour the score circle depending on grade
  const scoreColor =
    score.startsWith("A")
      ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
      : score.startsWith("B")
      ? "border-amber-400 bg-amber-400/10 text-amber-400"
      : "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"

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
          <span className="text-xs font-medium text-foreground">
            {isMLMode ? "ML Analysis" : "Test Analysis"}
          </span>
          {isMLMode && !isAnalyzing && (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
              ML · {mlConfidence}% confidence
            </span>
          )}
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
                <span>{code ? "Running ML engine…" : "Analyzing code…"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {code ? "Evaluating code parameters with the ML model" : "Running static analysis and test suites"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Overall score */}
            <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-muted/30 p-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${scoreColor}`}>
                <span className="text-lg font-bold">{score}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Overall Health: {health}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {passCount} passed · {failCount} failed · {skipCount} skipped of {tests.length} tests
                </p>
                {isMLMode && (
                  <p className="mt-1 text-[10px] text-violet-400">
                    ML score: {mlScore}/100 · model evaluated {codeLineCount} lines
                  </p>
                )}
              </div>
            </div>

            {/* ML model info bar */}
            {isMLMode && (
              <div className="flex items-center gap-3 rounded-[var(--radius)] border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-violet-400"
                >
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-violet-300">Code Quality ML Engine</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Feature extraction · weighted scoring · in-browser inference
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                  {mlConfidence}%
                </span>
              </div>
            )}

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
                {isMLMode ? "ML-Predicted Test Results" : "Test Results"}
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
          {isAnalyzing ? "Analyzing…" : "Re-run ML Analysis"}
        </button>
      </div>
    </div>
  )
}
