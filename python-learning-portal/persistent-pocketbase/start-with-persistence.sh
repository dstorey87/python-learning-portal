#!/bin/sh
set -e

echo "Starting PocketBase with S3 persistence..."

# S3 configuration
S3_BUCKET=${S3_BUCKET:-python-portal-backups}
BACKUP_FILE="pocketbase-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
DB_PATH="/pb_data/data.db"

# Function to backup to S3
backup_to_s3() {
    if [ -f "$DB_PATH" ]; then
        echo "Creating backup..."
        cd /pb_data
        tar -czf "/tmp/$BACKUP_FILE" .
        if aws s3 cp "/tmp/$BACKUP_FILE" "s3://$S3_BUCKET/latest.tar.gz"; then
            aws s3 cp "/tmp/$BACKUP_FILE" "s3://$S3_BUCKET/backups/$BACKUP_FILE"
            rm "/tmp/$BACKUP_FILE"
            echo "Backup uploaded to S3"
        else
            echo "Failed to upload backup to S3"
        fi
    fi
}

# Function to restore from S3
restore_from_s3() {
    echo "Checking for existing backup in S3..."
    if aws s3 ls "s3://$S3_BUCKET/latest.tar.gz" > /dev/null 2>&1; then
        echo "Found backup in S3, restoring..."
        cd /pb_data
        aws s3 cp "s3://$S3_BUCKET/latest.tar.gz" "/tmp/restore.tar.gz"
        tar -xzf "/tmp/restore.tar.gz"
        rm "/tmp/restore.tar.gz"
        echo "Database restored from S3"
    else
        echo "No existing backup found, starting fresh"
        # Create initial backup to establish the bucket structure
        echo "Setting up initial admin user..."
        setup_initial_data
    fi
}

# Function to set up initial admin and users collection
setup_initial_data() {
    echo "Setting up admin user..."
    /usr/local/bin/pocketbase superuser upsert "${PB_ADMIN_EMAIL:-admin@portal.com}" "${PB_ADMIN_PASSWORD:-AdminPass123}" > /dev/null 2>&1 || echo "Admin might already exist"
    
    echo "Setting up users collection..."
    # Start PocketBase in background to create collections
    /usr/local/bin/pocketbase serve --http="127.0.0.1:8090" &
    SETUP_PID=$!
    sleep 3
    
    # Create users collection via API
    curl -X POST http://127.0.0.1:8090/api/collections \
        -H "Content-Type: application/json" \
        -d '{
            "name": "users",
            "type": "auth",
            "schema": [
                {
                    "name": "name",
                    "type": "text",
                    "required": true
                },
                {
                    "name": "avatar",
                    "type": "file",
                    "required": false,
                    "options": {
                        "maxSelect": 1,
                        "maxSize": 5242880,
                        "mimeTypes": ["image/jpeg", "image/png", "image/gif"]
                    }
                }
            ],
            "options": {
                "allowEmailAuth": true,
                "allowUsernameAuth": false,
                "requireEmail": true,
                "exceptEmailDomains": [],
                "onlyEmailDomains": [],
                "minPasswordLength": 8
            }
        }' 2>/dev/null || echo "Users collection might already exist"
    
    kill $SETUP_PID 2>/dev/null
    wait $SETUP_PID 2>/dev/null
    
    # Initial backup
    backup_to_s3
}

echo "Starting PocketBase server..."

# Restore from S3 if backup exists
restore_from_s3

# Start PocketBase server in background
/usr/local/bin/pocketbase serve --http="0.0.0.0:80" &
PB_PID=$!

# Background backup scheduler (every hour)
(
    while true; do
        sleep 3600  # 1 hour
        backup_to_s3
    done
) &
BACKUP_PID=$!

# Handle shutdown gracefully
trap 'echo "Shutting down..."; backup_to_s3; kill $PB_PID; exit 0' TERM INT

echo "PocketBase started with S3 persistence"
echo "Admin: ${PB_ADMIN_EMAIL:-admin@portal.com} / ${PB_ADMIN_PASSWORD:-AdminPass123}"
echo "Backups: Every hour to S3"

# Keep the container running
wait $PB_PID