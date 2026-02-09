"use client"

interface CodePreviewProps {
  fileName: string
  language: string
}

const CODE_SAMPLES: Record<string, string> = {
  "src/components/App.tsx": `import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { fetchData } from '../utils/helpers';

interface AppProps {
  title: string;
  version: string;
}

export default function App({ title, version }: AppProps) {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchData('/api/items');
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error">{error.message}</div>;

  return (
    <div className="app-container">
      <Header title={title} version={version} />
      <main>
        <ul>
          {data.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}`,
  "src/components/Header.tsx": `import React from 'react';

interface HeaderProps {
  title: string;
  version: string;
}

export function Header({ title, version }: HeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <span className="version-badge">v{version}</span>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
    </header>
  );
}`,
  "src/utils/helpers.ts": `export async function fetchData(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  const data = await response.json();
  return data.items;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
  "server.py": `from flask import Flask, jsonify, request
from functools import wraps
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not validate_token(token):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

def validate_token(token: str) -> bool:
    return token == os.environ.get('API_TOKEN', 'dev-token')

@app.route('/api/items', methods=['GET'])
@require_auth
def get_items():
    items = ['Widget A', 'Widget B', 'Gadget C']
    logger.info(f"Returning {len(items)} items")
    return jsonify({'items': items})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)`,
  "index.js": `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'running', uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server listening on port \${PORT}\`);
});`,
}

const DEFAULT_CODE = `// File contents loaded for analysis
// Select a source file from the repository
// to preview its contents here.

export function placeholder() {
  return null;
}`

export function CodePreview({ fileName, language }: CodePreviewProps) {
  const code = CODE_SAMPLES[fileName] || DEFAULT_CODE
  const lines = code.split("\n")

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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="font-mono text-xs text-foreground">{fileName}</span>
        </div>
        {language && (
          <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {language}
          </span>
        )}
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto bg-card p-0">
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
      </div>
    </div>
  )
}
