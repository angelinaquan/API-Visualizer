# API Visualizer 🔍

A beautiful, interactive API documentation viewer. Upload your OpenAPI spec and explore your APIs with ease.

![API Visualizer](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **📄 Beautiful Documentation** - Clean, modern UI for exploring API endpoints
- **🧪 Try It Out** - Test API endpoints directly from the browser
- **📊 Schema Viewer** - Explore data models and type definitions
- **🔗 Graph View** - Visualize relationships between endpoints and schemas
- **🌙 Dark Mode** - Easy on the eyes with automatic dark/light mode
- **📱 Responsive** - Works on desktop and tablet devices
- **🚀 Fast** - Built with Vite for instant hot reload
- **🔒 Privacy First** - All processing happens in your browser

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Using the App

1. **Upload a spec** - Drag & drop or click to upload an OpenAPI JSON/YAML file
2. **Load from URL** - Paste a URL to any OpenAPI specification
3. **Try a sample** - Click "Try Sample API" to load the Petstore demo

## 📋 Supported Formats

- OpenAPI 3.0.x / 3.1.x (JSON/YAML)
- Swagger 2.0 (JSON/YAML)

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Graph Visualization**: React Flow
- **OpenAPI Parsing**: @apidevtools/swagger-parser

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Base UI components (Button, Input, etc.)
│   ├── layout/       # Layout components (Header, Sidebar)
│   ├── endpoint/     # Endpoint detail & Try It Out
│   ├── schema/       # Schema viewer
│   └── graph/        # API graph visualization
├── stores/           # Zustand state management
├── types/            # TypeScript type definitions
├── utils/            # Utility functions & parsers
└── lib/              # Shared utilities
```

## 🎨 Features Overview

### Documentation View
- Collapsible sidebar with endpoint tree
- Search and filter endpoints
- HTTP method color coding (GET=blue, POST=green, etc.)
- Parameter documentation with types and descriptions
- Response schema visualization

### Try It Out
- Auto-generated request forms from spec
- Support for path, query, and header parameters
- JSON body editor with example generation
- Response viewer with syntax highlighting
- Copy as cURL command

### Schema Viewer
- Browse all data models
- Expandable nested properties
- Required field indicators
- Type references and linking

### Graph View
- Interactive node-based visualization
- Endpoint → Schema relationships
- Zoom, pan, and minimap
- Click nodes to navigate

## ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + K` - Focus search
- `Escape` - Clear selection

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## 📄 License

MIT License - feel free to use this in your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for the developer community
