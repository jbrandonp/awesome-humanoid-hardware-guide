# Deployment Guide

This guide describes how to deploy the Resilient Health System in production.

## Prerequisites

- **Node.js** v18+ (LTS recommended)
- **Docker** and **Docker Compose** for database services
- **Rust** (for Tauri desktop build)
- **Expo CLI** (for mobile builds)
- **PostgreSQL** 15, **MongoDB** 6, **Redis**, **MinIO** (included in Docker Compose)

## 1. Infrastructure Setup

### Docker Compose (Production)

The project includes a `docker-compose.yml` file that defines all necessary services.

```bash
# Start all services in detached mode
npm run docker:up

# Check logs
docker compose logs -f
```

Services:

- **PostgreSQL**: medical database (port 5432)
- **MongoDB**: NoSQL storage (port 27017)
- **Redis**: caching and queues (port 6379)
- **MinIO**: object storage for files (ports 9000, 9001)
- **API**: NestJS backend (port 3000)
- **Nginx**: reverse proxy (port 80)

### Database Schema

Apply the Prisma schema:

```bash
npm run db:push
```

This creates all tables and indexes.

### Environment Variables

Copy `.env.example` to `.env` and set production values:

```bash
# Security keys (generate strong random strings)
JWT_SECRET="generate-a-strong-secret"
JWT_REFRESH_SECRET="generate-another-strong-secret"
TOKEN_ENCRYPTION_KEY="32-byte-random-string-here"

# Database URLs (already configured in docker-compose)
DATABASE_URL="postgresql://medical_user:medical_password@postgres:5432/medical_db?schema=public"
MONGO_URL="mongodb://mongo_admin:mongo_password@mongodb:27017/medical_db?authSource=admin"
REDIS_HOST="redis"
REDIS_PORT=6379

# AI/ML services (optional)
WHISPER_BIN_PATH="/path/to/whisper.cpp/main"
WHISPER_MODEL_PATH="/path/to/ggml-medium.en-q8_0.bin"
```

## 2. Backend API Deployment

### Build

```bash
npx nx build @systeme-sante/api
```

The output is in `dist/apps/api`.

### Run with PM2 (Production)

Install PM2 globally:

```bash
npm install -g pm2
```

Start the API:

```bash
cd dist/apps/api
pm2 start main.js --name "medical-api"
```

### Health Check

Verify the API is running:

```bash
curl http://localhost:3000/api
```

Should return `{"status":"ok"}`.

## 3. Desktop Application (Tauri)

### Build for Windows

```bash
cd apps/desktop
npx nx build @systeme-sante/desktop
```

This creates a Vite build. To create the Tauri executable:

```bash
cd apps/desktop/src-tauri
cargo build --release
```

The Windows executable will be in `target/release/`.

### Distribution

Package with Tauri's CLI:

```bash
cargo tauri build
```

This creates an installer in `src-tauri/target/release/bundle/`.

## 4. Mobile Application (Expo)

### Build for Android/iOS

```bash
cd apps/mobile
npx nx build @systeme-sante/mobile --platform android
```

Or using EAS:

```bash
eas build --platform android --profile production
```

### Over-the-Air Updates

Configure Expo OTA updates in `app.json`.

## 5. Kiosk Application

Build the React app:

```bash
npx nx build @systeme-sante/kiosk
```

Deploy the static files to any web server. The kiosk should run in full-screen mode.

## 6. Patient Portal (PWA)

Build the Next.js application:

```bash
npx nx build portail-pwa
```

Deploy the `dist/apps/portail-pwa` directory to a static host or Node.js server.

### Environment for PWA

Set `NEXT_PUBLIC_API_URL` to point to your backend API (e.g., `https://api.yourdomain.com`).

## 7. Reverse Proxy (Nginx)

The Docker Compose includes an Nginx configuration. For custom deployment, you can use the provided `nginx.conf` as a template.

Example server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/portail-pwa;
        try_files $uri $uri/ /index.html;
    }
}
```

## 8. Security Hardening

### SSL/TLS

Use Let's Encrypt with Certbot to obtain certificates. Update Nginx configuration to use HTTPS.

### Firewall

Open only necessary ports (80, 443, 22). Block external access to database ports.

### Secrets Management

Never commit secrets to version control. Use environment variables or a secrets manager.

### Regular Updates

Keep dependencies updated, especially security patches.

## 9. Monitoring and Logs

### Log Aggregation

Use Docker's logging driver or forward logs to a centralized service.

### Health Checks

Implement health check endpoints (`/api/health`) and monitor with uptime tools.

### Backup Strategy

- **PostgreSQL**: Regular pg_dump backups
- **MongoDB**: mongodump
- **MinIO**: Enable versioning and replication

## 10. Troubleshooting

### Common Issues

1. **Out of memory**: Reduce cache sizes in `apps/api/src/main.ts` and Whisper configuration.
2. **Database connection failures**: Verify network between containers.
3. **Mobile app cannot connect**: Check CORS settings in API.

### Support

Refer to the project documentation and issue tracker.
```

## Next Steps

- Set up CI/CD pipeline with GitHub Actions or GitLab CI
- Configure monitoring with Prometheus and Grafana
- Implement disaster recovery procedures