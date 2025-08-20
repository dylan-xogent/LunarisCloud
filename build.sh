#!/bin/bash

# LunarisCloud Build Script
# This script sets up the entire LunarisCloud project

set -e

echo "🚀 Starting LunarisCloud build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

print_success "pnpm version: $(pnpm --version)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Docker version: $(docker --version)"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker Compose version: $(docker-compose --version)"

print_success "All prerequisites are satisfied!"

# Install dependencies
print_status "Installing dependencies..."
pnpm install

print_success "Dependencies installed successfully!"

# Build shared packages
print_status "Building shared packages..."

print_status "Building @lunariscloud/types..."
cd packages/types
pnpm build
cd ../..

print_status "Building @lunariscloud/ui..."
cd packages/ui
pnpm build
cd ../..

print_success "Shared packages built successfully!"

# Build applications
print_status "Building applications..."

print_status "Building API..."
cd apps/api
pnpm build
cd ../..

print_status "Building Web app..."
cd apps/web
pnpm build
cd ../..

print_success "Applications built successfully!"

# Setup environment
print_status "Setting up environment..."

if [ ! -f .env ]; then
    print_warning "No .env file found. Creating from template..."
    cp env.example .env
    print_warning "Please edit .env file with your configuration before starting services."
else
    print_success ".env file already exists."
fi

# Generate Prisma client
print_status "Generating Prisma client..."
cd apps/api
pnpm prisma generate
cd ../..

print_success "Prisma client generated!"

# Build Docker images
print_status "Building Docker images..."
docker-compose build

print_success "Docker images built successfully!"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/minio
mkdir -p logs

print_success "Directories created!"

# Display next steps
echo ""
print_success "🎉 LunarisCloud build completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Run 'docker-compose up -d' to start all services"
echo "3. Run 'pnpm prisma migrate dev' to set up the database"
echo "4. Access the application at http://localhost:3000"
echo ""
print_status "Useful commands:"
echo "- Start services: docker-compose up -d"
echo "- Stop services: docker-compose down"
echo "- View logs: docker-compose logs -f"
echo "- Development: pnpm dev"
echo "- Build: pnpm build"
echo ""

print_success "Happy coding! 🚀"
