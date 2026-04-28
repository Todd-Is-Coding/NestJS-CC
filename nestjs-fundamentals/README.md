# NestJS Fundamentals - Complete Documentation

> A production-ready backend foundation demonstrating enterprise-grade NestJS architecture, clean code practices, and scalable system design patterns.

## Table of Contents

1. [Introduction](#introduction)
2. [Project Setup](#project-setup)
3. [Express Core Concepts](#express-core-concepts)
4. [Routing Architecture](#routing-architecture)
5. [Middleware Deep Dive](#middleware-deep-dive)
6. [Request & Response Handling](#request--response-handling)
7. [Environment Configuration](#environment-configuration)
8. [MVC Architecture](#mvc-architecture)
9. [Production Folder Structure](#production-folder-structure)
10. [Validation Strategy](#validation-strategy)
11. [Authentication & Authorization](#authentication--authorization)
12. [Error Handling](#error-handling)
13. [Logging & Observability](#logging--observability)
14. [Security Best Practices](#security-best-practices)
15. [Database Integration](#database-integration)
16. [Performance Optimization](#performance-optimization)
17. [Testing Strategy](#testing-strategy)
18. [CI/CD Pipeline](#cicd-pipeline)
19. [Deployment](#deployment)
20. [Production Example Project](#production-example-project)

---

## Introduction

### What This Project Is

NestJS Fundamentals is a modern backend foundation built with NestJS—the progressive Node.js framework for building efficient, scalable, and maintainable server-side applications. This repository demonstrates enterprise software engineering best practices through a modular, testable, and production-ready architecture.

### Business Value

- **Scalability**: Modular architecture enables horizontal scaling and microservice decomposition
- **Maintainability**: Clean separation of concerns reduces technical debt and accelerates onboarding
- **Performance**: Optimized request lifecycle with potential for caching, async processing, and database optimization
- **Reliability**: Comprehensive testing strategy (unit, integration, e2e) ensures robustness
- **Developer Experience**: Type-safe development with TypeScript, instant compilation feedback, and hot-reload support

### Core Use Cases

This foundation serves as:

1. **Microservice Base**: Ready for decomposition into specialized services (users, products, orders, payments)
2. **API Gateway**: Potential foundation for aggregating multiple backend services
3. **Real-time Backend**: Extensible to WebSocket communication with NestJS WebSocket adapter
4. **Learning Platform**: Reference implementation for backend engineering best practices
5. **Rapid Prototyping**: Quick iteration on business logic without architectural overhead

### Architectural Philosophy

This project employs **dependency injection-driven modular architecture** with clear separation between:

- **Presentation Layer**: HTTP controllers handling request/response
- **Business Logic Layer**: Services encapsulating domain logic
- **Infrastructure Layer**: Database access, external APIs, caching (when added)

---

## Project Setup

### Quick Start

#### Prerequisites

- Node.js >= 18.x
- npm >= 9.x or yarn >= 3.x
- TypeScript 5.7.x

#### Local Development

```bash
# Clone repository
git clone <repository-url>
cd nestjs-fundamentals

# Install dependencies
npm install

# Start development server with hot-reload
npm run start:dev

# Server runs on http://localhost:3000
```

#### Verify Installation

```bash
# Test basic endpoint
curl http://localhost:3000

# Response: "Hello World!"
```

#### Build & Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start:prod

# Run production build with custom port
PORT=8080 npm run start:prod
```

---

## Express Core Concepts

### What is Express

Express is a minimal HTTP server framework for Node.js. NestJS uses Express as the underlying HTTP adapter by default.

### Key Express Concepts Used

#### 1. **Middleware**

```typescript
// Express middleware pattern
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass to next middleware
});
```

#### 2. **Request/Response Cycle**

```
Incoming Request
    ↓
Middleware Stack
    ↓
Route Handler
    ↓
Business Logic
    ↓
Response Sent
```

#### 3. **Route Handlers**

```typescript
// Express style
app.get('/', (req, res) => {
  res.send('Hello World');
});

// NestJS wrapper
@Get()
getHello(): string {
  return 'Hello World';
}
```

#### 4. **Error Handling**

```typescript
// Express error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// NestJS exception filters
@Catch(HttpException)
export class HttpExceptionFilter {}
```

### Why NestJS Over Express

| Feature           | Express | NestJS   |
| ----------------- | ------- | -------- |
| Type Safety       | ❌      | ✅       |
| Structure         | ❌      | ✅       |
| DI Container      | ❌      | ✅       |
| Decorators        | ❌      | ✅       |
| Modularity        | ⚠️      | ✅       |
| Testing Support   | ⚠️      | ✅       |
| Learning Curve    | Easy    | Moderate |

---

## Routing Architecture

### Route Definition

```typescript
@Controller('/api/v1')  // Base path
export class AppController {
  @Get()              // GET /api/v1
  getRoot() {}

  @Get('/hello')      // GET /api/v1/hello
  getHello() {}

  @Get(':id')         // GET /api/v1/:id (path parameter)
  getById(@Param('id') id: string) {}

  @Get('/search')     // GET /api/v1/search?query=...
  search(@Query('query') query: string) {}

  @Post()             // POST /api/v1
  create(@Body() data: any) {}

  @Put(':id')         // PUT /api/v1/:id
  update(@Param('id') id: string, @Body() data: any) {}

  @Delete(':id')      // DELETE /api/v1/:id
  delete(@Param('id') id: string) {}

  @Patch(':id')       // PATCH /api/v1/:id
  patch(@Param('id') id: string, @Body() data: any) {}
}
```

### Route Priorities

Routes are matched in order. More specific routes should be defined first:

```typescript
@Get('/users/me')       // Specific - define first
getMyProfile() {}

@Get('/users/:id')      // General - define second
getUser(@Param('id') id: string) {}
```

### Parameter Extraction

```typescript
@Get(':id')
getById(
  @Param('id') id: string,           // URL parameter
  @Query('filter') filter: string,   // Query string
  @Body() body: CreateDto,           // Request body
  @Headers('authorization') auth: string, // Headers
  @Request() req: Request            // Full request object
) {}
```

---

## Middleware Deep Dive

### What is Middleware

Middleware is code that runs before route handlers. It can:

- Modify request/response
- End the request
- Pass to next middleware

### Middleware Execution Order

```
Request
   ↓
[1] Global Middleware
   ↓
[2] Module-level Middleware
   ↓
[3] Controller-level Middleware
   ↓
[4] Route Handler
```

### Built-in Middleware

```typescript
import { NestMiddleware } from '@nestjs/common';

export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${Date.now()}] ${req.method} ${req.url}`);
    next();
  }
}

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

### Common Middleware Patterns

```typescript
// 1. CORS Middleware
app.enableCors({
  origin: 'http://localhost:3000',
});

// 2. Body Parser
app.use(express.json());
app.use(express.urlencoded());

// 3. Compression
app.use(compression());

// 4. Request Timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`Request took ${Date.now() - start}ms`);
  });
  next();
});

// 5. Authentication
app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = verify(token);
  next();
});
```

---

## Request & Response Handling

### Request Object

```typescript
@Get()
handleRequest(@Request() req) {
  // Access request properties
  console.log(req.method);              // 'GET'
  console.log(req.url);                 // '/api/users'
  console.log(req.headers);             // { authorization: '...' }
  console.log(req.query);               // { page: '1' }
  console.log(req.body);                // POST/PUT body
  console.log(req.params);              // Route params
}
```

### Response Object

```typescript
@Get()
handleResponse(@Response() res) {
  res.status(200);              // Status code
  res.setHeader('X-Custom', 'value');  // Headers
  res.json({ data: 'value' });  // Send JSON
  res.send('text');             // Send text
  res.redirect('/other');       // Redirect
  res.download('file.pdf');     // Download file
  res.sendFile('file.html');    // Send file
}
```

### Response Decorators

```typescript
@Get()
@HttpCode(200)           // Set status code
@Header('Cache-Control', 'none')  // Add header
getHello(): string {
  return 'Hello World';
}

// Automatic JSON serialization
@Get()
getJson() {
  return { message: 'Hello' };
  // Automatically sent as JSON
}

// Streaming responses
@Get('file')
getFile(@Response() res) {
  const file = fs.createReadStream('large-file.pdf');
  file.pipe(res);
}
```

### Content Negotiation

```typescript
// Respond with different formats
@Get()
@Header('Content-Type', 'application/json')
getJson() {
  return { data: 'json' };
}

@Get()
@Header('Content-Type', 'text/plain')
getText() {
  return 'plain text';
}

@Get()
@Header('Content-Type', 'text/html')
getHtml() {
  return '<h1>HTML</h1>';
}
```

---

## Environment Configuration

### Using Environment Variables

```typescript
// Development (.env.local)
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost/nestjs_dev
JWT_SECRET=dev-secret

// Production (.env.production)
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://prod.db/nestjs_prod
JWT_SECRET=<secure-secret>
```

### Load Environment Variables

```typescript
// src/main.ts
import * as dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
```

### Validation

```bash
npm install @nestjs/config joi
```

```typescript
// src/env.ts
import { plainToClass } from 'class-transformer';
import { IsNumber, IsString, validate } from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  NODE_ENV: 'development' | 'production' = 'development';

  @IsString()
  JWT_SECRET: string;
}

export async function validateEnv(config: Record<string, any>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config);
  const errors = await validate(validatedConfig);

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors}`);
  }

  return validatedConfig;
}
```

---

## MVC Architecture

### What is MVC

MVC separates applications into three layers:

- **Model**: Data and business logic
- **View**: User interface (front-end in our case)
- **Controller**: Request handling

### MVC in NestJS

```typescript
// Model Layer
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}

// Business Logic (Service)
@Injectable()
export class UserService {
  async getUser(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
}

// View/Controller Layer
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUser(id);
  }
}
```

### Benefits

- **Separation of Concerns**: Each layer has single responsibility
- **Testability**: Each layer can be tested independently
- **Reusability**: Services can be used in multiple controllers
- **Maintainability**: Changes to one layer don't affect others

---

## Production Folder Structure

```
nestjs-fundamentals/
├── src/
│   ├── common/                    # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── guards/               # Authorization guards
│   │   ├── filters/              # Exception filters
│   │   ├── interceptors/         # Interceptors
│   │   └── pipes/                # Validation pipes
│   │
│   ├── config/                   # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── env.validation.ts
│   │
│   ├── modules/                  # Feature modules
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   ├── products/
│   │   ├── orders/
│   │   └── auth/
│   │
│   ├── database/                 # Database setup
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── data-source.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── scripts/
│   ├── seed-db.ts
│   └── migrate.ts
│
└── .github/
    └── workflows/
        └── ci-cd.yml
```

---

## Validation Strategy

### Input Validation

```bash
npm install class-validator class-transformer
```

#### DTOs (Data Transfer Objects)

```typescript
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @Matches(/^[A-Z][a-z]+$/, {
    message: 'Name must start with capital letter',
  })
  password: string;
}

// Nested validation
export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;
}
```

#### Global Validation Pipe

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation on all endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unknown properties
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true,            // Auto-transform payloads
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
```

#### Controller Usage

```typescript
@Controller('/users')
export class UserController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // Automatically validated before reaching handler
    return this.userService.create(createUserDto);
  }
}
```

#### Custom Validators

```typescript
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueEmail', async: true })
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private userService: UserService) {}

  async validate(value: string) {
    const user = await this.userService.findByEmail(value);
    return !user; // Valid if no user found
  }

  defaultMessage() {
    return 'Email already exists';
  }
}

// Use in DTO
export class CreateUserDto {
  @Validate(IsUniqueEmailConstraint)
  email: string;
}
```

---

## Authentication & Authorization

### JWT Authentication

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

#### 1. Auth Module

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

#### 2. Auth Service

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    // Check credentials
    const user = await this.userService.findByEmail(email);

    if (user && (await this.comparePasswords(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    // Use bcrypt in production
    const bcrypt = require('bcrypt');
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

#### 3. JWT Strategy

```typescript
// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

#### 4. Auth Guard

```typescript
// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### 5. Protected Routes

```typescript
// src/app.controller.ts
@UseGuards(JwtAuthGuard)
@Get('/protected')
getProtected(@Request() req) {
  return `Hello ${req.user.email}, your ID is ${req.user.id}`;
}
```

### Role-Based Authorization

```typescript
// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// Usage
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Delete('/users/:id')
async deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

---

## Error Handling

### Exception Filters

```typescript
// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getMessage();
    }

    // Log error
    this.logger.error(
      `Error in ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

#### Register Global Filter

```typescript
// src/main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

#### Custom Exceptions

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Usage
if (userExists) {
  throw new UserAlreadyExistsException(email);
}
```

---

## Logging & Observability

### Built-in Logger

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  getUser(id: string) {
    this.logger.log(`Getting user ${id}`);
    this.logger.debug(`Debug info`);
    this.logger.warn(`Warning`);
    this.logger.error(`Error occurred`);
    this.logger.verbose(`Verbose info`);
  }
}
```

### Structured Logging with Winston

```bash
npm install winston winston-daily-rotate-file
```

```typescript
// src/config/logger.ts
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}] ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`,
        ),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

---

## Security Best Practices

### 1. Input Validation

```typescript
// ✅ Always validate input
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^[A-Za-z0-9@$!%*?&]{8,}$/)
  password: string;
}
```

### 2. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 3600,
});
```

