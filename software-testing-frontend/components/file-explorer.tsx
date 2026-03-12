"use client"

interface FileItem {
  name: string
  type: "file" | "folder"
  size?: string
  language?: string
}

interface FileExplorerProps {
  files: FileItem[]
  isLoading: boolean
  hasSearched: boolean
  repoUrl?: string
  selectedFileName?: string
  onSelectFile?: (file: FileItem) => void
}

function getFileIcon(file: FileItem) {
  if (file.type === "folder") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-[hsl(var(--primary))]"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  const ext = file.name.split(".").pop()?.toLowerCase()
  let color = "text-muted-foreground"

  if (ext === "ts" || ext === "tsx") color = "text-blue-400"
  else if (ext === "js" || ext === "jsx") color = "text-yellow-400"
  else if (ext === "py") color = "text-green-400"
  else if (ext === "css" || ext === "scss") color = "text-pink-400"
  else if (ext === "json") color = "text-orange-400"
  else if (ext === "md") color = "text-muted-foreground"

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${color}`}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

export function FileExplorer({ files, isLoading, hasSearched, repoUrl, selectedFileName, onSelectFile }: FileExplorerProps) {
  function handleFileClick(file: FileItem) {
    if (file.type === "folder") return
    if (onSelectFile) {
      onSelectFile(file)
    }
  }
  return (
    <div className="flex min-h-[480px] flex-col rounded-[var(--radius)] border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-medium text-foreground">Extracted Files</span>
        </div>
        {files.length > 0 && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {files.length} {files.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--primary))]" />
            </div>
            <p className="text-sm text-muted-foreground">Fetching repository files...</p>
          </div>
        ) : files.length > 0 ? (
          <ul className="space-y-0.5" role="list">
            {files.map((file) => (
              <li key={file.name}>
                <button
                  type="button"
                  onClick={() => handleFileClick(file)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    file.type === "file"
                      ? selectedFileName === file.name
                        ? "bg-accent ring-1 ring-primary/30 cursor-pointer"
                        : "cursor-pointer hover:bg-accent hover:ring-1 hover:ring-primary/20"
                      : "cursor-default hover:bg-accent"
                  }`}
                >
                  {getFileIcon(file)}
                  <span className="flex-1 truncate font-mono text-sm text-foreground">{file.name}</span>
                  {file.language && (
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {file.language}
                    </span>
                  )}
                  {file.size && (
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-muted-foreground"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {hasSearched ? "No files found" : "No files yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasSearched
                  ? "The URL may be invalid or the repository is empty."
                  : "Enter a repository URL above and click Fetch to extract files."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
