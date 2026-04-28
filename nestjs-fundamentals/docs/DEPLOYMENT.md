# Deployment Guide

Complete guide for deploying NestJS Fundamentals to production and various environments.

---

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run start:dev

# Server available at http://localhost:3000
```

### Development Commands

```bash
# Format code
npm run format

# Lint and fix
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Debug mode
npm run start:debug
```

---

## Build Process

### Production Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Output in ./dist directory
ls -la dist/
```

### Build Output Structure

```
dist/
├── main.js              # Application entry point
├── app.controller.js
├── app.service.js
├── app.module.js
├── main.js.map         # Source maps
└── ...
```

### Build Optimizations

```json
{
  "compilerOptions": {
    "target": "ES2023", // Modern JavaScript target
    "module": "nodenext", // Node module system
    "removeComments": true, // Remove comments in build
    "declaration": true, // Generate .d.ts files
    "sourceMap": true, // Debug source mapping
    "outDir": "./dist", // Output directory
    "incremental": true, // Faster rebuilds
    "skipLibCheck": true, // Skip dependency type checking
    "esModuleInterop": true // Better CommonJS compatibility
  }
}
```

---

## Docker Deployment

### Dockerfile (Multi-stage Build)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/main.js"]
```

### Docker Build and Run

```bash
# Build image
docker build -t nestjs-fundamentals:latest .

# Run container
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  nestjs-fundamentals:latest

# Run with custom port
docker run -p 8080:3000 \
  -e PORT=3000 \
  nestjs-fundamentals:latest

# Run with volume mount (for persistent data)
docker run -p 3000:3000 \
  -v /path/to/logs:/app/logs \
  nestjs-fundamentals:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  # NestJS Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nestjs-app
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      PORT: 3000
      LOG_LEVEL: info
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs

  # PostgreSQL Database (when added)
  postgres:
    image: postgres:15-alpine
    container_name: nestjs-postgres
    environment:
      POSTGRES_DB: nestjs_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache (when added)
  redis:
    image: redis:7-alpine
    container_name: nestjs-redis
    ports:
      - '6379:6379'
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build

# Scale services
docker-compose up -d --scale app=3
```

---

## Environment Variables

### Development (.env.local)

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database (when added)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db

# Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=dev-secret-key-change-in-prod
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# API
API_VERSION=v1
API_TIMEOUT=30000
```

### Production (.env.production)

```bash
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Database
DATABASE_URL=${DATABASE_URL_SECRET}
DATABASE_MAX_CONNECTIONS=20
DATABASE_POOL_SIZE=10

# Cache
REDIS_URL=${REDIS_URL_SECRET}

# Security
JWT_SECRET=${JWT_SECRET_SECURE}
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com

# API
API_VERSION=v1
API_TIMEOUT=30000

# Logging
LOG_FORMAT=json
SENTRY_DSN=${SENTRY_DSN_SECRET}
```

### Loading Environment Variables

```bash
# Option 1: dotenv-cli
npm install dotenv-cli
dotenv -e .env.local npm run start:dev

# Option 2: Manual sourcing
source .env.production
npm run start:prod

# Option 3: Direct export
export NODE_ENV=production
export PORT=8080
npm run start:prod
```

---

## Cloud Deployments

### AWS EC2

```bash
# 1. SSH into instance
ssh -i key.pem ubuntu@your-ec2-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/your-org/nestjs-fundamentals.git
cd nestjs-fundamentals

# 4. Install dependencies
npm ci --omit=dev

# 5. Build
npm run build

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/main.js --name "nestjs-app"
pm2 save
pm2 startup

# 7. Configure nginx as reverse proxy
sudo apt-get install -y nginx

# Create /etc/nginx/sites-available/nestjs-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/nestjs-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Set up SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Docker on AWS ECS

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag nestjs-fundamentals:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nestjs-fundamentals:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nestjs-fundamentals:latest

# 2. Create ECS task definition
# See AWS docs for detailed task definition JSON

# 3. Deploy to ECS
aws ecs update-service --cluster your-cluster --service your-service --force-new-deployment
```

### Heroku

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Create app
heroku create your-app-name

# 3. Set buildpack
heroku buildpacks:set heroku/nodejs

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail

# 7. Scale dynos
heroku ps:scale web=2
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
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

      - name: Unit tests
        run: npm test

      - name: E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Coverage
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts

          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
            cd /app/nestjs-fundamentals
            git pull origin main
            npm ci --omit=dev
            npm run build
            pm2 restart nestjs-app
          EOF
```

---

## Monitoring & Logging

### Application Health

```typescript
// src/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private db: Database) {}

  @Get()
  async check() {
    const dbHealth = await this.checkDatabase();

    return {
      status: dbHealth ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealth ? 'UP' : 'DOWN',
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
```

### Structured Logging

```typescript
// src/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log({
          method: request.method,
          url: request.url,
          status: context.switchToHttp().getResponse().statusCode,
          duration,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }
}
```

### Error Tracking (Sentry)

```bash
npm install @sentry/node @sentry/tracing
```

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [new Tracing.Http({ request: true })],
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Performance Optimization

### Compression

```typescript
import * as compression from 'compression';

app.use(compression());
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
})
export class AppModule {}
```

### Caching

```typescript
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

---

## Scaling

### Load Balancing

```nginx
# /etc/nginx/nginx.conf
upstream app {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Horizontal Scaling with PM2

```bash
# Start multiple instances
pm2 start dist/main.js -i max --name "nestjs-app"

# Monitor
pm2 monit

# Restart all
pm2 restart all
```

---

## Disaster Recovery

### Database Backups

```bash
# PostgreSQL backup (when using)
pg_dump --host localhost --username postgres nestjs_db > backup.sql

# Restore
psql --host localhost --username postgres nestjs_db < backup.sql
```

### Application Backups

```bash
# Automated daily backup
0 2 * * * tar -czf /backups/nestjs-$(date +%Y%m%d).tar.gz /app/nestjs-fundamentals
```

### Failover Strategy

1. **Data**: Daily database snapshots to S3/GCS
2. **Code**: Git repository with all history
3. **Configuration**: Environment variables in secure vault
4. **Monitoring**: Alerts for any issues

---

## Troubleshooting

### Application Won't Start

```bash
# Check syntax errors
npm run build

# Check if port is in use
lsof -i :3000

# Check dependencies
npm ci
npm audit
```

### High Memory Usage

```bash
# Check heap size
node --max-old-space-size=2048 dist/main.js

# Profile with clinic
npm install clinic
clinic doctor -- node dist/main.js
```

### Slow Requests

```bash
# Enable query logging (database)
enable query logging in TypeORM

# Check request flow
Use application profiling tools
```

---

**Document Version**: 1.0  
**Last Updated**: 2024
