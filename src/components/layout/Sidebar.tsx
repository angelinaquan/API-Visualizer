import { useState } from 'react'
import { Search, ChevronRight, ChevronDown, Circle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApiStore } from '@/stores/apiStore'
import { cn } from '@/lib/utils'
import type { Endpoint, HttpMethod } from '@/types/api'

export function Sidebar() {
  const { spec, selectedEndpoint, selectEndpoint, searchQuery, setSearchQuery } = useApiStore()
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())

  if (!spec) return null

  // Group endpoints by tag
  const endpointsByTag = new Map<string, Endpoint[]>()
  spec.endpoints.forEach(endpoint => {
    const tag = endpoint.tags[0] || 'default'
    if (!endpointsByTag.has(tag)) {
      endpointsByTag.set(tag, [])
    }
    endpointsByTag.get(tag)!.push(endpoint)
  })

  // Filter endpoints based on search
  const filterEndpoints = (endpoints: Endpoint[]) => {
    if (!searchQuery) return endpoints
    const query = searchQuery.toLowerCase()
    return endpoints.filter(e => 
      e.path.toLowerCase().includes(query) ||
      e.summary?.toLowerCase().includes(query) ||
      e.method.toLowerCase().includes(query)
    )
  }

  const toggleTag = (tag: string) => {
    const newExpanded = new Set(expandedTags)
    if (newExpanded.has(tag)) {
      newExpanded.delete(tag)
    } else {
      newExpanded.add(tag)
    }
    setExpandedTags(newExpanded)
  }

  // Auto-expand all tags on first render or when search is active
  if (expandedTags.size === 0 && endpointsByTag.size > 0) {
    setExpandedTags(new Set(endpointsByTag.keys()))
  }

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Endpoint stats */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 text-xs text-muted-foreground">
        <span>{spec.endpoints.length} endpoints</span>
        <span>•</span>
        <span>{spec.schemas.length} schemas</span>
      </div>

      {/* Endpoint tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Array.from(endpointsByTag.entries()).map(([tag, endpoints]) => {
            const filteredEndpoints = filterEndpoints(endpoints)
            if (filteredEndpoints.length === 0 && searchQuery) return null
            
            const isExpanded = expandedTags.has(tag) || !!searchQuery

            return (
              <div key={tag} className="mb-1">
                <button
                  onClick={() => toggleTag(tag)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-sm font-medium"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="capitalize">{tag}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {filteredEndpoints.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {filteredEndpoints.map(endpoint => (
                      <EndpointItem
                        key={endpoint.id}
                        endpoint={endpoint}
                        isSelected={selectedEndpoint?.id === endpoint.id}
                        onClick={() => selectEndpoint(endpoint)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Schemas link */}
      <div className="p-3 border-t border-border">
        <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
          <Circle className="w-3 h-3" />
          <span>Schemas ({spec.schemas.length})</span>
        </button>
      </div>
    </div>
  )
}

function EndpointItem({ 
  endpoint, 
  isSelected, 
  onClick 
}: { 
  endpoint: Endpoint
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
        isSelected 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-accent text-foreground"
      )}
    >
      <MethodBadge method={endpoint.method} />
      <span className="truncate flex-1 font-mono text-xs">{endpoint.path}</span>
      {endpoint.deprecated && (
        <span className="text-[10px] text-orange-500 font-medium">DEP</span>
      )}
    </button>
  )
}

function MethodBadge({ method }: { method: HttpMethod }) {
  const colors: Record<HttpMethod, string> = {
    get: 'bg-method-get text-white',
    post: 'bg-method-post text-white',
    put: 'bg-method-put text-white',
    patch: 'bg-method-patch text-white',
    delete: 'bg-method-delete text-white',
    options: 'bg-purple-500 text-white',
    head: 'bg-purple-500 text-white',
  }

  return (
    <span className={cn(
      "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded min-w-[42px] text-center",
      colors[method]
    )}>
      {method}
    </span>
  )
}
