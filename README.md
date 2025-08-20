# LunarisCloud

A production-ready, self-hosted Google Drive-style file storage service built with Next.js, NestJS, and TypeScript. Perfect for individuals, teams, and organizations who want complete control over their file storage infrastructure.

## 🚀 Features

### Core Functionality
- **File Management**: Upload, download, organize files and folders with drag-and-drop
- **User Authentication**: Secure JWT-based authentication with email verification
- **File Sharing**: Create shareable links with password protection, expiration dates, and download limits
- **Storage Quotas**: Configurable storage limits per user (15GB free tier, 100GB pro tier)
- **Trash Management**: Soft delete with 30-day retention and restore functionality

### Security & Safety
- **Virus Scanning**: Automatic ClamAV integration for malware detection
- **Rate Limiting**: Configurable rate limits to prevent abuse
- **Audit Logging**: Comprehensive audit trail for all user actions
- **Password Protection**: Optional password protection for shared files
- **Expiration Controls**: Set expiration dates for shared content

### Modern Architecture
- **API-First Design**: RESTful API built with NestJS for easy integration
- **Real-time Processing**: Background job processing with BullMQ and Redis
- **Scalable Storage**: S3-compatible storage with MinIO
- **Health Monitoring**: Built-in health checks and metrics
- **Containerized**: Full Docker support for easy deployment

### User Experience
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Progressive Web App**: Works offline and installs like a native app
- **Mobile Responsive**: Optimized for all device sizes
- **Dark Mode**: Built-in dark/light theme support
- **File Preview**: Preview common file types in the browser

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Query** - Server state management

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queues
- **BullMQ** - Background job processing

### Infrastructure
- **Docker** - Containerization
- **MinIO** - S3-compatible object storage
- **ClamAV** - Virus scanning
- **Caddy** - Reverse proxy with automatic HTTPS
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **pnpm** (for development)
- **Docker** and **Docker Compose** (for production)
- **PostgreSQL 16+** (or use included Docker image)
- **Redis 7+** (or use included Docker image)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
```bash
git clone https://github.com/dylan-xogent/lunariscloud.git
cd lunariscloud
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your settings
```

3. **Start all services:**
```bash
docker-compose up -d
```

4. **Initialize database:**
```bash
docker-compose exec api pnpm prisma:migrate:deploy
docker-compose exec api pnpm prisma:seed
```

5. **Access the application:**
- 🌐 Web UI: http://localhost:3000
- 🔌 API: http://localhost:4000
- 📦 MinIO Console: http://localhost:9001

### Option 2: Local Development

1. **Install dependencies:**
```bash
pnpm install
```

2. **Setup database:**
```bash
cd apps/api
pnpm prisma:migrate:dev
pnpm prisma:seed
```

3. **Start services:**
```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Web
cd apps/web && pnpm dev

# Terminal 3: Worker
cd apps/worker && pnpm dev
```

## 📚 Documentation

- **[Development Guide](DEVELOPMENT.md)** - Setup and development workflow
- **[Deployment Guide](docs/DEPLOY.md)** - Production deployment instructions
- **[API Documentation](API.md)** - Complete API reference
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │   NestJS API    │    │  Worker (BullMQ)│
│   (Port 3000)   │◄──►│   (Port 4000)   │◄──►│   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │      Redis      │    │     MinIO       │
│   (Database)    │    │   (Cache/Jobs)  │    │  (File Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     ClamAV      │
                       │ (Virus Scanner) │
                       └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
API_SECRET=your-super-secure-api-secret-min-32-chars

# Storage
FREE_TIER_QUOTA_BYTES=16106127360  # 15GB
MAX_FILE_SIZE_BYTES=5368709120     # 5GB

# Rate Limiting
RATE_LIMIT_AUTH=5      # Login attempts per minute
RATE_LIMIT_UPLOAD=60   # Uploads per minute
RATE_LIMIT_DOWNLOAD=120 # Downloads per minute
```

### Storage Options

- **MinIO** (included) - Self-hosted S3-compatible storage
- **AWS S3** - Cloud storage
- **DigitalOcean Spaces** - S3-compatible cloud storage
- **Backblaze B2** - Cost-effective cloud storage

## 🚀 Deployment Options

### Self-Hosted
- **Docker Compose** - Single server deployment
- **Kubernetes** - Scalable container orchestration
- **Windows** - Native Windows deployment

### Cloud Platforms
- **AWS** - ECS/Fargate, EC2, or Lambda
- **DigitalOcean** - App Platform or Droplets
- **Railway** - Simple cloud deployment
- **Render** - Managed platform deployment

## 🔒 Security Features

- **Virus Scanning**: Automatic malware detection with ClamAV
- **Rate Limiting**: Configurable limits to prevent abuse
- **Audit Logging**: Complete audit trail for compliance
- **Password Protection**: Optional encryption for shared files
- **HTTPS Only**: Secure communication with automatic SSL
- **Input Validation**: Comprehensive validation with Zod
- **SQL Injection Protection**: ORM-based queries with Prisma

## 📊 Monitoring & Health

Built-in monitoring endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system health
- `GET /metrics` - Prometheus-compatible metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/dylan-xogent/lunariscloud/issues)
- 💬 [Discussions](https://github.com/dylan-xogent/lunariscloud/discussions)
- 📧 [Email Support](mailto:support@lunariscloud.com)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [NestJS](https://nestjs.com/) - Node.js framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MinIO](https://min.io/) - Object storage
- [ClamAV](https://www.clamav.net/) - Virus scanner

---

**LunarisCloud** - Your files, your control, your cloud. ☁️
