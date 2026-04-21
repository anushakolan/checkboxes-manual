# One Thousand Checkboxes

A scaled-down learning version of the viral [One Million Checkboxes](https://en.wikipedia.org/wiki/One_Million_Checkboxes) project. Multiple users can view and toggle shared checkboxes with real-time synchronization.

## Features

- **Shared state across users** — checkbox states persist and are visible to all connected users
- **Real-time sync** — changes propagate to other users automatically
- **Optimistic concurrency** — concurrent updates are handled gracefully without data loss

## Getting Started

1. Navigate to the project directory: `cd studentfiles`
2. Install dependencies: `npm install`
3. Start the application backend server: `node src/index.js`
4. Open your browser to `http://localhost:3000`

Requirements: Node.js (v18+)

## Development

This project uses specification-driven development (SDD):

1. **Research** the domain and make architecture decisions
2. **Specify** requirements with inline test cases
3. **Build** iteratively using test-driven development
4. **Verify** against the specification

See `docs/specification.md` for the full specification (created during the lab).

## Project Structure

```text
├── docs/                # System specifications and technical details
├── public/              # Client-side interactive UI (HTML/CSS/JS)
├── src/                 # Node.js / Express backend server
├── tests/               # Jest test suites verifying against specification
├── AGENTS.md            # Copilot Agent definition/rules
├── ARCHITECTURE.md      # Scalable sync/signalR architecture overview
└── target/              # Miscellaneous configurations
```

## License

This project is a learning exercise for the Azure Engineering Boot Camp.
