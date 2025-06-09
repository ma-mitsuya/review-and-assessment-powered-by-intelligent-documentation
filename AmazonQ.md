# Amazon Q Development Guidelines

## Project Structure

This is an all-TypeScript project with the following structure:

- cdk/
  - package.json
- backend/
  - package.json
- frontend/ (React SPA, Tailwind CSS)
  - package.json

NOTE: There is NO package.json in the root directory. Do NOT create one using npm init.

## Development Workflow

### Planning Phase

- ALWAYS create a detailed plan in Markdown format before implementation. DO NOT proceed with implementation until explicitly told "Go" or "Proceed."
- When creating plans:
  - MUST examine existing implementation first. Speculation is strictly prohibited.
  - MUST include specific paths for "Files to create," "Files to modify," and "Files to delete."
  - MUST show clear, concise diffs focusing only on essential changes (do not include entire file contents unnecessarily).

### Implementation Phase

- ONLY modify files specified in the approved plan.
- ALWAYS verify build success after implementation:
  - For backend/frontend: `npm run build`
  - For CDK: `cdk synth`
- After successful build, run formatting for backend/frontend: `npm run format`

## Key Principles

- Maintain consistency with existing code patterns
- Follow TypeScript best practices
- Ensure code passes all linting and build processes
- Prioritize clear documentation of changes
