"use client"

import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

// ─── static data tables ──────────────────────────────────────────────────────

const FEATURES = [
  {
    name: "Cyclomatic Complexity",
    key: "cyclomatic_complexity",
    weight: "20%",
    extraction: "Counts decision-path keywords (if / else if / for / while / do / case / catch / && / || / ?? / ternary) across all functions and divides by function count.",
    thresholds: [
      { range: "≤ 5", score: "95", status: "Pass", label: "Low complexity" },
      { range: "6 – 10", score: "70", status: "Warn", label: "Moderate" },
      { range: "> 10", score: "40", status: "Fail", label: "High complexity" },
    ],
  },
  {
    name: "Code Duplication",
    key: "duplication_pct",
    weight: "15%",
    extraction: "Hashes every non-trivial line (length > 10 chars) and counts how many lines appear more than once, expressed as a percentage.",
    thresholds: [
      { range: "≤ 5%", score: "95", status: "Pass", label: "Very low duplication" },
      { range: "6 – 15%", score: "65", status: "Warn", label: "Moderate" },
      { range: "> 15%", score: "35", status: "Fail", label: "High duplication" },
    ],
  },
  {
    name: "Type Safety",
    key: "type_safety_score",
    weight: "20%",
    extraction: "For TypeScript/TSX: ratio of typed declarations vs. total const/let/var/function/interface/type tokens, minus a penalty of 3 pts per 'any' usage. For JS: presence of JSDoc @type comments.",
    thresholds: [
      { range: "≥ 80", score: "raw", status: "Pass", label: "Strong coverage" },
      { range: "50 – 79", score: "raw", status: "Warn", label: "Partial coverage" },
      { range: "< 50", score: "raw", status: "Fail", label: "Weak safety" },
    ],
  },
  {
    name: "Security Vulnerabilities",
    key: "security_score",
    weight: "25%",
    extraction: "Regex-scans every line for 12 security patterns: eval(), innerHTML=, document.write(), dangerouslySetInnerHTML, exec(), hardcoded passwords/API keys/secrets, SQL injection via string concatenation, weak random for tokens, insecure HTTP URLs, and sensitive data in console.log.",
    thresholds: [
      { range: "0 issues", score: "98", status: "Pass", label: "No vulnerabilities" },
      { range: "0 high, ≤ 2 medium", score: "65", status: "Warn", label: "Minor risks" },
      { range: "≥ 1 high", score: "max(10, 50 − h×10 − m×5)", status: "Fail", label: "High risk" },
    ],
  },
  {
    name: "Coverage Estimate",
    key: "coverage_estimate",
    weight: "10%",
    extraction: "Weighted count of test-framework signals: describe() ×8, it()/test() ×6, expect() ×4, assert ×4, should ×3, jest./mocha./jasmine. ×5, beforeEach/afterEach/beforeAll/afterAll ×3, plus bonus points for export/import statements. Clamped to 15–95.",
    thresholds: [
      { range: "≥ 75", score: "raw", status: "Pass", label: "Good coverage" },
      { range: "45 – 74", score: "raw", status: "Warn", label: "Moderate" },
      { range: "< 45", score: "raw", status: "Fail", label: "Low coverage" },
    ],
  },
  {
    name: "Lint Quality",
    key: "lint_score",
    weight: "10%",
    extraction: "Counts 7 lint patterns: console.log/warn/error/debug, var declarations, TODO/FIXME/HACK comments, loose equality (==), debugger statements, @ts-ignore, @ts-nocheck. Errors (debugger, @ts-nocheck) carry higher weight than warnings.",
    thresholds: [
      { range: "0 errors, 0 warnings", score: "98", status: "Pass", label: "Clean code" },
      { range: "0 errors, ≤ 5 warnings", score: "75", status: "Warn", label: "Minor issues" },
      { range: "≥ 1 error or > 5 warnings", score: "max(20, 70 − e×15 − w×3)", status: "Fail", label: "Lint violations" },
    ],
  },
]

