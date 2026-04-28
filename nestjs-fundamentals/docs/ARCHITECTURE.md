# Architecture Deep Dive

## Overview

This document provides an in-depth analysis of the NestJS Fundamentals architecture, including design decisions, tradeoffs, and extensibility patterns.

---

## Layered Architecture

### Presentation Layer

**Responsibility**: HTTP handling and request/response management

**Components**:

- Controllers (`@Controller`)
- Route handlers (`@Get`, `@Post`, etc.)
- Request/Response DTOs

**Characteristics**:

- Framework-specific (Express in this case)
- Thin, logic-lite
- Handles HTTP concerns only

**Example**:

```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    // HTTP handler - delegates to service
    return this.appService.getHello();
  }
}
```

**Why This Matters**:

- Controllers are easy to test (when mocking services)
- Business logic remains portable if we switch from HTTP to WebSocket

---

### Business Logic Layer

**Responsibility**: Core domain logic, algorithms, data transformations

**Components**:

- Services (`@Injectable`)
- Domain models
- Business rules

**Characteristics**:

- Framework-agnostic
- Pure business logic
- Testable without HTTP context
- Can be reused across multiple transport layers

**Example**:

```typescript
@Injectable()
export class AppService {
  // Pure business logic - could be called from HTTP, WebSocket, CLI, etc.
  getHello(): string {
    return 'Hello World!';
  }

  sendHelloToUser(name: string): string {
    return `Hello ${name}`;
  }
}
```

**Why This Matters**:

- Business logic survives framework changes
- Can test without mocking Express
- Enables code reuse across services

---

### Infrastructure Layer (Future)

**Responsibility**: Data access, external APIs, caching

**Components** (when added):

- Repositories (data access)
- Database models
- External API clients
- Cache managers

**Example**:

```typescript
@Injectable()
export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User> {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  async save(user: User): Promise<User> {
    return this.db.query('INSERT INTO users (...) VALUES (...)', [user]);
  }
}
```

**Why This Matters**:

- Database details hidden from business logic
- Can switch databases without changing services
- Easy to mock for testing

---

## Request Lifecycle

### Step-by-Step Flow

```
HTTP Request
    ↓
[1] Express HTTP Server receives
    ↓
[2] NestJS Platform intercepts
    ↓
[3] Global Middleware (CORS, parsing, etc.)
    ↓
[4] Route Matching (find appropriate controller)
    ↓
[5] Guards execute (authentication, authorization)
    ↓
[6] Interceptors BEFORE (logging, timing, etc.)
    ↓
[7] Pipes execute (validation, transformation)
    ↓
[8] Controller method executes
    ↓
[9] Service layer executes
    ↓
[10] Interceptors AFTER (response transformation)
    ↓
[11] Exception Filters catch errors
    ↓
[12] HTTP Response returned
```

### Detailed Breakdown

#### Stage 1-2: HTTP Reception

```typescript
// src/main.ts
const app = await NestFactory.create(AppModule);
// Creates Express server with NestJS platform adapter
```

#### Stage 3: Global Middleware

```typescript
app.use((req, res, next) => {
  console.log(`[${Date.now()}] ${req.method} ${req.url}`);
  next();
});
```

#### Stage 4: Route Matching

NestJS scans decorators:

```typescript
@Controller()               // Route prefix
@Get()                     // HTTP method
@Get('/hello')             // Specific route
```

#### Stage 5: Guards

```typescript
@UseGuards(AuthGuard('jwt'))  // Runs before business logic
getProtected() {}
```

#### Stage 6: Before Interceptors

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before handler');
    return next.handle().pipe(tap(() => console.log('After handler')));
  }
}
```

#### Stage 7: Pipes

```typescript
@Get(':id')
getUser(@Param('id', ParseIntPipe) id: number) {
  // Pipe validates/transforms id to number
}
```

#### Stage 8-9: Controller & Service

```typescript
@Get()
getHello(): string {
  return this.appService.getHello();  // Business logic here
}
```

#### Stage 11: Exception Filters

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      message: exception.getResponse(),
    });
  }
}
```

