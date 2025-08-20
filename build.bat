@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting LunarisCloud build process...

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo [SUCCESS] Node.js version: 
node --version

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)

echo [SUCCESS] pnpm version:
pnpm --version

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

echo [SUCCESS] Docker version:
docker --version

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [SUCCESS] Docker Compose version:
docker-compose --version

echo [SUCCESS] All prerequisites are satisfied!

REM Install dependencies
echo [INFO] Installing dependencies...
pnpm install

echo [SUCCESS] Dependencies installed successfully!

REM Build shared packages
echo [INFO] Building shared packages...

echo [INFO] Building @lunariscloud/types...
cd packages\types
pnpm build
cd ..\..

echo [INFO] Building @lunariscloud/ui...
cd packages\ui
pnpm build
cd ..\..

echo [SUCCESS] Shared packages built successfully!

REM Build applications
echo [INFO] Building applications...

echo [INFO] Building API...
cd apps\api
pnpm build
cd ..\..

echo [INFO] Building Web app...
cd apps\web
pnpm build
cd ..\..

echo [SUCCESS] Applications built successfully!

REM Setup environment
echo [INFO] Setting up environment...

if not exist .env (
    echo [WARNING] No .env file found. Creating from template...
    copy env.example .env
    echo [WARNING] Please edit .env file with your configuration before starting services.
) else (
    echo [SUCCESS] .env file already exists.
)

REM Generate Prisma client
echo [INFO] Generating Prisma client...
cd apps\api
pnpm prisma generate
cd ..\..

echo [SUCCESS] Prisma client generated!

REM Build Docker images
echo [INFO] Building Docker images...
docker-compose build

echo [SUCCESS] Docker images built successfully!

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist data\postgres mkdir data\postgres
if not exist data\redis mkdir data\redis
if not exist data\minio mkdir data\minio
if not exist logs mkdir logs

echo [SUCCESS] Directories created!

REM Display next steps
echo.
echo [SUCCESS] 🎉 LunarisCloud build completed successfully!
echo.
echo [INFO] Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Run 'docker-compose up -d' to start all services
echo 3. Run 'pnpm prisma migrate dev' to set up the database
echo 4. Access the application at http://localhost:3000
echo.
echo [INFO] Useful commands:
echo - Start services: docker-compose up -d
echo - Stop services: docker-compose down
echo - View logs: docker-compose logs -f
echo - Development: pnpm dev
echo - Build: pnpm build
echo.

echo [SUCCESS] Happy coding! 🚀
