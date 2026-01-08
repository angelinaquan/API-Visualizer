import { Upload, Link, FileJson, Zap, Eye, Code } from 'lucide-react'
import { useApiStore } from '@/stores/apiStore'
import { fetchAndParseSpec } from '@/utils/openApiParser'
import { useRef } from 'react'
import { parseOpenApiSpec } from '@/utils/openApiParser'

export function WelcomeScreen() {
  const { setSpec, setLoading, setError, isLoading } = useApiStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sampleApis = [
    {
      name: 'Petstore API',
      description: 'Classic demo API for pet store management',
      url: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    {
      name: 'JSONPlaceholder',
      description: 'Free fake API for testing',
      url: 'https://raw.githubusercontent.com/typicode/jsonplaceholder/master/public/openapi.json',
    },
  ]

  const loadSampleApi = async (url: string) => {
    setLoading(true)
    try {
      const parsed = await fetchAndParseSpec(url)
      setSpec(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API')
    }
  }

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

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            API Visualizer
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Beautiful, interactive API documentation. Upload your OpenAPI spec or paste a URL to get started.
          </p>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
          >
            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold mb-1">Upload File</h3>
            <p className="text-sm text-muted-foreground">
              Drop your OpenAPI JSON or YAML file
            </p>
          </button>

          <button
            onClick={() => {
              const url = prompt('Enter OpenAPI specification URL:')
              if (url) loadSampleApi(url)
            }}
            className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
          >
            <Link className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold mb-1">Load from URL</h3>
            <p className="text-sm text-muted-foreground">
              Paste a URL to an OpenAPI spec
            </p>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.yaml,.yml"
            className="hidden"
          />
        </div>

        {/* Sample APIs */}
        <div className="mb-12">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Or try a sample API
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sampleApis.map((api) => (
              <button
                key={api.name}
                onClick={() => loadSampleApi(api.url)}
                disabled={isLoading}
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <FileJson className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">{api.name}</h3>
                    <p className="text-sm text-muted-foreground">{api.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">Visualize</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful docs from your API spec
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">Test</h3>
            <p className="text-sm text-muted-foreground">
              Try endpoints with one click
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-3">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">Generate</h3>
            <p className="text-sm text-muted-foreground">
              Copy cURL and code snippets
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading API specification...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
