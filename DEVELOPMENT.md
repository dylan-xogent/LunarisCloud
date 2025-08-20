# Development Guide

This guide will help you set up the LunarisCloud development environment and contribute to the project.

## 🛠️ Development Environment Setup

### Prerequisites

1. **Node.js 18+**
   ```bash
   # Check your Node.js version
   node --version
   npm --version
   ```

2. **pnpm Package Manager**
   ```bash
   # Install pnpm globally
   npm install -g pnpm
   
   # Verify installation
   pnpm --version
   ```

3. **Docker and Docker Compose**
   ```bash
   # Install Docker Desktop or Docker Engine
   # Verify installation
   docker --version
   docker-compose --version
   ```

4. **Git**
   ```bash
   # Verify Git installation
   git --version
   ```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lunariscloud
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies for the monorepo
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit the .env file with your configuration
   # See Environment Configuration section below
   ```

4. **Start development services**
   ```bash
   # Start PostgreSQL, Redis, and MinIO
   docker-compose up -d db redis minio
   
   # Wait for services to be ready (about 30 seconds)
   ```

5. **Set up the database**
   ```bash
   # Navigate to the API directory
   cd apps/api
   
   # Generate Prisma client
   pnpm prisma generate
   
   # Push the schema to the database
   pnpm prisma db push
   
   # Seed the database with initial data
   pnpm prisma db seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Start the API server
   cd apps/api
   pnpm dev
   
   # Terminal 2: Start the web application
   cd apps/web
   pnpm dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - MinIO Console: http://localhost:9001 (admin/admin)
   - PostgreSQL: localhost:5432

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://lunaris:password@localhost:5432/lunariscloud"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# S3/MinIO Configuration
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="lunariscloud"
S3_REGION="us-east-1"

# Email Configuration (for user verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@lunariscloud.com"

# Application Configuration
NODE_ENV="development"
API_PORT="3001"
WEB_PORT="3000"
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Admin user for seeding (optional)
ADMIN_EMAIL="admin@lunariscloud.com"
ADMIN_PASSWORD="admin123"
```

### Email Setup for Development

For email verification to work, you need to configure SMTP:

1. **Gmail Setup** (recommended for development):
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in `SMTP_PASS`

2. **Alternative: Use a service like Mailtrap**:
   ```env
   SMTP_HOST="smtp.mailtrap.io"
   SMTP_PORT="2525"
   SMTP_USER="your-mailtrap-user"
   SMTP_PASS="your-mailtrap-password"
   ```

## 📁 Project Structure

```
lunariscloud/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── files/          # File management
│   │   │   ├── folders/        # Folder management
│   │   │   ├── shares/         # Share functionality
│   │   │   ├── users/          # User management
│   │   │   ├── health/         # Health checks
│   │   │   ├── jobs/           # Scheduled jobs
│   │   │   ├── audit/          # Audit logging
│   │   │   ├── config/         # Configuration
│   │   │   └── main.ts         # Application entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Database seeding
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── auth/       # Authentication pages
│       │   │   ├── dashboard/  # Dashboard pages
│       │   │   ├── s/          # Public share pages
│       │   │   └── trash/      # Trash page
│       │   ├── components/     # React components
│       │   │   ├── ui/         # shadcn/ui components
│       │   │   ├── file-manager/
│       │   │   ├── upload/
│       │   │   └── shares/
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities and API client
│       │   └── utils/          # Helper functions
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components
├── docker-compose.yml          # Development services
├── Caddyfile                   # Reverse proxy configuration
├── build.sh                    # Build script
├── package.json                # Root package.json
└── pnpm-workspace.yaml         # Workspace configuration
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific apps
cd apps/api && pnpm test
cd apps/web && pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows using Playwright

### Writing Tests

1. **API Tests** (`apps/api/src/**/*.spec.ts`):
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { FilesService } from './files.service';

   describe('FilesService', () => {
     let service: FilesService;

     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [FilesService],
       }).compile();

       service = module.get<FilesService>(FilesService);
     });

     it('should be defined', () => {
       expect(service).toBeDefined();
     });
   });
   ```

2. **Frontend Tests** (`apps/web/src/**/*.test.tsx`):
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { FileItem } from './file-item';

   describe('FileItem', () => {
     it('renders file name correctly', () => {
       const file = { name: 'test.pdf', size: 1024 };
       render(<FileItem file={file} />);
       expect(screen.getByText('test.pdf')).toBeInTheDocument();
     });
   });
   ```

## 🔍 Debugging

### Backend Debugging

1. **VS Code Debug Configuration**:
   Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug API",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/apps/api/src/main.ts",
         "runtimeArgs": ["-r", "ts-node/register"],
         "env": {
           "NODE_ENV": "development"
         }
       }
     ]
   }
   ```

2. **Database Debugging**:
   ```bash
   # Access PostgreSQL directly
   docker-compose exec db psql -U lunaris -d lunariscloud
   
   # View Prisma Studio
   cd apps/api
   pnpm prisma studio
   ```

### Frontend Debugging

1. **React Developer Tools**: Install the browser extension
2. **Next.js Debug Mode**: Add `DEBUG=*` to environment variables
3. **Console Logging**: Use `console.log` and browser dev tools

## 📝 Code Style and Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type

### Code Formatting

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Commit Messages

Use conventional commit format:

```
type(scope): description

feat(auth): add email verification
fix(files): resolve upload progress issue
docs(readme): update setup instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🚀 Development Workflow

### Feature Development

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**:
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and create a pull request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Database Changes

1. **Update the schema** (`apps/api/prisma/schema.prisma`)
2. **Create a migration**:
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name description
   ```
3. **Update the seed file** if needed
4. **Test the changes**

### API Changes

1. **Update DTOs** in the appropriate module
2. **Update service methods**
3. **Update controller endpoints**
4. **Add tests**
5. **Update API documentation**

### Frontend Changes

1. **Update components** in the appropriate directory
2. **Add new pages** if needed
3. **Update types** if API changed
4. **Add tests**
5. **Update documentation**

## 🔧 Common Development Tasks

### Adding a New API Endpoint

1. **Create DTOs** (`apps/api/src/module/dto/`)
2. **Update service** (`apps/api/src/module/module.service.ts`)
3. **Update controller** (`apps/api/src/module/module.controller.ts`)
4. **Add tests**
5. **Update API documentation**

### Adding a New Frontend Page

1. **Create page component** (`apps/web/src/app/`)
2. **Add routing** (Next.js App Router handles this automatically)
3. **Add navigation** if needed
4. **Add tests**
5. **Update documentation**

### Database Schema Changes

1. **Update Prisma schema** (`apps/api/prisma/schema.prisma`)
2. **Generate migration**:
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name description
   ```
3. **Update seed file** if needed
4. **Test the changes**

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**:
   ```bash
   # Restart database
   docker-compose restart db
   # Check logs
   docker-compose logs db
   ```

3. **MinIO issues**:
   ```bash
   # Restart MinIO
   docker-compose restart minio
   # Check bucket exists
   docker-compose exec minio mc ls /lunariscloud
   ```

4. **Dependencies issues**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules
   pnpm install
   ```

### Getting Help

1. **Check the logs**:
   ```bash
   docker-compose logs -f
   ```

2. **Check the documentation**
3. **Search existing issues**
4. **Create a new issue** with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

Happy coding! 🚀
