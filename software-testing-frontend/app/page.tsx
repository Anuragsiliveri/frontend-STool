"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { UrlFetchBar } from "@/components/url-fetch-bar"
import { FileExplorer } from "@/components/file-explorer"
import { getLanguageFromExtension, formatFileSize } from "@/lib/api-data"

interface FileItem {
  name: string
  type: "file" | "folder"
  size?: string
  language?: string
}

const LOCAL_REPO_KEY = "__local__"

export default function Page() {
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [repoUrl, setRepoUrl] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Local file upload state
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFetch = useCallback(async (url: string) => {
    setIsLoading(true)
    setHasSearched(true)
    setFiles([])
    setSelectedFile(null)
    setRepoUrl(url)
    setFetchError(null)

    try {
      const response = await fetch("/api/repository/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = (await response.json()) as { files?: FileItem[]; error?: string }

      if (!response.ok) {
        setFetchError(data.error ?? "Failed to fetch repository files.")
        setFiles([])
        return
      }

      if (data.files && data.files.length > 0) {
        setFiles(data.files)
      } else {
        setFetchError(data.error ?? "No files found in this repository.")
        setFiles([])
      }
    } catch {
      setFetchError("Network error: could not reach the server. Please check your connection.")
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLocalFiles = useCallback((fileList: FileList) => {
    const newFileItems: FileItem[] = []

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        try {
          sessionStorage.setItem(`localFile:${file.name}`, content)
        } catch {
          // sessionStorage quota exceeded – show a warning to the user
          setFetchError("Storage quota exceeded. Some file contents may not be available for analysis.")
        }
      }
      reader.readAsText(file)

      newFileItems.push({
        name: file.name,
        type: "file",
        size: formatFileSize(file.size),
        language: getLanguageFromExtension(file.name),
      })
    })

    setFiles((prev) => {
      // Avoid duplicates by name
      const existingNames = new Set(prev.map((f) => f.name))
      const unique = newFileItems.filter((f) => !existingNames.has(f.name))
      return [...prev, ...unique]
    })
    setHasSearched(true)
    setFetchError(null)
    if (repoUrl !== LOCAL_REPO_KEY) {
      setRepoUrl(LOCAL_REPO_KEY)
    }
  }, [repoUrl])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      handleLocalFiles(e.dataTransfer.files)
    }
  }, [handleLocalFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">TestForge</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                History
              </a>
              <button
                type="button"
                onClick={() => router.push("/docs")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Docs
              </button>
              <button
                type="button"
                onClick={() => router.push("/train")}
                className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1.5 text-sm font-medium text-[hsl(var(--primary))] transition-all hover:border-[hsl(var(--primary)/0.6)] hover:bg-[hsl(var(--primary)/0.14)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Train ML
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl">
            Test Your Software
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Paste a GitHub or GitLab repository URL to fetch source files, or upload files directly from your computer.
          </p>
        </section>

        {/* URL Fetch Bar */}
        <section className="mb-4">
          <UrlFetchBar onFetch={handleFetch} isLoading={isLoading} error={fetchError} />
        </section>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Local file upload */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex w-full flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed px-6 py-6 transition-all ${
              isDragging
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)]"
                : "border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/30"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                isDragging ? "bg-[hsl(var(--primary)/0.1)]" : "bg-muted"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-5 w-5 ${isDragging ? "text-[hsl(var(--primary))]" : "text-muted-foreground"}`}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop files here or{" "}
                <span className="text-[hsl(var(--primary))]">browse from your computer</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports .py, .ts, .tsx, .js, .jsx, .java, .cpp, .go, .rs, .rb, .php, .swift, .kt, .cs, .json, .html, .css, and more
              </p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".py,.ts,.tsx,.js,.jsx,.java,.cpp,.c,.h,.go,.rs,.rb,.php,.swift,.kt,.cs,.json,.html,.css,.scss,.md,.yaml,.yml,.xml,.sql,.sh,.txt"
            onChange={(e) => {
              if (e.target.files?.length) handleLocalFiles(e.target.files)
              e.target.value = ""
            }}
            className="hidden"
          />
        </section>

        {/* File Explorer */}
        <section>
          <FileExplorer
            files={files}
            isLoading={isLoading}
            hasSearched={hasSearched}
            repoUrl={repoUrl}
            onSelectFile={(file) => setSelectedFile(file)}
          />
        </section>

        {/* Analyze button */}
        {files.length > 0 && (
          <section className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFile
                ? <><span className="text-foreground">Selected:</span> <span className="font-mono text-foreground">{selectedFile.name}</span></>
                : "Click a file above to select it, or analyze the entire repository."}
            </p>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (selectedFile) {
                  params.set("file", selectedFile.name)
                  params.set("lang", selectedFile.language || "")
                } else {
                  params.set("file", "all")
                }
                if (repoUrl) params.set("repo", repoUrl)
                router.push(`/analysis?${params.toString()}`)
              }}
              className="group flex items-center gap-2.5 rounded-[var(--radius)] border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Run Analysis
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </section>
        )}

        {/* Stats bar when files loaded */}
        {files.length > 0 && (
          <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total Files", value: files.filter((f) => f.type === "file").length.toString() },
              { label: "Folders", value: files.filter((f) => f.type === "folder").length.toString() },
              { label: "Languages", value: new Set(files.map((f) => f.language).filter(Boolean)).size.toString() },
              {
                label: "Total Size",
                value: (() => {
                  const total = files.reduce((acc, f) => {
                    if (!f.size) return acc
                    const match = f.size.match(/([\d.]+)\s*(B|KB|MB|GB)/)
                    if (!match) return acc
                    const num = parseFloat(match[1])
                    const unit = match[2]
                    const bytes =
                      unit === "B" ? num :
                      unit === "KB" ? num * 1024 :
                      unit === "MB" ? num * 1024 * 1024 :
                      num * 1024 * 1024 * 1024
                    return acc + bytes
                  }, 0)
                  if (total < 1024) return `${total.toFixed(0)} B`
                  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`
                  return `${(total / (1024 * 1024)).toFixed(1)} MB`
                })(),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius)] border border-border bg-card px-4 py-3"
              >
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
