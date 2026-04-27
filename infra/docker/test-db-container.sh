#!/bin/sh
echo "Testing PostgreSQL connection from Docker container..."
echo "DATABASE_URL: $DATABASE_URL"

# Install postgresql-client if not present
apk add --no-cache postgresql-client 2>/dev/null || apt-get update && apt-get install -y postgresql-client 2>/dev/null || yum install -y postgresql 2>/dev/null

# Test connection
pg_isready -h postgres -p 5432 -U medical_user -d medical_db
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL is reachable"
    
    # Try to connect and list tables
    PGPASSWORD=${POSTGRES_PASSWORD:-medical_password} psql -h postgres -p 5432 -U medical_user -d medical_db -c "\dt" | head -20
else
    echo "❌ PostgreSQL is not reachable"
fi