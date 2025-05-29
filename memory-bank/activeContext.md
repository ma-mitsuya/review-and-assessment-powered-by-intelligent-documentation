# RAPID Active Context

## Current Project State

The RAPID project is in active development with core features implemented and functional. The system is set up for both local development and AWS deployment.

## Recent Development Focus

### Completed Features

- Checklist management system with hierarchical structures
- Document upload and processing workflows
- Review job creation and execution
- AI-powered document assessment
- User interface for managing checklists and reviews
- Result visualization with confidence scores

### Active Development Areas

- Performance optimization for large document sets
- Enhanced error handling and recovery
- User experience improvements
- Testing coverage expansion

## Important Patterns and Preferences

### Code Style

- TypeScript strict mode enforced
- ES Modules only (no CommonJS)
- Repository pattern for all database access
- Dependency injection for testability
- Feature-based frontend organization

### Development Workflow

1. Always run tests before committing
2. Use existing components when possible
3. Follow layered architecture strictly
4. Document complex logic inline
5. Handle errors at appropriate layers

### Common Commands

```bash
# Backend development
cd backend
npm run dev
npm run test
npm run build

# Frontend development
cd frontend
npm run dev
npm run build

# Database management
cd backend
npm run prisma:studio
npm run prisma:migrate
```

## Key Decisions and Context

### Architecture Decisions

- **Fastify over Express**: Better TypeScript support and performance
- **Vitest over Jest**: Modern testing framework aligned with Vite
- **Prisma ORM**: Type-safe database access with migrations
- **Step Functions**: Scalable document processing workflows

### UI/UX Decisions

- **Tailwind CSS**: Utility-first styling (config is locked)
- **SWR**: Efficient data fetching with caching
- **Feature-based structure**: Better code organization
- **Core components**: Consistent UI elements

### Integration Decisions

- **AWS Cognito**: Managed authentication service
- **S3 Presigned URLs**: Secure document uploads
- **CloudFront**: CDN for static assets
- **RDS MySQL**: Managed database service

## Current Challenges

### Technical Debt

- Some error handling could be more granular
- Test coverage needs improvement in workflow handlers
- Documentation for complex workflows needs enhancement

### Performance Considerations

- Large document processing can be slow
- Database queries could be further optimized
- Frontend bundle size monitoring needed

## Next Steps

### Immediate Priorities

1. Enhance error handling in Step Functions
2. Improve test coverage for repositories
3. Optimize database queries for large datasets
4. Add more comprehensive logging

### Medium-term Goals

1. Implement caching strategy for frequently accessed data
2. Add performance monitoring and alerting
3. Enhance UI feedback during long operations
4. Create comprehensive API documentation

### Long-term Vision

1. Machine learning model improvements
2. Multi-language document support
3. Advanced analytics dashboard
4. Integration with external compliance systems

## Development Guidelines

### When Adding Features

1. Check existing patterns in codebase
2. Follow layered architecture
3. Add appropriate tests
4. Update relevant documentation
5. Consider performance impact

### When Fixing Bugs

1. Reproduce issue locally
2. Add failing test first
3. Implement minimal fix
4. Verify all tests pass
5. Document resolution

### When Refactoring

1. Ensure test coverage exists
2. Make incremental changes
3. Verify functionality unchanged
4. Update documentation
5. Clean up deprecated code

## Environment-Specific Notes

### Local Development

- Docker required for MySQL
- Environment variables in .env files
- Hot reload enabled for both frontend and backend

### AWS Deployment

- CDK manages infrastructure
- Separate stacks for different components
- CloudFormation outputs provide configuration

## Team Conventions

### Git Workflow

- Feature branches for development
- Pull requests for code review
- Squash and merge strategy
- Semantic commit messages

### Code Review Focus

- TypeScript type safety
- Error handling completeness
- Test coverage
- Performance implications
- Security considerations

## Important File Locations

### Configuration Files

- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template
- `cdk/cdk.json` - CDK configuration
- `.clinerules/` - Project-specific guidelines

### Key Source Files

- `backend/src/api/features/` - Feature implementations
- `frontend/src/features/` - UI features
- `backend/prisma/schema.prisma` - Database schema
- `cdk/lib/` - Infrastructure definitions

## Recent Learnings

### What Works Well

- Layered architecture provides clear boundaries
- Feature-based organization scales well
- Repository pattern simplifies testing
- Step Functions handle complex workflows effectively

### What Needs Improvement

- Error messages could be more user-friendly
- Some workflows need better documentation
- Performance monitoring needs enhancement
- Integration test setup is complex

## Contact and Resources

### Internal Resources

- GitLab repository for code and issues
- Project documentation in docs/
- Team conventions in .clinerules/

### External Dependencies

- AWS services documentation
- Prisma documentation
- Fastify guides
- React and Vite documentation
