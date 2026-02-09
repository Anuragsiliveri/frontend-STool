"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { MetricSelector } from "@/components/metric-selector"
import { FileUploader } from "@/components/file-uploader"
import { TrainingResults } from "@/components/training-results"

interface UploadedFile {
  name: string
  size: string
  type: "code" | "csv" | "other"
}

type Phase = "configure" | "training" | "results"

export default function TrainPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("configure")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [progress, setProgress] = useState(0)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const totalEpochs = 50
  const [accuracy, setAccuracy] = useState(0)

  const toggleMetric = useCallback((id: string) => {
    setSelectedMetrics((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }, [])

  const startTraining = useCallback(() => {
    if (selectedMetrics.length === 0 || uploadedFiles.length === 0) return

    setPhase("training")
    setProgress(0)
    setCurrentEpoch(0)

    let epoch = 0
    const interval = setInterval(() => {
      epoch++
      setCurrentEpoch(epoch)
      setProgress((epoch / totalEpochs) * 100)
      setAccuracy(Math.min(50 + epoch * 0.8 + Math.random() * 5, 94.7))

      if (epoch >= totalEpochs) {
        clearInterval(interval)
        setAccuracy(94.7)
        setTimeout(() => setPhase("results"), 400)
      }
    }, 80)
  }, [selectedMetrics, uploadedFiles])

  const canTrain = selectedMetrics.length > 0 && uploadedFiles.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              aria-label="Back to home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
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
            <div className="hidden items-center gap-1.5 md:flex">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-muted-foreground">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                ML Training
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phase === "training" && (
              <div className="hidden items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 md:flex">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-medium text-amber-400">Training in Progress</span>
              </div>
            )}
            {phase === "results" && (
              <div className="hidden items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 md:flex">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Training Complete</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Training phase */}
        {phase === "training" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-8">
              <div className="h-24 w-24 animate-spin rounded-full border-4 border-muted border-t-[hsl(var(--primary))]" style={{ animationDuration: "1.5s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Training Model</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Epoch {currentEpoch} / {totalEpochs} &mdash; Accuracy: {accuracy.toFixed(1)}%
            </p>
            <div className="mt-6 w-full max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Testing {selectedMetrics.length} metrics across {uploadedFiles.length} files
            </p>
          </div>
        )}

        {/* Results phase */}
        {phase === "results" && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                Training Complete
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your model has been trained on {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} across {selectedMetrics.length} selected metrics.
              </p>
            </div>

            <TrainingResults
              selectedMetrics={selectedMetrics}
              accuracy={accuracy}
              epoch={currentEpoch}
              totalEpochs={totalEpochs}
            />

            {/* Back to dashboard button */}
            <div className="flex justify-center pt-2 pb-8">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="group flex items-center gap-3 rounded-full border border-border bg-card px-8 py-3 text-sm font-medium text-foreground transition-all hover:border-[hsl(var(--primary)/0.5)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Dashboard
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* Configure phase */}
        {phase === "configure" && (
          <div className="flex flex-col gap-10">
            {/* Hero */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl">
                Train ML Model
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Select which testing metrics you want the model to focus on, upload your code files and CSV datasets, then start training.
              </p>
            </div>

            {/* Step 1: Metrics */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Select Testing Metrics</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedMetrics.length === 0
                      ? "Choose at least one metric to test"
                      : `${selectedMetrics.length} metric${selectedMetrics.length !== 1 ? "s" : ""} selected`}
                  </p>
                </div>
              </div>
              <MetricSelector selectedMetrics={selectedMetrics} onToggle={toggleMetric} />
            </section>

            {/* Step 2: Upload */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Upload Files</h3>
                  <p className="text-xs text-muted-foreground">
                    {uploadedFiles.length === 0
                      ? "Add code files and CSV datasets for training"
                      : `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""} uploaded`}
                  </p>
                </div>
              </div>
              <FileUploader files={uploadedFiles} onFilesChange={setUploadedFiles} />
            </section>

            {/* Step 3: Train */}
            <section className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-border bg-card p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
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
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Ready to Train</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {canTrain
                    ? `${selectedMetrics.length} metrics, ${uploadedFiles.length} files queued`
                    : "Select metrics and upload files to begin"}
                </p>
              </div>
              <button
                type="button"
                onClick={startTraining}
                disabled={!canTrain}
                className="group flex items-center gap-2.5 rounded-[var(--radius)] bg-[hsl(var(--primary))] px-8 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Training
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
