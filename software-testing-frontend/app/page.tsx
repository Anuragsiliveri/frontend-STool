"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { UrlFetchBar } from "@/components/url-fetch-bar"
import { FileExplorer } from "@/components/file-explorer"

interface FileItem {
  name: string
  type: "file" | "folder"
  size?: string
  language?: string
}

export default function Page() {
  const router = useRouter()
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [repoUrl, setRepoUrl] = useState("")

  const handleFetch = useCallback(async (url: string) => {
    setIsLoading(true)
    setHasSearched(true)
    setFiles([])
    setSelectedFile(null)
    setRepoUrl(url)

    try {
      const response = await fetch("/api/repository/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        setFiles([])
        return
      }

      const data = (await response.json()) as { files?: FileItem[] }
      setFiles(data.files || [])
    } catch {
      setFiles([])
    } finally {
      setIsLoading(false)
    }
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
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Docs
              </a>
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
            Paste a repository URL to fetch the source code, then analyze and run automated tests across your entire codebase.
          </p>
        </section>

        {/* URL Fetch Bar */}
        <section className="mb-8">
          <UrlFetchBar onFetch={handleFetch} isLoading={isLoading} />
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
                ? <>Selected: <span className="font-mono text-foreground">{selectedFile.name}</span></>
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
              { label: "Total Size", value: "22.2 KB" },
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
