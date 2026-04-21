# Thousand Checkboxes - Agent Instructions

## Project Overview
This is a "One Thousand Checkboxes" web application — a scaled-down learning version of the viral One Million Checkboxes project. Multiple users can view and toggle shared checkboxes with real-time synchronization.

## Architecture
- See ARCHITECTURE.md for technical decisions and component details
- See docs/specification.md for requirements and test cases (created during the lab)

## Code Standards
- Modern JavaScript with ES modules and async/await
- No secrets in code, ever, for any reason
- All features require tests before implementation (TDD)
- Use OpenTelemetry for instrumentation

## Development Workflow
- Use `/fromspec` to implement specification sections with TDD
- Use `/syncdocs` to keep ARCHITECTURE.md in sync with code
- Use `/shipit` to commit with meaningful messages
- Start new chat sessions between specification sections to keep context clean

## Testing
- Write tests FIRST, then implement
- Every test must trace to a requirement in docs/specification.md
- Run `npm test` to verify before committing
