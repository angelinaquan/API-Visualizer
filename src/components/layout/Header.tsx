import { Moon, Sun, Upload, Link, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiStore } from '@/stores/apiStore'
import { useState, useRef } from 'react'
import { parseOpenApiSpec, fetchAndParseSpec } from '@/utils/openApiParser'

export function Header() {
  const { isDarkMode, toggleDarkMode, setSpec, setLoading, setError, spec } = useApiStore()
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const parsed = await parseOpenApiSpec(text)
      setSpec(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return

    setLoading(true)
    setShowUrlInput(false)
    try {
      const parsed = await fetchAndParseSpec(urlInput)
      setSpec(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load from URL')
    }
  }

  const loadSampleApi = async () => {
    setLoading(true)
    try {
      const parsed = await fetchAndParseSpec('https://petstore3.swagger.io/api/v3/openapi.json')
      setSpec(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample API')
    }
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">API</span>
          </div>
          <h1 className="text-lg font-semibold hidden sm:block">API Visualizer</h1>
        </div>
        
        {spec && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{spec.title}</span>
            <span>v{spec.version}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showUrlInput ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter OpenAPI URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
              className="w-64 h-9"
              autoFocus
            />
            <Button size="sm" onClick={handleUrlLoad}>Load</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>Cancel</Button>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(true)}
              className="gap-2"
            >
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">URL</span>
            </Button>
            {!spec && (
              <Button
                variant="secondary"
                size="sm"
                onClick={loadSampleApi}
              >
                Try Sample API
              </Button>
            )}
          </>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,.yaml,.yml"
          className="hidden"
        />

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="h-9 w-9"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          asChild
        >
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </header>
  )
}