const GRADE_TABLE = [
  { range: "≥ 95", grade: "A+", health: "Excellent" },
  { range: "90 – 94", grade: "A", health: "Excellent" },
  { range: "85 – 89", grade: "A-", health: "Excellent" },
  { range: "80 – 84", grade: "B+", health: "Good" },
  { range: "75 – 79", grade: "B", health: "Good" },
  { range: "70 – 74", grade: "B-", health: "Good" },
  { range: "65 – 69", grade: "C+", health: "Needs Attention" },
  { range: "60 – 64", grade: "C", health: "Needs Attention" },
  { range: "< 60", grade: "C-", health: "Critical" },
]

const STEPS = [
  {
    n: "01",
    title: "Open the Dashboard",
    body: "Navigate to the home page (/) of TestForge. You will see the main dashboard with the URL fetch bar.",
  },
  {
    n: "02",
    title: "Paste a GitHub Repository URL",
    body: "Enter a public GitHub repository URL (e.g. https://github.com/user/repo) into the URL bar and click Fetch. The app calls /api/repository/files and lists all source files in the repo.",
  },
  {
    n: "03",
    title: "Browse Files in the File Explorer",
    body: "The File Explorer panel shows every file and folder. Click a file name to select it. The language badge is auto-detected from the file extension.",
  },
  {
    n: "04",
    title: 'Click "Run Analysis"',
    body: 'With a file selected, press the "Run Analysis" button. The browser navigates to /analysis?file=<name>&lang=<lang>&repo=<url>.',
  },
  {
    n: "05",
    title: "Code Preview Loads",
    body: "The left panel fetches the raw file content from /api/repository/content and renders it with line numbers. The loaded code is passed to the ML engine via the onCodeLoad callback.",
  },
  {
    n: "06",
    title: "ML Engine Runs In-Browser",
    body: "As soon as code is available, lib/ml-engine.ts runs entirely in the browser:\n① Feature extraction (complexity, duplication, types, security, coverage, lint)\n② Weighted scoring against the trained thresholds\n③ Grade and health calculation\n④ ML-predicted test-case generation",
  },
  {
    n: "07",
    title: "Results Shown in the Right Panel",
    body: "The Analysis Metrics panel displays: the letter grade circle, health label, ML confidence %, the Code Quality ML Engine info bar, and a 2×3 grid of per-metric cards colour-coded by pass/warn/fail. Below that, 10 ML-predicted test results are listed.",
  },
  {
    n: "08",
    title: "Re-run Analysis",
    body: 'Click "Re-run ML Analysis" to re-evaluate the code. Because the engine is deterministic for the same input, the results will be identical unless the file selection changes.',
  },
  {
    n: "09",
    title: "(Optional) Train the ML Model",
    body: 'Navigate to /train via the "Train ML" button in the header. Select one or more testing metrics, upload your own code files and/or the training-data.csv, then click "Start Training". The training loop runs 50 epochs and reports accuracy.',
  },
  {
    n: "10",
    title: "Download Training Data",
    body: "On the Train page you can download the canonical training-data.csv (100 labelled samples) that was used to derive the model weights and thresholds. The CSV contains all 12 raw feature columns plus the 6 per-metric scores, overall score, quality grade, and health label.",
  },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="Back to home"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--primary))]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">TestForge</span>
            </div>
            <div className="hidden items-center gap-1.5 md:flex">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-muted-foreground">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">Documentation</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-16 px-6 py-12">

        {/* ── Hero ── */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ML Model Details &amp; Site Guide
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A complete reference for the code-quality ML engine built into TestForge — how it
            extracts features, how it scores them, and a step-by-step walkthrough of using the
            site.
          </p>
        </section>

        {/* ── Section 1: Model Overview ── */}
        <section>
          <SectionHeading number="1" title="ML Model Overview" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Model Type", value: "Weighted Linear Scoring" },
              { label: "Features", value: "6 extracted metrics" },
              { label: "Output", value: "Grade A+–C- + score 0–100" },
              { label: "Inference Location", value: "In-browser (no server)" },
              { label: "Training Samples", value: "100 labelled examples" },
              { label: "Supported Languages", value: "TS · JS · Python · Go · Java · Rust · C# · Ruby · Kotlin" },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius)] border border-border bg-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[var(--radius)] border border-violet-500/20 bg-violet-500/5 p-5">
            <h3 className="text-sm font-semibold text-violet-300">Scoring Formula</h3>
            <pre className="mt-3 overflow-x-auto rounded-md bg-card p-4 font-mono text-xs text-foreground leading-relaxed">
{`overall_score =
    complexity_score  × 0.20   // 20 % weight
  + duplication_score × 0.15   // 15 % weight
  + type_safety_score × 0.20   // 20 % weight
  + security_score    × 0.25   // 25 % weight  ← highest weight
  + coverage_score    × 0.10   // 10 % weight
  + lint_score        × 0.10   // 10 % weight
                               // ──────────────
                               // SUM = 1.00`}
            </pre>
            <p className="mt-3 text-xs text-muted-foreground">
              Each <em>score</em> is a value in 0–100 derived from the corresponding raw feature
              according to the threshold tables below. The overall score maps to a letter grade
              and health label.
            </p>
          </div>

          <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Confidence</strong> is calculated as{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">min(99, max(60, 70 + log(lineCount + 1) × 4))</code>,
              growing logarithmically with file size. A 10-line file starts at ~70 %; a 500-line
              file reaches ~95 %.
            </p>
          </div>
        </section>

        {/* ── Section 2: Feature Details ── */}
        <section>
          <SectionHeading number="2" title="Feature Extraction & Scoring" />
          <div className="mt-6 flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.key} className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[hsl(var(--primary)/0.1)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[hsl(var(--primary))]">
                      {f.key}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{f.name}</span>
                  </div>
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-400">
                    weight {f.weight}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">{f.extraction}</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Range</th>
                          <th className="pb-2 pr-4 font-medium">Score</th>
                          <th className="pb-2 pr-4 font-medium">Status</th>
                          <th className="pb-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {f.thresholds.map((t) => (
                          <tr key={t.range}>
                            <td className="py-1.5 pr-4 font-mono">{t.range}</td>
                            <td className="py-1.5 pr-4 font-mono">{t.score}</td>
                            <td className="py-1.5 pr-4">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  t.status === "Pass"
                                    ? "bg-emerald-400/10 text-emerald-400"
                                    : t.status === "Warn"
                                    ? "bg-amber-400/10 text-amber-400"
                                    : "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="py-1.5 text-muted-foreground">{t.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Grade Table ── */}
        <section>
          <SectionHeading number="3" title="Grade & Health Mapping" />
          <div className="mt-6 overflow-x-auto rounded-[var(--radius)] border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Overall Score</th>
                  <th className="px-4 py-3 text-left font-medium">Letter Grade</th>
                  <th className="px-4 py-3 text-left font-medium">Health Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {GRADE_TABLE.map((row) => (
                  <tr key={row.grade} className="hover:bg-accent/30">
                    <td className="px-4 py-2.5 font-mono text-foreground">{row.range}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-bold ${
                          row.grade.startsWith("A")
                            ? "text-emerald-400"
                            : row.grade.startsWith("B")
                            ? "text-amber-400"
                            : "text-[hsl(var(--primary))]"
                        }`}
                      >
                        {row.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.health}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Section 4: Training Data ── */}
        <section>
          <SectionHeading number="4" title="Training Data (training-data.csv)" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The model weights and thresholds were derived from a labelled dataset of 100 code
            samples spanning 9 languages and 5 quality tiers. Each row contains:
          </p>
          <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-border bg-card">
            <table className="min-w-full text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Column</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["sample_id", "int", "Unique row identifier (1–100)"],
                  ["language", "string", "Programming language of the sample"],
                  ["line_count", "int", "Total lines of code"],
                  ["cyclomatic_complexity", "int", "Avg branch count per function"],
                  ["duplication_pct", "float", "Percentage of duplicated lines (0–100)"],
                  ["type_safety_score", "int", "Raw type annotation score (0–100)"],
                  ["security_high", "int", "Count of high-severity security issues"],
                  ["security_medium", "int", "Count of medium-severity security issues"],
                  ["security_low", "int", "Count of low-severity security issues"],
                  ["coverage_estimate", "int", "Estimated test coverage (15–95)"],
                  ["lint_errors", "int", "Count of lint errors (debugger, @ts-nocheck)"],
                  ["lint_warnings", "int", "Count of lint warnings (console.log, var, etc.)"],
                  ["complexity_score", "int", "Derived ML score for complexity (0–100)"],
                  ["duplication_score", "int", "Derived ML score for duplication (0–100)"],
                  ["type_safety_ml_score", "int", "Derived ML score for type safety (0–100)"],
                  ["security_score", "int", "Derived ML score for security (0–100)"],
                  ["coverage_score", "int", "Derived ML score for coverage (0–100)"],
                  ["lint_score", "int", "Derived ML score for lint quality (0–100)"],
                  ["overall_score", "int", "Weighted overall score (0–100) — primary label"],
                  ["quality_grade", "string", "Letter grade A+–C- — categorical label"],
                  ["health", "string", "Health label: Excellent / Good / Needs Attention / Critical"],
                ].map(([col, type, desc]) => (
                  <tr key={col} className="hover:bg-accent/30">
                    <td className="px-4 py-2 font-mono text-foreground">{col}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{type}</td>
                    <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="/training-data.csv"
              download="training-data.csv"
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download training-data.csv
            </a>
            <span className="text-xs text-muted-foreground">100 samples · 21 columns · UTF-8</span>
          </div>
        </section>

        {/* ── Section 5: Step-by-step site guide ── */}
        <section>
          <SectionHeading number="5" title="Step-by-Step Site Walkthrough" />
          <div className="mt-6 flex flex-col gap-4">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] font-mono text-sm font-bold text-[hsl(var(--primary))]">
                    {step.n}
                  </div>
                </div>
                <div className="flex-1 rounded-[var(--radius)] border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: Architecture Diagram ── */}
        <section>
          <SectionHeading number="6" title="Architecture & Data Flow" />
          <div className="mt-6 rounded-[var(--radius)] border border-border bg-card p-6">
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
{`┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                                │
│                                                                         │
│  / (Dashboard)                                                          │
│  ├─ URL fetch bar  ──────────────► POST /api/repository/files           │
│  └─ File Explorer                  (lists repo files via GitHub API)    │
│                                                                         │
│  /analysis?file=…&lang=…&repo=…                                        │
│  ├─ CodePreview  ───────────────► POST /api/repository/content          │
│  │   onCodeLoad(rawCode)           (fetches raw file content)           │
│  └─ AnalysisMetrics                                                     │
│       │                                                                 │
│       └─ lib/ml-engine.ts  ◄───── rawCode + language (in-browser only) │
│            │                                                            │
│            ├─ extractCyclomaticComplexity(code)                         │
│            ├─ extractDuplicationRatio(code)                             │
│            ├─ extractTypeSafetyScore(code, lang)                        │
│            ├─ extractSecurityIssues(code)                               │
│            ├─ extractCoverageEstimate(code)                             │
│            ├─ extractLintIssues(code)                                   │
│            ├─ weighted scoring  (MODEL_WEIGHTS object)                  │
│            ├─ toGrade(overallScore)                                     │
│            ├─ toHealth(overallScore)                                    │
│            └─ generateTestCases(…)  → 10 predicted results             │
│                                                                         │
│  /train                                                                 │
│  └─ POST /api/training/run  (server-side training simulation)          │
└─────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <div className="flex items-center gap-4 pb-12">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-[hsl(var(--primary)/0.5)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:-translate-x-1">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push("/train")}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Train ML Model
          </button>
        </div>
      </main>
    </div>
  )
}

// ─── helper ──────────────────────────────────────────────────────────────────

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
        {number}
      </span>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  )
}
