# Security Best Practices

Comprehensive guide to securing the NestJS Fundamentals application.

---

## Overview

Security is a shared responsibility between the framework, library ecosystem, and application code. This document outlines security best practices for this NestJS application.

---

## Input Validation & Sanitization

### Current Status: ⚠️ Not Implemented

### Issue

```typescript
// ❌ Vulnerable
@Get('/hello')
sendHellotoUser(@Body('name') name: string) {
  return this.appService.sendHelloToUser(name);
  // No validation - could receive:
  // - '<img src=x onerror="alert(1)">' (XSS)
  // - 'admin\'; DROP TABLE users; --' (SQL injection)
  // - Extremely long strings (DoS)
  // - Null/undefined values
}
```

### Solution

```bash
npm install class-validator class-transformer
```

```typescript
// Create DTO with validation
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class GreetingDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  name: string;
}

// Use global pipes for automatic validation
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Reject unknown properties
  transform: true,           // Auto-transform payloads
  transformOptions: {
    enableImplicitConversion: true,
  },
}));

// Use in controller
@Get('/hello')
sendHellotoUser(@Body() dto: GreetingDto) {
  return this.appService.sendHelloToUser(dto.name);
  // Now validated and safe
}
```

### Validation Rules

| Scenario        | Validator                      | Example               |
| --------------- | ------------------------------ | --------------------- |
| Required fields | `@IsNotEmpty()`                | `name` field required |
| Type checking   | `@IsString()`, `@IsNumber()`   | `@IsNumber()`         |
| Length          | `@MinLength()`, `@MaxLength()` | `@MaxLength(100)`     |
| Patterns        | `@Matches(/regex/)`            | Email format          |
| Enums           | `@IsEnum()`                    | `@IsEnum(UserRole)`   |
| Custom          | `@ValidatorConstraint`         | Custom logic          |

---

## Authentication

### Current Status: ❌ Not Implemented

### JWT Authentication

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

#### Step 1: Auth Module

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
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

#### Step 2: Auth Service

```typescript
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  createToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload);
  }

  validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

#### Step 3: JWT Strategy

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
    return { id: payload.sub, email: payload.email };
  }
}
```

#### Step 4: Auth Guard

```typescript
// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### Step 5: Use in Controller

```typescript
// src/app.controller.ts
@UseGuards(JwtAuthGuard)
@Get('/protected')
getProtected(@Request() req) {
  return `Hello ${req.user.email}`;
}
```

---

## Authorization (RBAC)

### Role-Based Access Control

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
      return true;  // No roles required
    }

    const { user } = context.switchToHttp().getRequest();

    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// Usage in controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('/users/:id')
async deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

---

## CORS Configuration

### Current Status: ⚠️ Default Open (Vulnerable)

### Secure Configuration

```typescript
// src/main.ts
app.enableCors({
  // Restrict origins
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'https://yourdomain.com',
  ],

  // Allow credentials
  credentials: true,

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Exposed headers
  exposedHeaders: ['X-Total-Count'],

  // Cache preflight
  maxAge: 3600,
});
```

### Why Restrict CORS?

```typescript
// ❌ Vulnerable - allows any origin
app.enableCors(); // Exposes API to any website

// ✅ Secure - whitelist specific origins
app.enableCors({
  origin: ['https://trusted-domain.com'],
});
```

---

## Rate Limiting

### Current Status: ❌ Not Implemented

### Installation

```bash
npm install @nestjs/throttler
```

### Configuration

```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Apply to Routes

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Get()
getHello() {
  return this.appService.getHello();
}

// Different limits per endpoint
@UseGuards(ThrottlerGuard)
@Post('/login')
login(@Body() credentials: LoginDto) {
  // 10 attempts per minute for login
  return this.authService.login(credentials);
}
```

### Skip Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('/public')
public() {
  return 'Public data';
}
```

---

## HTTPS/TLS

### Current Status: ❌ Not Configured

### Development (Self-Signed)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### Production Setup

```typescript
// src/main.ts
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTPS options
  const httpsOptions = {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
  };

  // HTTP redirect to HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });

  // Start both HTTP and HTTPS
  await app.listen(process.env.PORT ?? 3000);
  https.createServer(httpsOptions, app.getHttpServer()).listen(443);
}

bootstrap();
```

