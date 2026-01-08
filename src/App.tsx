import { useEffect } from 'react'
import { FileText, Database, GitBranch, RotateCcw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { EndpointDetail } from '@/components/endpoint/EndpointDetail'
import { SchemaViewer } from '@/components/schema/SchemaViewer'
import { ApiGraph } from '@/components/graph/ApiGraph'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { Button } from '@/components/ui/button'
import { useApiStore } from '@/stores/apiStore'
import { cn } from '@/lib/utils'

type ViewMode = 'docs' | 'schemas' | 'graph'

function App() {
  const { spec, isDarkMode, error, setError, reset } = useApiStore()
  const [viewMode, setViewMode] = React.useState<ViewMode>('docs')

  // Apply dark mode class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  // Reset view mode when spec changes
  useEffect(() => {
    setViewMode('docs')
  }, [spec])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      {spec ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* View Mode Tabs */}
          <div className="border-b border-border bg-card px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ViewTab 
                  active={viewMode === 'docs'} 
                  onClick={() => setViewMode('docs')}
                  icon={<FileText className="w-4 h-4" />}
                  label="Documentation"
                />
                <ViewTab 
                  active={viewMode === 'schemas'} 
                  onClick={() => setViewMode('schemas')}
                  icon={<Database className="w-4 h-4" />}
                  label={`Schemas (${spec.schemas.length})`}
                />
                <ViewTab 
                  active={viewMode === 'graph'} 
                  onClick={() => setViewMode('graph')}
                  icon={<GitBranch className="w-4 h-4" />}
                  label="Graph View"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Load Different API
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {viewMode === 'docs' && (
              <>
                <Sidebar />
                <EndpointDetail />
              </>
            )}
            {viewMode === 'schemas' && <SchemaViewer />}
            {viewMode === 'graph' && <ApiGraph />}
          </div>
        </div>
      ) : (
        <WelcomeScreen />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-destructive text-destructive-foreground rounded-lg shadow-lg animate-in slide-in-from-bottom-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-medium">Error</h4>
              <p className="text-sm opacity-90 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive-foreground/70 hover:text-destructive-foreground text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewTab({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
        active 
          ? "border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// Import React for useState
import React from 'react'

export default App
