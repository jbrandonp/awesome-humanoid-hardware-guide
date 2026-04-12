# Create proper Kubernetes secrets.yaml with distinct passwords
function Generate-RandomPassword {
    param([int]$Length = 24)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?`~".ToCharArray()
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $password = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $password += $chars[$bytes[$i] % $chars.Length]
    }
    return $password
}

function Generate-Base64Secret {
    param([int]$Bytes = 32)
    $randomBytes = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
    return [Convert]::ToBase64String($randomBytes)
}

# Generate JWT secrets (random base64)
$jwtSecret = Generate-Base64Secret 32
$jwtRefreshSecret = Generate-Base64Secret 32
$tokenEncryptionKey = Generate-Base64Secret 32

# Generate distinct secure passwords
$postgresPassword = Generate-RandomPassword 24
$mongoPassword = Generate-RandomPassword 24
$minioPassword = Generate-RandomPassword 24

# External API keys (placeholders)
$deepseekApiKey = "CHANGE_ME_DEEPSEEK_API_KEY"
$abdmClientId = "CHANGE_ME_ABDM_CLIENT_ID"
$abdmClientSecret = "CHANGE_ME_ABDM_CLIENT_SECRET"
$whatsappAccessToken = "CHANGE_ME_WHATSAPP_ACCESS_TOKEN"
$whatsappPhoneId = "CHANGE_ME_WHATSAPP_PHONE_ID"

# Database URLs with embedded passwords
$databaseUrl = "postgresql://medical_user:$postgresPassword@postgres-service:5432/medical_db?schema=public"
$mongoUrl = "mongodb://mongo_admin:$mongoPassword@mongodb-service:27017/medical_db?authSource=admin"

# Build YAML
$yaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: systeme-sante-secrets
  namespace: default
  labels:
    app: systeme-sante
    component: secrets
type: Opaque
stringData:
  # PostgreSQL credentials
  postgres-user: "medical_user"
  postgres-password: "$postgresPassword"
  
  # MongoDB credentials
  mongo-root-username: "mongo_admin"
  mongo-root-password: "$mongoPassword"
  
  # MinIO credentials
  minio-root-user: "minio_admin"
  minio-root-password: "$minioPassword"
  
  # JWT secrets (must be at least 32 bytes base64)
  jwt-secret: "$jwtSecret"
  jwt-refresh-secret: "$jwtRefreshSecret"
  token-encryption-key: "$tokenEncryptionKey"
  
  # External API keys
  deepseek-api-key: "$deepseekApiKey"
  abdm-client-id: "$abdmClientId"
  abdm-client-secret: "$abdmClientSecret"
  whatsapp-business-access-token: "$whatsappAccessToken"
  whatsapp-business-phone-number-id: "$whatsappPhoneId"
  
  # Database URLs (with embedded secrets)
  database-url: "$databaseUrl"
  mongo-url: "$mongoUrl"
  redis-url: "redis://redis-service:6379"
"@

# Write to file
$yaml | Out-File -FilePath infra/kubernetes/secrets.yaml -Encoding UTF8

Write-Host "✅ Kubernetes secrets.yaml generated successfully with distinct passwords"
Write-Host "⚠️  IMPORTANT: Update external API keys with real values before production deployment"
Write-Host "   File: infra/kubernetes/secrets.yaml"