### 3. Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // Time window in ms
        limit: 100,  // Max requests per time window
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 4. Helmet (Security Headers)

```bash
npm install @nestjs/helmet
```

```typescript
import { HelmetModule } from '@nestjs/helmet';

@Module({
  imports: [HelmetModule],
})
export class AppModule {}
```

### 5. Environment Variables

```typescript
// Validate env vars at startup
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

### 6. Password Hashing

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

```typescript
import * as bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

### 7. Security Checklist

- [ ] Input validation on all endpoints
- [ ] Authentication enabled (JWT/OAuth2)
- [ ] Authorization (RBAC) implemented
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet headers enabled
- [ ] Environment variable validation
- [ ] HTTPS/TLS configured
- [ ] Passwords hashed (bcrypt)
- [ ] Secrets stored securely (not in code)
- [ ] Error messages don't expose internals
- [ ] Dependencies scanned for vulnerabilities

---

## Database Integration

### TypeORM Setup

```bash
npm install @nestjs/typeorm typeorm pg
```

#### Configuration

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME || 'nestjs_db',
      entities: [User],
      synchronize: process.env.NODE_ENV === 'development', // Auto-sync schema
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class DatabaseModule {}
```

#### Entity Definition

```typescript
// src/database/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Repository Usage

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

---