### Let's Encrypt (Recommended)

```bash
# Using Certbot
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Key and cert paths:
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

---

## Environment Variable Security

### Current Status: ⚠️ Basic (No Validation)

### Secure Approach

```bash
npm install @nestjs/config joi
```

```typescript
// src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  NODE_ENV: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  DATABASE_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}

// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      validate,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### Secrets Management

Never commit secrets to git:

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

Use a secrets manager in production:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

---

## SQL Injection Prevention

### Current Status: N/A (No Database)

### When Adding Database

```typescript
// ✅ SAFE - Parameterized queries
const user = await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ UNSAFE - String concatenation
const user = await this.db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// With TypeORM (recommended)
const user = await this.userRepository.findOne({
  where: { id: userId },
});
```

---

## XSS Prevention

### Current Status: ⚠️ Vulnerable

### Issue

```typescript
// ❌ Vulnerable - User input reflected in response
@Get('/greet/:name')
greet(@Param('name') name: string) {
  return `<h1>Hello ${name}</h1>`;  // XSS vulnerability
}
```

### Solution

```typescript
// ✅ Safe - Content sanitized
import { sanitize } from 'dompurify';

@Get('/greet/:name')
greet(@Param('name') name: string) {
  const cleanName = sanitize(name);
  return { message: `Hello ${cleanName}` };  // Return JSON, not HTML
}

// Or use Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'"
  );
  next();
});
```

---

## CSRF Protection

### Configure CSRF

```bash
npm install @nestjs/csrf
```

```typescript
// src/main.ts
import { CsrfProtection } from '@nestjs/csrf';

app.use(CsrfProtection());
```

---

## Dependency Vulnerabilities

### Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Automatic security updates
npm install --save-dev npm-check-updates
ncu -u
npm install
```

### Continuous Monitoring

Use GitHub's Dependabot:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
```

---

## Logging Security Events

### Secure Logging

```typescript
// ❌ UNSAFE - Logs contain sensitive data
logger.log(`User ${user.email} password: ${user.password}`);

// ✅ SAFE - Only log relevant, non-sensitive info
logger.log({
  event: 'USER_LOGIN',
  userId: user.id,
  timestamp: new Date(),
  ip: request.ip,
});

// ✅ SAFE - Async/secure logging
logger.log({
  event: 'UNAUTHORIZED_ACCESS',
  userId: userId,
  endpoint: request.url,
  timestamp: new Date(),
});
```

---

## Security Headers

### Implement Security Headers

```typescript
// src/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: Function) {
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );

    // HSTS (HTTPS only)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    next();
  }
}

// src/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}
```

---

## Security Checklist

### Before Production

- [ ] Input validation on all endpoints
- [ ] Authentication implemented (JWT/OAuth2)
- [ ] Authorization (RBAC) implemented
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] HTTPS/TLS configured
- [ ] Environment variables validated
- [ ] Security headers implemented
- [ ] Secrets not in code/git
- [ ] Dependency vulnerabilities fixed (`npm audit`)
- [ ] Structured logging implemented
- [ ] Error messages don't leak internals
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection enabled
- [ ] Security scanning in CI/CD

### Continuous Security

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Regular security training
- [ ] Incident response plan
- [ ] Security monitoring/alerting

---

## Security Testing

### OWASP Top 10

| Vulnerability                               | Status             | Action               |
| ------------------------------------------- | ------------------ | -------------------- |
| Injection                                   | ⚠️ Risk            | Parameterize queries |
| Broken Auth                                 | ❌ Not Implemented | Add JWT auth         |
| Sensitive Data Exposure                     | ⚠️ Risk            | Use HTTPS, encrypt   |
| XML External Entities                       | ✅ N/A             | Monitor if parsing   |
| Broken Access Control                       | ⚠️ Risk            | Add RBAC             |
| Security Misconfiguration                   | ⚠️ Risk            | Review configs       |
| XSS                                         | ⚠️ Risk            | Sanitize input       |
| Insecure Deserialization                    | ✅ N/A             | Use JSON safely      |
| Using Components with Known Vulnerabilities | ⚠️ Risk            | npm audit            |
| Insufficient Logging & Monitoring           | ⚠️ Risk            | Add observability    |

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Document Version**: 1.0  
**Last Updated**: 2024
