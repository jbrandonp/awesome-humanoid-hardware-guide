# Generate Kubernetes secrets.yaml from template and .env.production
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

# Generate secure passwords
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

# Read template
$template = Get-Content -Path secrets.template.yaml -Raw

# Replace placeholders
$template = $template -replace 'CHANGE_ME_SECURE_PASSWORD', $postgresPassword
$template = $template -replace 'CHANGE_ME_SECURE_PASSWORD', $mongoPassword  # second occurrence
$template = $template -replace 'CHANGE_ME_SECURE_PASSWORD', $minioPassword  # third occurrence
$template = $template -replace 'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_32', $jwtSecret
$template = $template -replace 'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_32', $jwtRefreshSecret
$template = $template -replace 'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_32', $tokenEncryptionKey
$template = $template -replace 'CHANGE_ME_DEEPSEEK_API_KEY', $deepseekApiKey
$template = $template -replace 'CHANGE_ME_ABDM_CLIENT_ID', $abdmClientId
$template = $template -replace 'CHANGE_ME_ABDM_CLIENT_SECRET', $abdmClientSecret
$template = $template -replace 'CHANGE_ME_WHATSAPP_ACCESS_TOKEN', $whatsappAccessToken
$template = $template -replace 'CHANGE_ME_WHATSAPP_PHONE_ID', $whatsappPhoneId
$template = $template -replace 'postgresql://medical_user:CHANGE_ME_SECURE_PASSWORD@postgres-service:5432/medical_db\?schema=public', $databaseUrl
$template = $template -replace 'mongodb://mongo_admin:CHANGE_ME_SECURE_PASSWORD@mongodb-service:27017/medical_db\?authSource=admin', $mongoUrl

# Write secrets.yaml without BOM
[System.IO.File]::WriteAllText("secrets.yaml", $template, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ Kubernetes secrets.yaml generated successfully"
Write-Host "⚠️  IMPORTANT: Update external API keys with real values before production deployment"
Write-Host "   File: infra/kubernetes/secrets.yaml"