---

## Dependency Injection Deep Dive

### How NestJS DI Works

#### Phase 1: Scanning

At startup, NestJS scans modules for decorated classes:

```typescript
// NestJS finds these:
@Module({
  controllers: [AppController], // Controllers to instantiate
  providers: [AppService], // Services to instantiate
})
export class AppModule {}
```

#### Phase 2: Resolution

NestJS analyzes constructor parameters:

```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    // NestJS sees AppService is needed
  }
}
```

#### Phase 3: Instantiation

NestJS creates instances in dependency order:

```typescript
// Step 1: Create AppService instance
const appService = new AppService();

// Step 2: Create AppController, inject AppService
const appController = new AppController(appService);
```

#### Phase 4: Registration

NestJS stores in internal registry:

```typescript
// Pseudo-code
const container = {
  AppService: appServiceInstance,
  AppController: appControllerInstance,
};
```

### Lifecycle Scopes

#### Singleton (Default)

```typescript
@Injectable({ scope: Scope.DEFAULT }) // or just @Injectable()
export class AppService {}

// Single instance for entire application lifetime
// Shared across all requests
```

**When to Use**:

- Stateless services
- Database connection pools
- Configuration managers
- Expensive-to-create services

**Risk**: Shared mutable state can cause issues

#### Request-Scoped

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestService {}

// New instance per HTTP request
// Safe for request-specific data
```

**When to Use**:

- Request context (user, session)
- Request-specific logging
- Per-request tracking

**Cost**: More memory, slower (new instance per request)

#### Transient

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}

// New instance every time it's injected
// Most memory/CPU intensive
```

**When to Use**:

- Rarely needed
- Stateful services that can't be shared
- Testing purposes

---

## Module System

### Module Structure

```typescript
@Module({
  imports: [DatabaseModule, CacheModule], // Dependencies
  controllers: [AppController], // HTTP handlers
  providers: [AppService], // Business logic
  exports: [AppService], // Public API
})
export class AppModule {}
```

### Module Dependencies

```
AppModule
├── imports: [DatabaseModule]
│   └── provides: DatabaseService
├── providers: [AppService]
│   └── depends on: DatabaseService
└── controllers: [AppController]
    └── depends on: AppService
```

### Feature Modules

When scaled, organize by feature:

```
src/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── products/
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── products.module.ts
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
│
├── shared/
│   ├── database/
│   ├── cache/
│   └── shared.module.ts
│
└── app.module.ts
```

**Benefits**:

- Encapsulation per feature
- Easy to understand dependencies
- Supports lazy loading
- Enables microservice extraction

---

## Design Pattern Analysis

### Why These Patterns?

#### Dependency Injection

**Problem**: Tight coupling

```typescript
// ❌ Tightly coupled
export class AppController {
  private appService = new AppService(); // Hard-coded dependency
}
```

**Solution**: Inject

```typescript
// ✅ Loosely coupled
@Controller()
export class AppController {
  constructor(private appService: AppService) {} // Injected
}
```

**Benefits**:

- Easy mocking for tests
- Easy to swap implementations
- Centralized configuration

#### Service Layer

**Problem**: Business logic in controllers

```typescript
// ❌ HTTP and business logic mixed
@Get('/hello')
getHello() {
  const greeting = 'Hello ' + computeUserName();  // Business logic here
  return greeting;
}
```

**Solution**: Delegate to service

```typescript
// ✅ Separation of concerns
@Get('/hello')
getHello() {
  return this.appService.getHello();  // Service handles business logic
}
```

**Benefits**:

- Reusable logic
- Testable without HTTP
- Clean code separation

---

## Extensibility Patterns

### Adding a Database

