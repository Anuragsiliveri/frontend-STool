"use client"

import React from "react"

import { useCallback, useState, useRef } from "react"

interface UploadedFile {
  name: string
  size: string
  type: "code" | "csv" | "other"
}

interface FileUploaderProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

function getFileType(name: string): "code" | "csv" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  if (ext === "csv") return "csv"
  if (["ts", "tsx", "js", "jsx", "py", "java", "cpp", "c", "go", "rs", "rb", "php", "swift", "kt"].includes(ext))
    return "code"
  return "other"
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FILE_TYPE_ICONS: Record<string, { color: string; label: string }> = {
  code: { color: "bg-blue-400/10 text-blue-400 border-blue-400/20", label: "CODE" },
  csv: { color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20", label: "CSV" },
  other: { color: "bg-muted text-muted-foreground border-border", label: "FILE" },
}

export function FileUploader({ files, onFilesChange }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        name: f.name,
        size: formatSize(f.size),
        type: getFileType(f.name),
      }))
      onFilesChange([...files, ...newFiles])
    },
    [files, onFilesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index))
    },
    [files, onFilesChange],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed p-8 transition-all ${
          isDragging
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)]"
            : "border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/30"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
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
            className={`h-6 w-6 ${isDragging ? "text-[hsl(var(--primary))]" : "text-muted-foreground"}`}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop files here or <span className="text-[hsl(var(--primary))]">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports code files (.py, .ts, .js, .java, etc.) and CSV datasets
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".py,.ts,.tsx,.js,.jsx,.java,.cpp,.c,.go,.rs,.rb,.php,.swift,.kt,.csv,.json"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ""
        }}
        className="hidden"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((file, index) => {
            const meta = FILE_TYPE_ICONS[file.type]
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/50"
              >
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${meta.color}`}
                >
                  {meta.label}
                </span>
                <span className="flex-1 truncate font-mono text-xs text-foreground">{file.name}</span>
                <span className="text-[11px] text-muted-foreground">{file.size}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
                  aria-label={`Remove ${file.name}`}
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