## Performance Optimization

### 1. Caching

```bash
npm install @nestjs/cache-manager cache-manager
```

```typescript
// src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // Max 100 entries
    }),
  ],
})
export class AppModule {}
```

### 2. Query Optimization

```typescript
// Avoid N+1 queries
@Get()
async getUsers() {
  // ❌ Bad - N+1 query problem
  const users = await this.userRepository.find();
  const usersWithPosts = await Promise.all(
    users.map(async (user) => {
      const posts = await this.postsRepository.find({
        where: { userId: user.id },
      });
      return { ...user, posts };
    }),
  );

  // ✅ Good - single query with relations
  const users = await this.userRepository.find({
    relations: ['posts'],
  });

  return users;
}
```

### 3. Database Connection Pooling

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  poolSize: 10,
  maxConnections: 20,
  connectionTimeoutMillis: 10000,
})
```

### 4. Response Compression

```typescript
import * as compression from 'compression';

app.use(compression());
```

### 5. Pagination

```typescript
// src/common/pagination.ts
export class PaginationDto {
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 10;
}

@Get()
async getUsers(@Query() { page, limit }: PaginationDto) {
  const skip = (page - 1) * limit;
  const [data, total] = await this.userRepository.findAndCount({
    skip,
    take: limit,
  });

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = 'Hello World!';
      jest.spyOn(service, 'getHello').mockReturnValue(result);

      expect(controller.getHello()).toBe(result);
    });
  });
});
```

### E2E Tests

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Authentication', () => {
    it('should reject unauthorized requests', () => {
      return request(app.getHttpServer())
        .get('/protected')
        .expect(401);
    });

    it('should accept valid JWT', () => {
      const token = 'valid.jwt.token';
      return request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nestjs_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nestjs_test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nestjs_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Build and push Docker image
        run: |
          docker build -t nestjs-fundamentals:${{ github.sha }} .
          docker push nestjs-fundamentals:${{ github.sha }}

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment commands here
```

