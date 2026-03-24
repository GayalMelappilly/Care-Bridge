# Docker Setup Guide

## Overview

This setup provides production-grade Docker configuration for the Care-Bridge application with:
- Multi-stage build for optimized image size
- Non-root user for security
- Health checks for container orchestration
- Docker Compose for easy deployment

## Files

- **Dockerfile** - Multi-stage build configuration for the Next.js frontend
- **docker-compose.yml** - Orchestration file for frontend and backend services
- **.dockerignore** - Excludes unnecessary files from Docker build context

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## Quick Start

### Option 1: Build and Run with Docker Compose (Recommended)

```bash
# Build the image
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Option 2: Build and Run Frontend Only

```bash
cd client

# Build the image
docker build -t carebridge-frontend:latest .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080/api \
  carebridge-frontend:latest
```

## Configuration

### Environment Variables

Update these in `docker-compose.yml` or `.env.local`:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080/api
NODE_ENV=production
```

### Backend Service

The `docker-compose.yml` includes a `backend` service placeholder. Update it:

```yaml
backend:
  build:
    context: ./server  # Path to your backend
    dockerfile: Dockerfile
  # ... rest of config
```

Or use an existing image:

```yaml
backend:
  image: your-registry/carebridge-backend:latest
```

## Production Deployment

### Build for Production

```bash
docker build -t carebridge-frontend:1.0.0 -f client/Dockerfile .
docker tag carebridge-frontend:1.0.0 your-registry/carebridge-frontend:latest
docker push your-registry/carebridge-frontend:latest
```

### Deploy with Docker Compose

```bash
# Pull latest images
docker-compose pull

# Update and restart
docker-compose up -d
```

### Deploy to Kubernetes (Optional)

Convert docker-compose to Kubernetes manifests:

```bash
kompose convert -f docker-compose.yml -o k8s/
```

## Architecture

```
┌─────────────────┐
│    Nginx/LB     │
│   (Port 3000)   │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│   Frontend Container        │
│  - Next.js App              │
│  - Node.js 18-Alpine        │
│  - Health Check: ✓          │
└────────┬────────────────────┘
         │
    API Calls (8080)
         │
┌────────▼────────────────────┐
│   Backend Container         │
│  - Node.js/Express/FastAPI  │
│  - Health Check: ✓          │
└─────────────────────────────┘
```

## Health Checks

Both services include health checks:

```bash
# Check container health
docker-compose ps

# View health status
docker inspect --format='{{.State.Health}}' carebridge-frontend
docker inspect --format='{{.State.Health}}' carebridge-backend
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8000:3000"  # External:Internal
```

### Image Build Issues

```bash
# Clean build (no cache)
docker-compose build --no-cache

# View build logs
docker-compose build --verbose
```

### Container Won't Start

```bash
# Check logs
docker-compose logs frontend

# Run in interactive mode for debugging
docker-compose run --rm frontend /bin/sh
```

## Performance Tips

1. **Caching** - The multi-stage build caches npm dependencies
2. **Image Size** - Alpine Linux reduces image from 500MB to ~300MB
3. **Security** - Non-root user prevents privilege escalation
4. **Restart Policy** - `unless-stopped` keeps services running

## Security Considerations

✅ Non-root user execution
✅ Alpine Linux (minimal attack surface)
✅ Health checks (automatic restart on failure)
✅ `.dockerignore` (excludes source files)
✅ dumb-init (proper signal handling)

## Scaling

For production scaling:

1. **Docker Swarm**: Use `docker stack deploy`
2. **Kubernetes**: Use kompose to convert to K8s manifests
3. **Load Balancing**: Add nginx/haproxy in front
4. **Caching**: Add Redis for session management

Example nginx.conf:

```nginx
upstream frontend {
  server frontend:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://frontend;
  }
}
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove unused images
docker image prune

# Remove all dangling containers
docker container prune

# Full cleanup (WARNING: removes data)
docker-compose down -v
```
