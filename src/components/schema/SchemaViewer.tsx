import { useState } from 'react'
import { ChevronRight, ChevronDown, Hash, Type, List, ToggleLeft, Circle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useApiStore } from '@/stores/apiStore'
import { cn } from '@/lib/utils'
import type { SchemaRef } from '@/types/api'

export function SchemaViewer() {
  const { spec, selectedSchema, selectSchema } = useApiStore()
  
  if (!spec) return null

  const schema = selectedSchema 
    ? spec.schemas.find(s => s.name === selectedSchema)
    : null

  return (
    <div className="flex h-full">
      {/* Schema List */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold">Schemas</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {spec.schemas.length} type definitions
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {spec.schemas.map(s => (
              <button
                key={s.name}
                onClick={() => selectSchema(s.name)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  selectedSchema === s.name
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <TypeIcon type={s.type} />
                  <span className="font-mono">{s.name}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Schema Detail */}
      <div className="flex-1 overflow-auto">
        {schema ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <TypeIcon type={schema.type} className="w-6 h-6" />
                <h2 className="text-2xl font-bold font-mono">{schema.name}</h2>
                <Badge variant="secondary">{schema.type}</Badge>
              </div>
              {schema.description && (
                <p className="text-muted-foreground">{schema.description}</p>
              )}
            </div>

            {schema.properties && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Properties
                </h3>
                <SchemaProperties 
                  properties={schema.properties} 
                  required={schema.required}
                />
              </div>
            )}

            {schema.enum && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Enum Values
                </h3>
                <div className="flex flex-wrap gap-2">
                  {schema.enum.map((value, i) => (
                    <Badge key={i} variant="outline" className="font-mono">
                      {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {schema.items && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Array Items
                </h3>
                <SchemaRefDisplay schema={schema.items} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Circle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select a schema to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SchemaProperties({ 
  properties, 
  required = [],
  depth = 0 
}: { 
  properties: Record<string, SchemaRef>
  required?: string[]
  depth?: number
}) {
  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {Object.entries(properties).map(([name, schema]) => (
        <PropertyRow 
          key={name}
          name={name}
          schema={schema}
          isRequired={required.includes(name)}
          depth={depth}
        />
      ))}
    </div>
  )
}

function PropertyRow({ 
  name, 
  schema, 
  isRequired,
  depth 
}: { 
  name: string
  schema: SchemaRef
  isRequired: boolean
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasNestedProperties = schema.properties && Object.keys(schema.properties).length > 0

  return (
    <div>
      <div 
        className={cn(
          "flex items-start gap-3 p-3",
          hasNestedProperties && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={() => hasNestedProperties && setExpanded(!expanded)}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {hasNestedProperties && (
          <div className="mt-1">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono font-medium text-sm">{name}</code>
            {isRequired && (
              <span className="text-[10px] text-red-500 font-semibold">required</span>
            )}
            {schema.nullable && (
              <span className="text-[10px] text-muted-foreground">nullable</span>
            )}
          </div>
          {schema.description && (
            <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <SchemaRefDisplay schema={schema} compact />
        </div>
      </div>

      {expanded && hasNestedProperties && schema.properties && (
        <div className="border-t border-border bg-muted/30">
          <SchemaProperties 
            properties={schema.properties}
            required={schema.required}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  )
}

function SchemaRefDisplay({ schema, compact = false }: { schema: SchemaRef; compact?: boolean }) {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    return (
      <span className="text-primary font-mono text-sm">
        {refName}
      </span>
    )
  }

  if (schema.type === 'array' && schema.items) {
    return (
      <span className="font-mono text-sm">
        <span className="text-muted-foreground">array of </span>
        <SchemaRefDisplay schema={schema.items} compact />
      </span>
    )
  }

  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf || schema.anyOf
    return (
      <span className="font-mono text-sm text-muted-foreground">
        {variants?.map((v, i) => (
          <span key={i}>
            {i > 0 && ' | '}
            <SchemaRefDisplay schema={v} compact />
          </span>
        ))}
      </span>
    )
  }

  const typeStr = schema.type || 'any'
  const formatStr = schema.format ? ` (${schema.format})` : ''

  return (
    <span className={cn("font-mono text-sm", compact && "text-muted-foreground")}>
      {typeStr}{formatStr}
      {schema.enum && (
        <span className="text-xs ml-1">
          [{schema.enum.slice(0, 3).join(', ')}{schema.enum.length > 3 ? '...' : ''}]
        </span>
      )}
    </span>
  )
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = cn("w-4 h-4 text-muted-foreground", className)
  
  switch (type) {
    case 'object':
      return <Type className={iconClass} />
    case 'array':
      return <List className={iconClass} />
    case 'string':
      return <Type className={iconClass} />
    case 'number':
    case 'integer':
      return <Hash className={iconClass} />
    case 'boolean':
      return <ToggleLeft className={iconClass} />
    default:
      return <Circle className={iconClass} />
  }
}
