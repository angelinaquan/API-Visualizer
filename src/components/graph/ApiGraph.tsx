import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useApiStore } from '@/stores/apiStore'
import { cn } from '@/lib/utils'
import type { Endpoint, Schema } from '@/types/api'

// Custom node for endpoints
function EndpointNode({ data }: { data: { endpoint: Endpoint } }) {
  const { endpoint } = data
  
  const methodColors: Record<string, string> = {
    get: 'bg-method-get border-method-get',
    post: 'bg-method-post border-method-post',
    put: 'bg-method-put border-method-put',
    patch: 'bg-method-patch border-method-patch',
    delete: 'bg-method-delete border-method-delete',
  }

  return (
    <div className="bg-card border-2 rounded-lg shadow-lg overflow-hidden min-w-[200px]">
      <div className={cn(
        "px-3 py-1.5 flex items-center gap-2",
        methodColors[endpoint.method] || 'bg-gray-500'
      )}>
        <span className="text-white font-bold text-xs uppercase">
          {endpoint.method}
        </span>
      </div>
      <div className="px-3 py-2">
        <code className="text-xs font-mono">{endpoint.path}</code>
        {endpoint.summary && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
            {endpoint.summary}
          </p>
        )}
      </div>
    </div>
  )
}

// Custom node for schemas
function SchemaNode({ data }: { data: { schema: Schema } }) {
  const { schema } = data
  const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0

  return (
    <div className="bg-card border-2 border-primary/30 rounded-lg shadow-lg overflow-hidden min-w-[150px]">
      <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/20">
        <span className="text-primary font-semibold text-sm">
          {schema.name}
        </span>
      </div>
      <div className="px-3 py-2">
        <div className="text-xs text-muted-foreground">
          {schema.type}
          {propertyCount > 0 && ` • ${propertyCount} properties`}
        </div>
        {schema.properties && (
          <div className="mt-2 space-y-1">
            {Object.entries(schema.properties).slice(0, 4).map(([name, prop]) => (
              <div key={name} className="text-[10px] font-mono flex justify-between gap-2">
                <span>{name}</span>
                <span className="text-muted-foreground">{prop.type || prop.$ref?.split('/').pop()}</span>
              </div>
            ))}
            {Object.keys(schema.properties).length > 4 && (
              <div className="text-[10px] text-muted-foreground">
                +{Object.keys(schema.properties).length - 4} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Custom node for tags (groups)
function TagNode({ data }: { data: { tag: string; count: number } }) {
  return (
    <div className="bg-accent/50 border-2 border-border rounded-lg px-4 py-2 min-w-[120px]">
      <div className="font-semibold capitalize">{data.tag}</div>
      <div className="text-xs text-muted-foreground">{data.count} endpoints</div>
    </div>
  )
}

const nodeTypes = {
  endpoint: EndpointNode,
  schema: SchemaNode,
  tag: TagNode,
}

export function ApiGraph() {
  const { spec, selectEndpoint, selectSchema } = useApiStore()

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!spec) return { initialNodes: [], initialEdges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Group endpoints by tag
    const endpointsByTag = new Map<string, Endpoint[]>()
    spec.endpoints.forEach(endpoint => {
      const tag = endpoint.tags[0] || 'default'
      if (!endpointsByTag.has(tag)) {
        endpointsByTag.set(tag, [])
      }
      endpointsByTag.get(tag)!.push(endpoint)
    })

    let yOffset = 0
    const tagSpacing = 50
    const endpointSpacing = 100
    const columnWidth = 300

    // Create nodes for each tag group
    Array.from(endpointsByTag.entries()).forEach(([tag, endpoints]) => {
      const tagY = yOffset

      // Tag node
      nodes.push({
        id: `tag-${tag}`,
        type: 'tag',
        position: { x: 0, y: tagY },
        data: { tag, count: endpoints.length },
      })

      // Endpoint nodes
      endpoints.forEach((endpoint, i) => {
        const nodeId = `endpoint-${endpoint.id}`
        nodes.push({
          id: nodeId,
          type: 'endpoint',
          position: { x: columnWidth, y: tagY + i * endpointSpacing },
          data: { endpoint },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        })

        // Edge from tag to endpoint
        edges.push({
          id: `${tag}-${endpoint.id}`,
          source: `tag-${tag}`,
          target: nodeId,
          type: 'smoothstep',
          style: { stroke: '#64748b', strokeWidth: 1 },
        })

        // Find schema references in responses
        endpoint.responses.forEach(response => {
          if (response.content) {
            Object.values(response.content).forEach(content => {
              const schemaRef = content.schema?.$ref
              if (schemaRef) {
                const schemaName = schemaRef.split('/').pop()
                edges.push({
                  id: `${endpoint.id}-${schemaName}`,
                  source: nodeId,
                  target: `schema-${schemaName}`,
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#3b82f6', strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
                })
              }
            })
          }
        })
      })

      yOffset += Math.max(endpoints.length * endpointSpacing, 150) + tagSpacing
    })

    // Schema nodes (positioned on the right)
    spec.schemas.forEach((schema, i) => {
      nodes.push({
        id: `schema-${schema.name}`,
        type: 'schema',
        position: { x: columnWidth * 2 + 100, y: i * 150 },
        data: { schema },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [spec])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'endpoint' && node.data) {
      selectEndpoint((node.data as { endpoint: Endpoint }).endpoint)
    } else if (node.type === 'schema' && node.data) {
      selectSchema((node.data as { schema: Schema }).schema.name)
    }
  }, [selectEndpoint, selectSchema])

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Load an API to view the graph
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#334155" gap={20} />
        <Controls className="bg-card border border-border rounded-lg" />
        <MiniMap 
          className="bg-card border border-border rounded-lg"
          nodeColor={(node) => {
            if (node.type === 'endpoint') return '#3b82f6'
            if (node.type === 'schema') return '#8b5cf6'
            return '#64748b'
          }}
        />
      </ReactFlow>
    </div>
  )
}
