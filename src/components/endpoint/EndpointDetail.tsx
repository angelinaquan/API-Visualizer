import { useState } from 'react'
import { Copy, Check, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiStore } from '@/stores/apiStore'
import { cn } from '@/lib/utils'
import type { Endpoint, Parameter, SchemaRef, Response } from '@/types/api'
import { TryItOut } from './TryItOut'

export function EndpointDetail() {
  const { selectedEndpoint, spec } = useApiStore()
  const [copied, setCopied] = useState(false)

  if (!selectedEndpoint || !spec) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Select an endpoint</p>
          <p className="text-sm mt-1">Choose an endpoint from the sidebar to view details</p>
        </div>
      </div>
    )
  }

  const copyPath = () => {
    navigator.clipboard.writeText(selectedEndpoint.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <Badge 
              variant={selectedEndpoint.method as 'get' | 'post' | 'put' | 'patch' | 'delete'}
              className="text-sm px-2.5 py-1"
            >
              {selectedEndpoint.method.toUpperCase()}
            </Badge>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-medium">{selectedEndpoint.path}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPath}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                {selectedEndpoint.deprecated && (
                  <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Deprecated
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {selectedEndpoint.summary && (
            <h2 className="text-xl font-semibold mt-3">{selectedEndpoint.summary}</h2>
          )}
          
          {selectedEndpoint.description && (
            <p className="text-muted-foreground mt-2">{selectedEndpoint.description}</p>
          )}

          {selectedEndpoint.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {selectedEndpoint.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="docs" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="try">Try It Out</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="mt-6 space-y-6">
            {/* Parameters */}
            {selectedEndpoint.parameters.length > 0 && (
              <ParametersSection parameters={selectedEndpoint.parameters} />
            )}

            {/* Request Body */}
            {selectedEndpoint.requestBody && (
              <RequestBodySection requestBody={selectedEndpoint.requestBody} />
            )}

            {/* Responses */}
            <ResponsesSection responses={selectedEndpoint.responses} />
          </TabsContent>

          <TabsContent value="try" className="mt-6">
            <TryItOut endpoint={selectedEndpoint} servers={spec.servers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ParametersSection({ parameters }: { parameters: Parameter[] }) {
  const groupedParams = {
    path: parameters.filter(p => p.in === 'path'),
    query: parameters.filter(p => p.in === 'query'),
    header: parameters.filter(p => p.in === 'header'),
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Parameters</h3>
      
      {Object.entries(groupedParams).map(([type, params]) => {
        if (params.length === 0) return null
        return (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {type} Parameters
            </h4>
            <div className="border border-border rounded-lg divide-y divide-border">
              {params.map(param => (
                <div key={param.name} className="p-3 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-medium">{param.name}</code>
                      {param.required && (
                        <span className="text-[10px] text-red-500 font-semibold">REQUIRED</span>
                      )}
                    </div>
                    {param.description && (
                      <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {param.schema.type || 'string'}
                    {param.schema.format && <span className="text-xs ml-1">({param.schema.format})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RequestBodySection({ requestBody }: { requestBody: Endpoint['requestBody'] }) {
  if (!requestBody) return null

  const contentType = Object.keys(requestBody.content)[0]
  const schema = requestBody.content[contentType]?.schema

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Request Body</h3>
        {requestBody.required && (
          <span className="text-[10px] text-red-500 font-semibold">REQUIRED</span>
        )}
      </div>
      
      {requestBody.description && (
        <p className="text-muted-foreground">{requestBody.description}</p>
      )}

      <div className="text-sm text-muted-foreground">
        Content-Type: <code className="bg-muted px-1.5 py-0.5 rounded">{contentType}</code>
      </div>

      {schema && <SchemaDisplay schema={schema} />}
    </div>
  )
}

function ResponsesSection({ responses }: { responses: Response[] }) {
  const [expandedResponse, setExpandedResponse] = useState<string | null>(
    responses.find(r => r.statusCode.startsWith('2'))?.statusCode || responses[0]?.statusCode
  )

  if (responses.length === 0) return null

  const getStatusColor = (code: string) => {
    if (code.startsWith('2')) return 'text-green-500 bg-green-500/10 border-green-500/30'
    if (code.startsWith('3')) return 'text-blue-500 bg-blue-500/10 border-blue-500/30'
    if (code.startsWith('4')) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
    if (code.startsWith('5')) return 'text-red-500 bg-red-500/10 border-red-500/30'
    return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Responses</h3>
      
      <div className="space-y-2">
        {responses.map(response => {
          const isExpanded = expandedResponse === response.statusCode
          const contentType = response.content ? Object.keys(response.content)[0] : null
          const schema = contentType ? response.content?.[contentType]?.schema : null

          return (
            <div key={response.statusCode} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedResponse(isExpanded ? null : response.statusCode)}
                className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={cn(
                  "px-2 py-0.5 rounded text-sm font-mono font-medium border",
                  getStatusColor(response.statusCode)
                )}>
                  {response.statusCode}
                </span>
                <span className="text-sm">{response.description}</span>
              </button>

              {isExpanded && schema && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                  {contentType && (
                    <div className="text-sm text-muted-foreground mb-3">
                      Content-Type: <code className="bg-muted px-1.5 py-0.5 rounded">{contentType}</code>
                    </div>
                  )}
                  <SchemaDisplay schema={schema} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SchemaDisplay({ schema, depth = 0 }: { schema: SchemaRef; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)

  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    return (
      <span className="text-primary font-mono text-sm">
        → {refName}
      </span>
    )
  }

  // Simple types
  if (!schema.properties && !schema.items) {
    return (
      <span className="font-mono text-sm">
        {schema.type || 'any'}
        {schema.format && <span className="text-muted-foreground"> ({schema.format})</span>}
        {schema.enum && (
          <span className="text-muted-foreground"> enum: [{schema.enum.join(', ')}]</span>
        )}
      </span>
    )
  }

  // Array type
  if (schema.type === 'array' && schema.items) {
    return (
      <div className="font-mono text-sm">
        <span>array of </span>
        <SchemaDisplay schema={schema.items} depth={depth + 1} />
      </div>
    )
  }

  // Object type
  if (schema.properties) {
    const props = Object.entries(schema.properties)
    const required = schema.required || []

    return (
      <div className="border border-border rounded-lg bg-background">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-2 flex items-center gap-2 text-sm font-mono hover:bg-accent/50"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-muted-foreground">{`{${props.length} properties}`}</span>
        </button>
        
        {expanded && (
          <div className="border-t border-border divide-y divide-border">
            {props.map(([name, propSchema]) => (
              <div key={name} className="p-3 flex items-start gap-3" style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{name}</code>
                    {required.includes(name) && (
                      <span className="text-[10px] text-red-500">required</span>
                    )}
                  </div>
                  {propSchema.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{propSchema.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <SchemaDisplay schema={propSchema} depth={depth + 1} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span className="font-mono text-sm">{schema.type || 'any'}</span>
}
