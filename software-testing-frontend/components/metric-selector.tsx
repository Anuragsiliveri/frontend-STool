"use client"

interface Metric {
  id: string
  label: string
  description: string
  category: string
}

const AVAILABLE_METRICS: Metric[] = [
  { id: "coverage", label: "Code Coverage", description: "Measures how much of your code is executed during testing", category: "Quality" },
  { id: "complexity", label: "Cyclomatic Complexity", description: "Quantifies code complexity through independent paths", category: "Quality" },
  { id: "duplication", label: "Code Duplication", description: "Detects repeated code blocks across the codebase", category: "Quality" },
  { id: "type-safety", label: "Type Safety", description: "Validates type annotations and inference accuracy", category: "Quality" },
  { id: "security", label: "Security Vulnerabilities", description: "Scans for common security anti-patterns and CVEs", category: "Security" },
  { id: "injection", label: "Injection Detection", description: "Identifies SQL, XSS, and command injection risks", category: "Security" },
  { id: "performance", label: "Performance Profiling", description: "Benchmarks runtime performance and memory usage", category: "Performance" },
  { id: "latency", label: "Latency Analysis", description: "Measures response times and identifies bottlenecks", category: "Performance" },
  { id: "memory", label: "Memory Leak Detection", description: "Detects potential memory leaks and orphaned references", category: "Performance" },
  { id: "regression", label: "Regression Testing", description: "Validates that new changes don't break existing functionality", category: "Testing" },
  { id: "mutation", label: "Mutation Testing", description: "Evaluates test quality by introducing code mutations", category: "Testing" },
  { id: "boundary", label: "Boundary Value Analysis", description: "Tests edge cases and boundary conditions automatically", category: "Testing" },
]

interface MetricSelectorProps {
  selectedMetrics: string[]
  onToggle: (id: string) => void
}

export function MetricSelector({ selectedMetrics, onToggle }: MetricSelectorProps) {
  const categories = Array.from(new Set(AVAILABLE_METRICS.map((m) => m.category)))

  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <div key={category}>
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                category === "Quality"
                  ? "bg-blue-400"
                  : category === "Security"
                    ? "bg-amber-400"
                    : category === "Performance"
                      ? "bg-emerald-400"
                      : "bg-[hsl(var(--primary))]"
              }`}
            />
            {category}
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {AVAILABLE_METRICS.filter((m) => m.category === category).map((metric) => {
              const isSelected = selectedMetrics.includes(metric.id)
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => onToggle(metric.id)}
                  className={`flex items-start gap-3 rounded-[var(--radius)] border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                        : "border-muted-foreground/40 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="hsl(var(--primary-foreground))"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                      {metric.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{metric.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
