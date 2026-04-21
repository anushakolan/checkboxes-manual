# Copilot Instructions — Thousand Checkboxes

## Project Context
This is a "One Thousand Checkboxes" web application. See ARCHITECTURE.md for technical decisions and README.md for project overview.

## Code Style
- Modern JavaScript, async/await, ES modules
- No secrets in code, ever, for any reason
- Clear variable names, minimal comments (code should be self-documenting)

## Testing
- All features need tests before implementation (TDD)
- Tests must trace to requirements in docs/specification.md
- Run `npm test` to verify

## Azure Integration
- Use Microsoft Learn MCP to look up current service limits when generating Azure code
- Follow concurrency patterns documented in ARCHITECTURE.md

## Documentation
- Update ARCHITECTURE.md when adding or changing components
- Keep README.md current with setup instructions
