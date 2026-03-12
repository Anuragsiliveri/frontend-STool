"use client"

import { useState, useEffect } from "react"

interface CodePreviewProps {
  fileName: string
  language: string
  repoUrl?: string
  /** Called whenever the displayed code changes (loaded or reset to default). */
  onCodeLoad?: (code: string) => void
}

interface StoredFileEntry {
  name: string
  type: string
  language?: string
}

const DEFAULT_CODE = `// File contents loaded for analysis
// Select a source file from the repository
// to preview its contents here.

export function placeholder() {
  return null;
}`

export function CodePreview({ fileName, language, repoUrl, onCodeLoad }: CodePreviewProps) {
  const [code, setCode] = useState<string>(DEFAULT_CODE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectFileCount, setProjectFileCount] = useState(0)

  useEffect(() => {
    // ── LOCAL files uploaded directly from the user's PC ───────────────
    if (repoUrl === "__local__") {
      if (fileName === "all") {
        // Concatenate all local files from sessionStorage
        const allContents: string[] = []
        if (typeof sessionStorage !== "undefined") {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key?.startsWith("localFile:")) {
              const fName = key.slice("localFile:".length)
              const content = sessionStorage.getItem(key)
              if (content) allContents.push(`// === ${fName} ===\n${content}`)
            }
          }
        }
        const combined = allContents.join("\n\n")
        setProjectFileCount(allContents.length)
        setCode(combined || DEFAULT_CODE)
        setError(null)
        onCodeLoad?.(combined || DEFAULT_CODE)
      } else if (!fileName) {
        setCode(DEFAULT_CODE)
        setError(null)
        onCodeLoad?.(DEFAULT_CODE)
      } else {
        const stored =
          typeof sessionStorage !== "undefined"
            ? sessionStorage.getItem(`localFile:${fileName}`)
            : null
        if (stored !== null) {
          setCode(stored)
          setError(null)
          onCodeLoad?.(stored)
        } else {
          setCode(DEFAULT_CODE)
          setError("Local file content is no longer available. Please upload the file again.")
          onCodeLoad?.(DEFAULT_CODE)
        }
      }
      return
    }

    if (!repoUrl || !fileName) {
      setCode(DEFAULT_CODE)
      setError(null)
      onCodeLoad?.(DEFAULT_CODE)
      return
    }

    // ── Async paths from here ──────────────────────────────────────────
    let cancelled = false

    // Entire project analysis: fetch multiple files from repo
    if (fileName === "all") {
      setIsLoading(true)
      setError(null)

      ;(async () => {
        try {
          // Try to get the file list from sessionStorage (saved by home page)
          let fileList: StoredFileEntry[] = []
          if (typeof sessionStorage !== "undefined") {
            const stored = sessionStorage.getItem("__projectFiles__")
            if (stored) {
              fileList = JSON.parse(stored) as StoredFileEntry[]
            }
          }

          // If not in sessionStorage, fetch from API
          if (fileList.length === 0) {
            const res = await fetch("/api/repository/files", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: repoUrl }),
            })
            if (res.ok) {
              const data = (await res.json()) as { files?: StoredFileEntry[] }
              fileList = data.files ?? []
            }
          }

          // Filter to code files only, limit to 5 to avoid excessive API requests
          const codeFiles = fileList
            .filter((f) => f.type === "file" && f.language)
            .slice(0, 5)

          if (!cancelled) setProjectFileCount(codeFiles.length)

          // Fetch each file's content in parallel
          const contents = await Promise.all(
            codeFiles.map(async (file) => {
              try {
                const res = await fetch("/api/repository/content", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ repoUrl, filePath: file.name }),
                })
                if (!res.ok) return null
                const text = await res.text()
                return `// === ${file.name} ===\n${text}`
              } catch {
                return null
              }
            }),
          )

          const combined = contents.filter(Boolean).join("\n\n")
          if (!cancelled) {
            setCode(combined || DEFAULT_CODE)
            setError(null)
            onCodeLoad?.(combined || DEFAULT_CODE)
            setIsLoading(false)
          }
        } catch (err) {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : "Failed to load project files."
            setError(message)
            setCode(DEFAULT_CODE)
            onCodeLoad?.(DEFAULT_CODE)
            setIsLoading(false)
          }
        }
      })()

      return () => {
        cancelled = true
      }
    }

    // ── Single file from URL repo ──────────────────────────────────────
    setIsLoading(true)
    setError(null)

    fetch("/api/repository/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl, filePath: fileName }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: "Failed to load file." }))
          throw new Error(json.error ?? "Failed to load file.")
        }
        return res.text()
      })
      .then((text) => {
        if (!cancelled) {
          setCode(text)
          onCodeLoad?.(text)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof TypeError
              ? "Network error: could not reach the server."
              : err instanceof Error
              ? err.message
              : "Failed to load file."
          setError(message)
          setCode(DEFAULT_CODE)
          onCodeLoad?.(DEFAULT_CODE)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repoUrl, fileName]) // onCodeLoad intentionally omitted – it is a stable callback prop and including it would cause unnecessary re-fetches on every render

  const lines = code.split("\n")
  const isProjectView = fileName === "all"

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* File tab bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2 rounded-md bg-card px-3 py-1.5 border border-border">
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
            {isProjectView ? (
              <>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </>
            ) : (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </>
            )}
          </svg>
          <span className="font-mono text-xs text-foreground">
            {isProjectView ? "Entire Project" : fileName}
          </span>
        </div>
        {isProjectView && projectFileCount > 0 && !isLoading && (
          <span className="rounded bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-400">
            {projectFileCount} file{projectFileCount !== 1 ? "s" : ""} analysed
          </span>
        )}
        {!isProjectView && language && (
          <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {language}
          </span>
        )}
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto bg-card p-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--primary))]" />
            <span className="text-sm text-muted-foreground">
              {isProjectView ? "Loading project files…" : "Loading file content…"}
            </span>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-sm font-medium text-destructive">Failed to load file</span>
            <span className="text-xs text-muted-foreground">{error}</span>
          </div>
        ) : (
          <pre className="min-w-0">
            <code className="block text-sm leading-6">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="flex hover:bg-accent/50 transition-colors"
                >
                  <span className="inline-block w-12 shrink-0 select-none border-r border-border bg-muted/30 pr-3 text-right font-mono text-xs leading-6 text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 pl-4 font-mono text-xs leading-6 text-foreground whitespace-pre">
                    {line || " "}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        )}
      </div>
    </div>
  )
}
