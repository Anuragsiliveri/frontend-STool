export interface FileItem {
  name: string
  type: "file" | "folder"
  size?: string
  language?: string
}

export interface MetricResult {
  label: string
  value: string
  status: "pass" | "warn" | "fail"
  detail: string
}

export interface TestCase {
  name: string
  status: "pass" | "fail" | "skip"
  duration: string
}

export interface AnalysisResponse {
  score: string
  health: "Excellent" | "Good" | "Needs Attention"
  metrics: MetricResult[]
  tests: TestCase[]
}

export interface TrainingResponse {
  accuracy: number
  loss: number
  precision: number
  recall: number
  f1Score: number
}

const REPO_FILES: FileItem[] = [
  { name: "src", type: "folder" },
  { name: "src/components", type: "folder" },
  { name: "src/components/App.tsx", type: "file", size: "4.2 KB", language: "TypeScript" },
  { name: "src/components/Header.tsx", type: "file", size: "1.8 KB", language: "TypeScript" },
  { name: "src/utils/helpers.ts", type: "file", size: "2.1 KB", language: "TypeScript" },
  { name: "src/styles/globals.css", type: "file", size: "1.3 KB", language: "CSS" },
  { name: "package.json", type: "file", size: "0.9 KB", language: "JSON" },
  { name: "tsconfig.json", type: "file", size: "0.5 KB", language: "JSON" },
  { name: "README.md", type: "file", size: "3.7 KB", language: "Markdown" },
  { name: "server.py", type: "file", size: "6.1 KB", language: "Python" },
  { name: "index.js", type: "file", size: "1.4 KB", language: "JavaScript" },
  { name: ".gitignore", type: "file", size: "0.2 KB" },
]

const fallbackAnalysis: AnalysisResponse = {
  score: "B+",
  health: "Good",
  metrics: [
    { label: "Code Coverage", value: "84.2%", status: "pass", detail: "Lines covered by tests" },
    { label: "Cyclomatic Complexity", value: "12", status: "warn", detail: "Average per function" },
    { label: "Type Safety", value: "96.1%", status: "pass", detail: "Typed declarations" },
    { label: "Lint Issues", value: "3", status: "warn", detail: "Warnings found" },
    { label: "Security Vulns", value: "0", status: "pass", detail: "No vulnerabilities" },
    { label: "Duplication", value: "2.4%", status: "pass", detail: "Duplicate code blocks" },
  ],
  tests: [
    { name: "renders without crashing", status: "pass", duration: "23ms" },
    { name: "handles loading state", status: "pass", duration: "45ms" },
    { name: "displays error on fetch failure", status: "pass", duration: "38ms" },
    { name: "renders items from API", status: "pass", duration: "67ms" },
    { name: "handles empty response", status: "fail", duration: "120ms" },
    { name: "matches snapshot", status: "pass", duration: "12ms" },
    { name: "cleans up on unmount", status: "pass", duration: "31ms" },
    { name: "accessibility: keyboard nav", status: "skip", duration: "0ms" },
    { name: "performance: under 100ms render", status: "pass", duration: "8ms" },
  ],
}

export function isSupportedRepoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ["github.com", "gitlab.com", "bitbucket.org"].some(
      (host) => parsed.hostname === host || parsed.hostname === `www.${host}`,
    )
  } catch {
    return false
  }
}

export function getRepositoryFiles(url: string): FileItem[] {
  if (!isSupportedRepoUrl(url)) {
    return []
  }

  return REPO_FILES
}

export function getLanguageFromExtension(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript",
    js: "JavaScript", jsx: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
    py: "Python",
    css: "CSS", scss: "CSS", sass: "CSS",
    json: "JSON",
    md: "Markdown", mdx: "Markdown",
    html: "HTML", htm: "HTML",
    java: "Java",
    kt: "Kotlin", kts: "Kotlin",
    go: "Go",
    rs: "Rust",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    c: "C", h: "C",
    cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++",
    cs: "C#",
    sh: "Shell", bash: "Shell", zsh: "Shell",
    yml: "YAML", yaml: "YAML",
    xml: "XML",
    sql: "SQL",
    graphql: "GraphQL", gql: "GraphQL",
    vue: "Vue", svelte: "Svelte",
    dart: "Dart",
    r: "R",
    scala: "Scala",
    ex: "Elixir", exs: "Elixir",
    tf: "Terraform", hcl: "Terraform",
    toml: "TOML",
    ini: "INI", cfg: "INI",
  }
  return ext ? map[ext] : undefined
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function buildAnalysis(fileName: string): AnalysisResponse {
  if (fileName === "all") {
    return {
      ...fallbackAnalysis,
      score: "A-",
      metrics: fallbackAnalysis.metrics.map((metric) =>
        metric.label === "Code Coverage" ? { ...metric, value: "90.4%" } : metric,
      ),
    }
  }

  return fallbackAnalysis
}

export function runTraining(metrics: string[], fileCount: number): TrainingResponse {
  const metricBoost = Math.min(metrics.length * 0.75, 4)
  const fileBoost = Math.min(fileCount * 0.15, 2)
  const accuracy = Number((89.5 + metricBoost + fileBoost).toFixed(1))

  return {
    accuracy,
    loss: Number((0.21 - metricBoost / 100).toFixed(3)),
    precision: Number((accuracy - 1.7).toFixed(1)),
    recall: Number((accuracy - 2.4).toFixed(1)),
    f1Score: Number((accuracy - 2.1).toFixed(1)),
  }
}
