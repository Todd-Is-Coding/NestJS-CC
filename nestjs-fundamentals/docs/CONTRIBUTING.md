# Contributing Guide

Guidelines for contributing to NestJS Fundamentals.

---

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/nestjs-fundamentals.git
cd nestjs-fundamentals

# Install dependencies
npm install

# Verify setup
npm run lint && npm test
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Create branch from main
git checkout -b feature/your-feature-name

# Naming conventions:
# feature/add-user-authentication
# fix/cors-origin-validation
# docs/deployment-guide
# refactor/service-layer-tests
```

### 2. Make Changes

```bash
# Start development server
npm run start:dev

# Monitor for errors
npm run lint -- --watch
```

### 3. Code Quality

```bash
# Lint and fix issues
npm run lint

# Format code
npm run format

# All together
npm run lint && npm run format && npm test
```

### 4. Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### 5. Commit Changes

```bash
# Conventional commit format
git add .
git commit -m "feat: add user authentication

- Implement JWT strategy
- Add auth guards
- Update module exports"

# Types: feat, fix, docs, style, refactor, perf, test, ci, chore
```

### 6. Push & Create Pull Request

```bash
# Push branch
git push origin feature/your-feature-name

# Create PR on GitHub with:
# - Clear title
# - Description of changes
# - Reference to issues
# - Test results
```

---

## Code Standards

### TypeScript

```typescript
// ✅ Good
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

// ❌ Bad
export class UserService {
  getUserById(id) {
    // No type
    return this.userRepository.findById(id); // No async/return type
  }
}
```

### File Organization

```typescript
// File: user.service.ts
// 1. Imports
import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

// 2. Decorator
@Injectable()
// 3. Class definition
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // 4. Methods (public first, then private)
  async getAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  private validateUser(user: User): boolean {
    return !!user.id && !!user.email;
  }
}
```

### Naming Conventions

| Type        | Convention       | Example                                |
| ----------- | ---------------- | -------------------------------------- |
| Classes     | PascalCase       | `UserService`, `AppController`         |
| Methods     | camelCase        | `getUser()`, `updateUser()`            |
| Constants   | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_PORT`          |
| Files       | kebab-case       | `user.service.ts`, `app.controller.ts` |
| Directories | kebab-case       | `src/users`, `src/auth`                |

---

## Testing Requirements

### Unit Tests

```typescript
// Test every public method
describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(() => {
    // Setup
    repository = createMockRepository();
    service = new UserService(repository);
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', name: 'John' };
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);

      const result = await service.getUser('1');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.getUser('invalid')).rejects.toThrow();
    });
  });
});
```

### Minimum Coverage

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

View coverage:

```bash
npm run test:cov
open coverage/lcov-report/index.html
```

---

## Documentation

### Update README

If adding features, update [README.md](../README.md):

1. Add to Table of Contents if major feature
2. Document API endpoints
3. Add code examples
4. Explain design decisions

### Create Documentation

For complex features, create docs:

```bash
# Examples
docs/DATABASE.md
docs/AUTHENTICATION.md
docs/ADVANCED-CACHING.md
```

### Code Comments

```typescript
// ✅ Good - explains why, not what
@Injectable()
export class RateLimitService {
  // Use sliding window to prevent burst attacks
  // Store in Redis for distributed rate limiting
  async isAllowed(key: string): Promise<boolean> {
    // Implementation
  }
}

// ❌ Bad - obvious from code
@Injectable()
export class RateLimitService {
  // Check if allowed
  async isAllowed(key: string): Promise<boolean> {
    // Get from redis
    const count = await redis.get(key);
    // Check count
    return count < 100;
  }
}
```

---

## Pull Request Process

### PR Title Format

```
[Type] Brief description

feat: Add JWT authentication
fix: Resolve CORS validation bug
docs: Update deployment guide
refactor: Simplify service layer
```

### PR Description Template

```markdown
## Description

Brief explanation of what this PR does.

## Changes

- Change 1
- Change 2

## Related Issues

Fixes #123
Related to #456

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Coverage maintained/improved

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] All tests passing
```

### Review Process

1. **Code Review** (2+ reviewers)
   - Check code quality
   - Verify tests
   - Review documentation
   - Check for security issues

2. **Automated Checks**
   - Linting passes
   - All tests pass
   - Coverage maintained
   - No vulnerabilities

3. **Merge**
   - Squash commits (if needed)
   - Merge to main
   - Delete feature branch

---

## Common Tasks

### Adding a New Endpoint

```typescript
// 1. Create DTO
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

// 2. Update Service
@Injectable()
export class UserService {
  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create(dto);
  }
}

// 3. Update Controller
@Controller('/users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}

// 4. Add Tests
describe('POST /users', () => {
  it('should create user', async () => {
    const dto = { name: 'John', email: 'john@example.com' };
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Adding a Service

```typescript
// 1. Create service file
// src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(private emailService: EmailService) {}

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.emailService.send({
      to: email,
      subject: 'Welcome!',
      template: 'welcome',
    });
  }
}

// 2. Create module
// src/notifications/notifications.module.ts
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

// 3. Import in AppModule
@Module({
  imports: [NotificationsModule],
})
export class AppModule {}

// 4. Use in other services
@Injectable()
export class UserService {
  constructor(private notificationsService: NotificationsService) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(dto);
    await this.notificationsService.sendWelcomeEmail(user.email);
    return user;
  }
}
```

---

## Debugging

### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/node_modules/.bin/nest",
      "args": ["start", "--debug"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug Commands

```bash
# Start in debug mode
npm run start:debug

# Then in VS Code: F5 or Run → Start Debugging
```

---

## Performance Considerations

### Before Committing

```bash
# Check for performance regressions
npm run test -- --testNamePattern="performance"

# Check bundle size
npm run build
du -sh dist/

# Benchmark
node --prof dist/main.js
node --prof-process isolate-*.log > profile.txt
```

---

## Security

### Secrets

Never commit:

- `.env` files
- API keys
- Database credentials
- Private keys
- Tokens

Use environment variables instead.

### Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Before committing
npm audit
```

---

## Releasing

### Version Bumping

```bash
# Patch (bug fix): 1.0.0 → 1.0.1
npm version patch

# Minor (feature): 1.0.0 → 1.1.0
npm version minor

# Major (breaking): 1.0.0 → 2.0.0
npm version major

# Tag and push
git push origin --tags
```

### Changelog

Update [CHANGELOG.md](../CHANGELOG.md):

```markdown
## [1.1.0] - 2024-01-20

### Added

- JWT authentication with guards
- Rate limiting middleware
- Security headers

### Fixed

- CORS validation bug
- Request timeout issue

### Changed

- Updated TypeScript to 5.7.3
- Improved error handling

### Security

- Fixed SQL injection vulnerability
```

---

## Getting Help

### Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Jest Documentation](https://jestjs.io/)

### Communication

- GitHub Issues: Bug reports and features
- GitHub Discussions: Questions and ideas
- Code Review: Technical feedback

---

## Recognition

Contributors will be:

- Added to [CONTRIBUTORS.md](../CONTRIBUTORS.md)
- Mentioned in releases
- Credited in documentation

---

## License

By contributing, you agree that your contributions will be licensed under the same license as this project (UNLICENSED).

---

**Last Updated**: 2024  
**Version**: 1.0