```typescript
// 1. Create repository
@Injectable()
export class UserRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<User[]> {
    return this.db.query('SELECT * FROM users');
  }
}

// 2. Update service to use repository
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

// 3. Update controller
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.getAllUsers();
  }
}

// 4. Register in module
@Module({
  providers: [UserRepository, UserService],
  controllers: [UserController],
})
export class UserModule {}
```

### Adding Authentication

```typescript
// 1. Create auth service
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  sign(payload: any): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): any {
    return this.jwtService.verify(token);
  }
}

// 2. Create guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;

    try {
      request.user = this.authService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}

// 3. Use guard on routes
@Get('/protected')
@UseGuards(JwtAuthGuard)
getProtected(@Request() req) {
  return `Hello ${req.user.username}`;
}
```

### Adding Caching

```typescript
// 1. Configure cache
@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // Max 100 entries
    }),
  ],
})
export class AppModule {}

// 2. Use cache in service
@Injectable()
export class AppService {
  constructor(private cacheManager: Cache) {}

  async getHello(): Promise<string> {
    const cached = await this.cacheManager.get('hello');
    if (cached) return cached;

    const result = 'Hello World!';
    await this.cacheManager.set('hello', result, 300);
    return result;
  }
}
```

---

## Error Handling Architecture

### Exception Filters

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.getResponse(),
    });
  }
}
```

### Register Globally

```typescript
// src/main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

### Custom Exceptions

```typescript
export class NotFoundError extends HttpException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

// Usage
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.userService.findById(id);
  if (!user) throw new NotFoundError('User');
  return user;
}
```

---

## Testing Architecture

### Unit Test Pattern

```typescript
describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService(); // Direct instantiation
  });

  it('should return greeting', () => {
    const result = service.getHello();
    expect(result).toBe('Hello World!');
  });
});
```

### Integration Test Pattern

```typescript
describe('AppController', () => {
  let app: TestingModule;
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = app.get<AppController>(AppController);
    service = app.get<AppService>(AppService);
  });

  it('should delegate to service', () => {
    jest.spyOn(service, 'getHello').mockReturnValue('Mocked');
    expect(controller.getHello()).toBe('Mocked');
  });
});
```

### E2E Test Pattern

```typescript
describe('API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET / should return 200', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

---

## Performance Characteristics

### Memory Profile

| Component        | Size    | Notes             |
| ---------------- | ------- | ----------------- |
| Node.js runtime  | ~50 MB  | Baseline          |
| NestJS framework | ~20 MB  | Includes Express  |
| Compiled code    | ~5 MB   | Depends on source |
| Dependencies     | ~100 MB | node_modules      |
| Running process  | ~150 MB | Typical           |

### Startup Time

```
Application Startup Phases:
├── Module loading: ~50ms
├── Provider instantiation: ~100ms
├── Route registration: ~50ms
├── Listen: ~100ms
└── Total: ~300ms
```

### Request Latency

```
Request Processing:
├── HTTP parsing: ~0.1ms
├── Route matching: ~0.1ms
├── Guards: ~0.1ms
├── Pipes: ~0.1ms
├── Business logic: Variable
├── Serialization: ~0.1ms
└── Network overhead: ~1-10ms
```

---

## Future Architecture Improvements

### Microservices

```typescript
// Separate service for users
@Controller('/users')
@UseFilters(HttpExceptionFilter)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.getAll();
  }
}

// Run as separate NestJS app:
// PORT=3001 node dist/user-service/main.js
```

### Event-Driven

```typescript
// Event publisher
@Injectable()
export class UserService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.userRepository.create(dto);
    this.eventEmitter.emit('user.created', user);  // Emit event
    return user;
  }
}

// Event listener
@EventListener('user.created')
async onUserCreated(user: User) {
  await this.emailService.sendWelcomeEmail(user.email);
  await this.analyticsService.trackEvent('user_signup', user);
}
```

### GraphQL

```typescript
// Replace REST controllers with GraphQL
@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users() {
    return this.userService.getAll();
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2024
