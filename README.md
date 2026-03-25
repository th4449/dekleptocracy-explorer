# Dekleptocracy Explorer

Open-source knowledge graph of kleptocratic financial networks — auto-built from investigative reporting.

## About

The Dekleptocracy Explorer is an interactive network visualization tool that maps financial relationships between persons, organizations, deals, jurisdictions, and enforcement actions involved in kleptocratic networks.

### Features

- **Network Map** — Interactive force-directed graph visualization of entity relationships
- **Cluster Analysis** — Five thematic clusters: Sanctions-Busting, Crypto Rails, Energy Networks, Princeling Families, and Influence Operations
- **Node Explorer** — Searchable, filterable directory of all entities
- **Article Sources** — Linked investigative reporting that sources each connection
- **Data Manager** — Add nodes, edges, and import/export graph data as JSON
- **Guided Tour** — Walk-through introduction to each network cluster
- **Dark/Light Themes** — Toggle between display modes
- **Responsive Design** — Works on desktop and mobile
- **Embed Mode** — URL parameter support for embedding in other sites

## Deployment

This is a single-file HTML application with no build step required. It runs entirely in the browser.

### GitHub Pages

This repository is configured to deploy automatically via GitHub Pages from the `main` branch.

**Live site:** `https://<your-username>.github.io/dekleptocracy-explorer/`

### Self-hosting

Copy `index.html` to any static file server.

## Data Format

The explorer uses a JSON data structure with three arrays:

- **nodes** — Entities (persons, organizations, deals, jurisdictions, enforcement actions)
- **edges** — Relationships between nodes
- **articles** — Source articles from investigative reporting

Use the built-in Data Manager or export/import JSON files to modify the dataset.

## Built By

[Informed Democracy Project / Dekleptocracy Alliance](https://dekleptocracy.org) — a Texas-based 501(c)(4) nonprofit.

## License

Open source. See repository for details.
