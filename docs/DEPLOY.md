# LunarisCloud Production Deployment Guide

This guide covers deploying LunarisCloud to production environments including Windows, Docker, and cloud hosting services.

## Prerequisites

- **Node.js 18+** and **pnpm** (for local development)
- **Docker** and **Docker Compose** (for containerized deployment)
- **PostgreSQL 16+** (or use the included Docker image)
- **Redis 7+** (or use the included Docker image)
- **MinIO** (or AWS S3-compatible storage)
- **ClamAV** (for virus scanning)

## Quick Start with Docker Compose

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/lunariscloud.git
cd lunariscloud
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your production values:

```bash
# Database
DATABASE_URL=postgresql://app:app@db:5432/lunaris

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
API_SECRET=your-super-secure-api-secret-min-32-chars

# Application
NODE_ENV=production
PORT=4000
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=userfiles
S3_REGION=us-east-1

# SMTP (Required for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Admin User (Optional)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# Rate Limiting
RATE_LIMIT_AUTH=5
RATE_LIMIT_UPLOAD=60
RATE_LIMIT_DOWNLOAD=120
RATE_LIMIT_ADMIN=30

# File Upload Limits
MAX_FILE_SIZE_BYTES=5368709120
MAX_FILE_SIZE_MB=5120
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f worker
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec api pnpm prisma:migrate:deploy

# Seed admin user (if configured)
docker-compose exec api pnpm prisma:seed
```

### 5. Setup MinIO Bucket

1. Access MinIO Console: http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Create bucket named `userfiles`
4. Enable versioning on the bucket
5. Set bucket policy for public read access (if needed)

## Windows Deployment

### Option 1: Docker Desktop

1. Install Docker Desktop for Windows
2. Follow the Docker Compose instructions above
3. Ensure WSL2 is enabled for better performance

### Option 2: Native Windows

1. Install Node.js 18+ and pnpm
2. Install PostgreSQL and Redis
3. Install ClamAV for Windows
4. Configure services to start automatically
5. Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Cloud Deployment

### AWS Deployment

#### Using ECS/Fargate

1. Create ECS cluster
2. Create task definitions for API, Worker, and Web
3. Set up Application Load Balancer
4. Configure RDS for PostgreSQL
5. Configure ElastiCache for Redis
6. Use S3 for file storage
7. Set up CloudWatch for monitoring

#### Using EC2

1. Launch EC2 instance
2. Install Docker and Docker Compose
3. Follow Docker Compose instructions
4. Set up security groups
5. Configure domain and SSL

### DigitalOcean Deployment

1. Create Droplet with Docker pre-installed
2. Follow Docker Compose instructions
3. Set up domain and SSL with Let's Encrypt
4. Configure firewall rules

### Railway Deployment

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Security Considerations

### 1. Environment Variables

- Use strong, unique secrets for JWT_SECRET and API_SECRET
- Rotate secrets regularly
- Never commit secrets to version control

### 2. Database Security

- Use strong database passwords
- Restrict database access to application servers only
- Enable SSL connections
- Regular backups

### 3. Network Security

- Use HTTPS everywhere
- Configure firewall rules
- Use VPN for admin access
- Rate limiting on all endpoints

### 4. File Security

- Enable virus scanning
- Set appropriate file size limits
- Monitor for suspicious uploads
- Regular security audits

## Monitoring and Maintenance

### Health Checks

Monitor these endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed health (requires auth)
- `GET /metrics` - Prometheus metrics

### Logs

```bash
# View application logs
docker-compose logs -f api
docker-compose logs -f worker

# View service logs
docker-compose logs -f db
docker-compose logs -f redis
docker-compose logs -f minio
```

### Backups

#### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U app lunaris > backup.sql

# Restore backup
docker-compose exec -T db psql -U app lunaris < backup.sql
```

#### File Storage Backup

```bash
# Backup MinIO data
docker-compose exec minio mc mirror /data /backup

# Or use S3 sync for S3 storage
aws s3 sync s3://your-bucket /backup
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec api pnpm prisma:migrate:deploy
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Redis Connection Failed**
   - Check REDIS_URL format
   - Ensure Redis is running
   - Verify network connectivity

3. **S3/MinIO Connection Failed**
   - Check S3 credentials
   - Verify bucket exists
   - Check network connectivity

4. **ClamAV Not Available**
   - Ensure ClamAV service is running
   - Check port 3310 is accessible
   - Verify virus definitions are updated

5. **Email Not Sending**
   - Check SMTP configuration
   - Verify email credentials
   - Check firewall rules

### Performance Tuning

1. **Database Optimization**
   - Add database indexes
   - Configure connection pooling
   - Monitor slow queries

2. **Redis Optimization**
   - Configure memory limits
   - Enable persistence
   - Monitor memory usage

3. **File Upload Optimization**
   - Configure multipart upload
   - Set appropriate chunk sizes
   - Monitor upload performance

## Support

For issues and questions:

1. Check the [GitHub Issues](https://github.com/yourusername/lunariscloud/issues)
2. Review the [API Documentation](API.md)
3. Check the [Development Guide](DEVELOPMENT.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
