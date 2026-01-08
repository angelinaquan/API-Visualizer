import { useState, useEffect } from 'react'
import { Play, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiStore } from '@/stores/apiStore'
import { cn, formatBytes, formatDuration } from '@/lib/utils'
import type { Endpoint, ApiResponse } from '@/types/api'

interface TryItOutProps {
  endpoint: Endpoint
  servers?: Array<{ url: string; description?: string }>
}

export function TryItOut({ endpoint, servers }: TryItOutProps) {
  const { lastResponse, setLastResponse, isRequestLoading, setRequestLoading } = useApiStore()
  
  // Form state
  const [baseUrl, setBaseUrl] = useState(servers?.[0]?.url || 'https://api.example.com')
  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json'
  })
  const [body, setBody] = useState('')
  const [copied, setCopied] = useState(false)

  // Initialize params from endpoint
  useEffect(() => {
    const newPathParams: Record<string, string> = {}
    const newQueryParams: Record<string, string> = {}
    
    endpoint.parameters.forEach(param => {
      const example = param.example?.toString() || ''
      if (param.in === 'path') {
        newPathParams[param.name] = example
      } else if (param.in === 'query') {
        newQueryParams[param.name] = example
      }
    })
    
    setPathParams(newPathParams)
    setQueryParams(newQueryParams)
    setLastResponse(null)

    // Generate example body if there's a request body
    if (endpoint.requestBody) {
      const contentType = Object.keys(endpoint.requestBody.content)[0]
      const schema = endpoint.requestBody.content[contentType]?.schema
      if (schema?.example) {
        setBody(JSON.stringify(schema.example, null, 2))
      } else if (schema?.properties) {
        const example: Record<string, unknown> = {}
        Object.entries(schema.properties).forEach(([key, prop]) => {
          if (prop.example !== undefined) {
            example[key] = prop.example
          } else if (prop.type === 'string') {
            example[key] = 'string'
          } else if (prop.type === 'number' || prop.type === 'integer') {
            example[key] = 0
          } else if (prop.type === 'boolean') {
            example[key] = true
          }
        })
        setBody(JSON.stringify(example, null, 2))
      }
    } else {
      setBody('')
    }
  }, [endpoint.id])

  // Build final URL
  const buildUrl = () => {
    let path = endpoint.path
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value))
    })
    
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/')
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })
    
    return url.toString()
  }

  // Execute request
  const executeRequest = async () => {
    setRequestLoading(true)
    setLastResponse(null)

    const url = buildUrl()
    const startTime = performance.now()

    try {
      const response = await fetch(url, {
        method: endpoint.method.toUpperCase(),
        headers: endpoint.method !== 'get' ? headers : undefined,
        body: endpoint.method !== 'get' && body ? body : undefined,
      })

      const duration = performance.now() - startTime
      const responseText = await response.text()
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseText,
        duration,
        size: new Blob([responseText]).size,
      })
    } catch (error) {
      const duration = performance.now() - startTime
      setLastResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Failed to fetch. This might be due to CORS restrictions.',
        duration,
        size: 0,
      })
    } finally {
      setRequestLoading(false)
    }
  }

  // Generate cURL command
  const generateCurl = () => {
    const url = buildUrl()
    let curl = `curl -X ${endpoint.method.toUpperCase()} '${url}'`
    
    if (endpoint.method !== 'get') {
      Object.entries(headers).forEach(([key, value]) => {
        curl += ` \\\n  -H '${key}: ${value}'`
      })
      if (body) {
        curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`
      }
    }
    
    return curl
  }

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pathParamsList = endpoint.parameters.filter(p => p.in === 'path')
  const queryParamsList = endpoint.parameters.filter(p => p.in === 'query')

  return (
    <div className="space-y-6">
      {/* Server Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Server</label>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.example.com"
        />
        {servers && servers.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {servers.map((server, i) => (
              <Button
                key={i}
                variant={baseUrl === server.url ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setBaseUrl(server.url)}
              >
                {server.description || server.url}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Parameters */}
      <Tabs defaultValue="params" className="w-full">
        <TabsList>
          <TabsTrigger value="params">
            Parameters {pathParamsList.length + queryParamsList.length > 0 && `(${pathParamsList.length + queryParamsList.length})`}
          </TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          {endpoint.method !== 'get' && <TabsTrigger value="body">Body</TabsTrigger>}
        </TabsList>

        <TabsContent value="params" className="space-y-4 mt-4">
          {pathParamsList.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Path Parameters</label>
              {pathParamsList.map(param => (
                <div key={param.name} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-mono shrink-0">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    value={pathParams[param.name] || ''}
                    onChange={(e) => setPathParams({ ...pathParams, [param.name]: e.target.value })}
                    placeholder={param.description || param.name}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          {queryParamsList.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Query Parameters</label>
              {queryParamsList.map(param => (
                <div key={param.name} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-mono shrink-0">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    value={queryParams[param.name] || ''}
                    onChange={(e) => setQueryParams({ ...queryParams, [param.name]: e.target.value })}
                    placeholder={param.description || param.name}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          {pathParamsList.length === 0 && queryParamsList.length === 0 && (
            <p className="text-sm text-muted-foreground">No parameters required</p>
          )}
        </TabsContent>

        <TabsContent value="headers" className="mt-4">
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <Input
                  value={key}
                  className="w-40"
                  placeholder="Header name"
                  onChange={(e) => {
                    const newHeaders = { ...headers }
                    delete newHeaders[key]
                    newHeaders[e.target.value] = value
                    setHeaders(newHeaders)
                  }}
                />
                <Input
                  value={value}
                  className="flex-1"
                  placeholder="Header value"
                  onChange={(e) => setHeaders({ ...headers, [key]: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHeaders = { ...headers }
                    delete newHeaders[key]
                    setHeaders(newHeaders)
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHeaders({ ...headers, '': '' })}
            >
              + Add Header
            </Button>
          </div>
        </TabsContent>

        {endpoint.method !== 'get' && (
          <TabsContent value="body" className="mt-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-48 p-3 font-mono text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Request body (JSON)"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Execute Button */}
      <div className="flex items-center gap-3">
        <Button onClick={executeRequest} disabled={isRequestLoading} className="gap-2">
          {isRequestLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Send Request
        </Button>
        <Button variant="outline" onClick={copyCurl} className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy cURL
        </Button>
      </div>

      {/* Request URL Preview */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Request URL</div>
        <code className="text-sm font-mono break-all">{buildUrl()}</code>
      </div>

      {/* Response */}
      {lastResponse && (
        <ResponseDisplay response={lastResponse} />
      )}
    </div>
  )
}

function ResponseDisplay({ response }: { response: ApiResponse }) {
  const [activeTab, setActiveTab] = useState('body')
  const [copied, setCopied] = useState(false)

  const copyResponse = () => {
    navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Try to format JSON
  let formattedBody = response.body
  let isJson = false
  try {
    const parsed = JSON.parse(response.body)
    formattedBody = JSON.stringify(parsed, null, 2)
    isJson = true
  } catch {
    // Not JSON, use raw body
  }

  const statusColorClass = response.status === 0 
    ? 'text-red-500 bg-red-500/10 border-red-500/30'
    : response.status < 300 
      ? 'text-green-500 bg-green-500/10 border-green-500/30'
      : response.status < 400
        ? 'text-blue-500 bg-blue-500/10 border-blue-500/30'
        : response.status < 500
          ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
          : 'text-red-500 bg-red-500/10 border-red-500/30'

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Response Header */}
      <div className="flex items-center justify-between p-3 bg-muted border-b border-border">
        <div className="flex items-center gap-3">
          <span className={cn("px-2 py-0.5 rounded font-mono font-medium border text-sm", statusColorClass)}>
            {response.status || 'Error'} {response.statusText}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDuration(response.duration)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatBytes(response.size)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={copyResponse}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Response Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
          <TabsTrigger 
            value="body" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Body
          </TabsTrigger>
          <TabsTrigger 
            value="headers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Headers ({Object.keys(response.headers).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="m-0">
          <pre className="p-4 overflow-auto max-h-96 text-sm font-mono bg-background">
            {isJson ? (
              <JsonSyntaxHighlight json={formattedBody} />
            ) : (
              formattedBody
            )}
          </pre>
        </TabsContent>

        <TabsContent value="headers" className="m-0">
          <div className="divide-y divide-border">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex p-3 text-sm">
                <span className="w-48 shrink-0 font-medium">{key}</span>
                <span className="text-muted-foreground font-mono">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JsonSyntaxHighlight({ json }: { json: string }) {
  // Simple syntax highlighting for JSON
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />
}
