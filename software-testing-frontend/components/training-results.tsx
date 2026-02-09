"use client"

interface TrainingResultsProps {
  selectedMetrics: string[]
  accuracy: number
  epoch: number
  totalEpochs: number
}

const METRIC_RESULTS: Record<string, { label: string; value: string; score: number; detail: string }> = {
  coverage: { label: "Code Coverage", value: "91.3%", score: 91.3, detail: "High confidence in line coverage prediction" },
  complexity: { label: "Cyclomatic Complexity", value: "8.4", score: 72, detail: "Average complexity per function detected" },
  duplication: { label: "Code Duplication", value: "1.8%", score: 96, detail: "Minimal duplication patterns found" },
  "type-safety": { label: "Type Safety", value: "97.2%", score: 97.2, detail: "Strong type annotation coverage" },
  security: { label: "Security Vulns", value: "0 Critical", score: 100, detail: "No critical vulnerabilities identified" },
  injection: { label: "Injection Risk", value: "Low", score: 88, detail: "2 minor injection patterns flagged" },
  performance: { label: "Performance", value: "94ms avg", score: 85, detail: "Average execution time within threshold" },
  latency: { label: "Latency", value: "12ms p99", score: 92, detail: "99th percentile response under target" },
  memory: { label: "Memory Leaks", value: "0 Found", score: 100, detail: "No memory leak patterns detected" },
  regression: { label: "Regression", value: "All Pass", score: 100, detail: "No regressions detected in changed paths" },
  mutation: { label: "Mutation Score", value: "78.6%", score: 78.6, detail: "Mutation kill ratio above threshold" },
  boundary: { label: "Boundary Cases", value: "14/16", score: 87.5, detail: "14 of 16 boundary conditions covered" },
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400"
  if (score >= 70) return "text-amber-400"
  return "text-[hsl(var(--primary))]"
}

function getBarColor(score: number): string {
  if (score >= 90) return "bg-emerald-400"
  if (score >= 70) return "bg-amber-400"
  return "bg-[hsl(var(--primary))]"
}

function getGrade(avg: number): { grade: string; color: string; label: string } {
  if (avg >= 95) return { grade: "A+", color: "border-emerald-400 bg-emerald-400/10 text-emerald-400", label: "Excellent" }
  if (avg >= 90) return { grade: "A", color: "border-emerald-400 bg-emerald-400/10 text-emerald-400", label: "Great" }
  if (avg >= 80) return { grade: "B+", color: "border-blue-400 bg-blue-400/10 text-blue-400", label: "Good" }
  if (avg >= 70) return { grade: "B", color: "border-amber-400 bg-amber-400/10 text-amber-400", label: "Fair" }
  return { grade: "C", color: "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]", label: "Needs Work" }
}

export function TrainingResults({ selectedMetrics, accuracy, epoch, totalEpochs }: TrainingResultsProps) {
  const results = selectedMetrics
    .filter((id) => METRIC_RESULTS[id])
    .map((id) => ({ id, ...METRIC_RESULTS[id] }))

  const avgScore = results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0
  const grade = getGrade(avgScore)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {/* Grade */}
        <div className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-card p-5 md:min-w-[200px]">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${grade.color}`}>
            <span className="text-2xl font-bold">{grade.grade}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{grade.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Overall Model Grade</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid flex-1 grid-cols-3 gap-3">
          <div className="rounded-[var(--radius)] border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{accuracy.toFixed(1)}%</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Epochs</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{epoch}/{totalEpochs}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Metrics Tested</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{results.length}</p>
          </div>
        </div>
      </div>

      {/* Metric results */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Metric Breakdown
        </h3>
        <div className="flex flex-col gap-2">
          {results.map((result) => (
            <div
              key={result.id}
              className="rounded-[var(--radius)] border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{result.label}</p>
                    <span className={`font-mono text-xs font-bold ${getScoreColor(result.score)}`}>
                      {result.value}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{result.detail}</p>
                </div>
                <span className={`font-mono text-sm font-bold ${getScoreColor(result.score)}`}>
                  {result.score.toFixed(0)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getBarColor(result.score)}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
