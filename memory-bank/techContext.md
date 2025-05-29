# RAPID Technical Context

## Technology Stack

### Backend

- **Language**: TypeScript (strict mode, ES Modules only)
- **Framework**: Fastify (REST API)
- **Database**: MySQL
- **ORM**: Prisma
- **Testing**: Vitest (Jest is prohibited)
- **Module System**: ES Modules (CommonJS forbidden)

### Frontend

- **Language**: TypeScript (JavaScript forbidden)
- **Framework**: React with Vite
- **Styling**: Tailwind CSS (config must not be modified)
- **State Management**: SWR for data fetching
- **Icons**: react-icons (SVG usage prohibited)
- **Module System**: ES Modules

### Infrastructure

- **Cloud Provider**: AWS
- **Compute**: Lambda Functions
- **Workflow**: Step Functions
- **Storage**: S3 for documents
- **Database**: RDS MySQL
- **Authentication**: Cognito
- **CDN**: CloudFront
- **IaC**: AWS CDK (TypeScript)

## Development Setup

### Prerequisites

- Node.js v18 or higher
- Docker and Docker Compose
- AWS CLI (configured)

### Local Development Environment

1. **Database**: MySQL in Docker container

   - Host: localhost:3306
   - Database: rapid_db
   - User: rapid_user
   - Password: rapid_password

2. **Backend Server**: Fastify on http://localhost:3000
3. **Frontend Dev Server**: Vite on http://localhost:5173
4. **Prisma Studio**: Database GUI on http://localhost:5555

### Environment Variables

Backend:

```bash
export RAPID_LOCAL_DEV=true
export DOCUMENT_BUCKET=<S3_BUCKET_NAME>
export AWS_REGION=ap-northeast-1
export DOCUMENT_PROCESSING_STATE_MACHINE_ARN=<STEP_FUNCTION_ARN>
export REVIEW_PROCESSING_STATE_MACHINE_ARN=<STEP_FUNCTION_ARN>
```

## Architecture Patterns

### Backend Layered Architecture

Each feature follows a strict layered pattern:

```
src/api/features/{feature-name}/
├── domain/          # Business logic
│   ├── model/      # Domain models
│   ├── service/    # Domain services
│   └── repository.ts # Data access
├── usecase/        # Application logic
└── routes/         # HTTP layer
    ├── index.ts    # Route definitions
    └── handlers.ts # Request handlers
```

### Frontend Feature-Based Structure

```
src/features/{feature-name}/
├── components/     # Feature-specific components
├── hooks/         # Feature-specific hooks
└── pages/         # Feature pages
```

### Database Schema

- **CheckListSet**: Container for checklist hierarchies
- **CheckList**: Individual check items with parent-child relationships
- **CheckListDocument**: Documents associated with checklists
- **ReviewJob**: Review process instances
- **ReviewDocument**: Documents being reviewed
- **ReviewResult**: AI assessment results with overrides

## Key Technical Decisions

### TypeScript Everywhere

- Strict TypeScript for type safety
- No JavaScript or Python allowed
- Comprehensive type definitions for all interfaces

### Repository Pattern

- All database access through repository interfaces
- Direct Prisma client usage forbidden in handlers
- Dependency injection for testability

### Error Handling

- Comprehensive error tracking in database
- Step Functions handle workflow errors
- Frontend displays user-friendly error messages

### Testing Strategy

- Unit tests with Vitest
- Repository integration tests with real database
- No mocking of database in repository tests

## Build and Deployment

### Local Build Commands

```bash
# Backend
cd backend
npm run build
npm run format

# Frontend
cd frontend
npm run build
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm run test -- test-suite
```

### Deployment

- Uses AWS CDK for infrastructure
- Only deploy when explicitly requested
- Command: `cd cdk && cdk deploy --require-approval never`

## Development Constraints

### Backend

- No direct database access in handlers
- All async operations properly handled
- Follow layered architecture strictly
- Use dependency injection pattern

### Frontend

- Use existing components from src/components
- Feature-based organization
- No direct DOM manipulation
- Use established patterns for data fetching

### General

- ES Modules only (no require/module.exports)
- TypeScript strict mode
- Follow established coding patterns
- Comprehensive error handling

## Performance Considerations

- Document processing uses Step Functions for scalability
- Database queries optimized with proper indexes
- Frontend uses SWR for efficient data caching
- Batch processing capabilities for multiple documents

## Security Measures

- Authentication via AWS Cognito
- S3 presigned URLs for secure document access
- Input validation at all layers
- Audit trails for all operations