---

## Deployment

### Docker Deployment

#### Dockerfile

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: nestjs-app
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_HOST: postgres
      DATABASE_URL: postgresql://nestjs:nestjs@postgres:5432/nestjs_db
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: nestjs-postgres
    environment:
      POSTGRES_DB: nestjs_db
      POSTGRES_USER: nestjs
      POSTGRES_PASSWORD: nestjs
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nestjs']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Cloud Deployment

#### AWS EC2

```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Clone repository
git clone <repo-url>
cd nestjs-fundamentals

# Install Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm ci --omit=dev

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/main.js --name "nestjs-app"
pm2 save
pm2 startup
```

#### Heroku

```bash
# Login
heroku login

# Create app
heroku create nestjs-fundamentals

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set DATABASE_URL=your-db-url

# Deploy
git push heroku main
```

---

## Production Example Project

### Full Example: User Management API

```typescript
// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;
}

// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^[A-Za-z0-9@$!%*?&]{8,}$/)
  password: string;
}

// src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const { password, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }
}

// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('/api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

---

## Contributing

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
npm run start:dev

# Test
npm test
npm run test:e2e

# Code quality
npm run lint
npm run format

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/your-feature
```

### Pull Request Guidelines

- Clear description of changes
- Tests passing
- Code coverage maintained
- Documentation updated

---

## Technology Stack

| Technology     | Version | Purpose                    |
| -------------- | ------- | -------------------------- |
| NestJS         | ^11.0.1 | Framework                  |
| Express        | ^4.18   | HTTP Server                |
| TypeScript     | ^5.7.3  | Type Safety                |
| Node.js        | 18+     | Runtime                    |
| Jest           | ^30.0.0 | Testing                    |
| PostgreSQL     | 15      | Database                   |
| TypeORM        | ^0.3    | ORM                        |
| JWT            | ^9      | Authentication             |
| Passport       | ^0.6    | Authentication Strategy    |

---

## License

UNLICENSED (Proprietary)

---

## Support

For issues, questions, or suggestions, please create an issue on GitHub.

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Maintained By**: Development Team
