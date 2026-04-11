# Generate secure random secrets for production
function Generate-RandomBase64 {
    param([int]$ByteCount = 32)
    $bytes = New-Object byte[] $ByteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes)
}

$jwtSecret = Generate-RandomBase64 32
$jwtRefreshSecret = Generate-RandomBase64 32
$tokenEncryptionKey = Generate-RandomBase64 32

# Read .env.example and replace secrets
$envExample = Get-Content .env.example -Raw

# Create .env.production
@"
# ============================================================================
# PRODUCTION ENVIRONMENT - GENERATED SECURE SECRETS
# ============================================================================

# --- SECURITY KEYS (GENERATED RANDOMLY) ---
JWT_SECRET="$jwtSecret"
JWT_REFRESH_SECRET="$jwtRefreshSecret"
TOKEN_ENCRYPTION_KEY="$tokenEncryptionKey"

# --- DATABASE (Production defaults) ---
DATABASE_URL="postgresql://medical_user:CHANGE_ME_PRODUCTION_PASSWORD@localhost:5432/medical_db?schema=public"
MONGO_URL="mongodb://mongo_admin:CHANGE_ME_PRODUCTION_PASSWORD@localhost:27017/medical_db?authSource=admin"

# --- Redis (Production) ---
REDIS_HOST="localhost"
REDIS_PORT="6379"

# --- DeepSeek AI Configuration ---
MODEL_PROVIDER=openai
MODEL_NAME=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_API_KEY="CHANGE_ME_DEEPSEEK_API_KEY"

# --- MinIO Configuration ---
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="CHANGE_ME_MINIO_ACCESS_KEY"
MINIO_SECRET_KEY="CHANGE_ME_MINIO_SECRET_KEY"
MINIO_BUCKET="medical-images"

# --- Security Settings ---
NODE_ENV=production
PORT=3000
API_RATE_LIMIT_WINDOW=900000 # 15 minutes in milliseconds
API_RATE_LIMIT_MAX=100

# --- External Services (Production URLs) ---
ABDM_BASE_URL="https://healthidsbx.abdm.gov.in/api"
ABDM_CLIENT_ID="CHANGE_ME_ABDM_CLIENT_ID"
ABDM_CLIENT_SECRET="CHANGE_ME_ABDM_CLIENT_SECRET"

WHATSAPP_BUSINESS_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_BUSINESS_PHONE_NUMBER_ID="CHANGE_ME_WHATSAPP_PHONE_ID"
WHATSAPP_BUSINESS_ACCESS_TOKEN="CHANGE_ME_WHATSAPP_ACCESS_TOKEN"

# --- PACS Configuration ---
DCM4CHEE_AE_TITLE="SYSTEME_SANTE"
DCM4CHEE_HOST="localhost"
DCM4CHEE_PORT="11112"

# --- mDNS/Bonjour (Local Network Discovery) ---
MDNS_ENABLED=true
MDNS_SERVICE_NAME="systeme-sante-emr"
MDNS_SERVICE_TYPE="_http._tcp"
MDNS_SERVICE_PORT=80
MDNS_SERVICE_TXT_RECORDS="version=3.0,offline=true"
"@ | Out-File -FilePath .env.production -Encoding UTF8

Write-Host "✅ .env.production generated with secure random secrets"
Write-Host "⚠️  IMPORTANT: Update database passwords and external service credentials before production use"