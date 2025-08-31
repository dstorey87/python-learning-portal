# Setup AWS PocketBase with admin credentials
# This script will reconfigure the AWS PocketBase container with proper admin setup

Write-Host "Setting up AWS PocketBase with admin credentials..." -ForegroundColor Green

# First, let's create a container image with pre-configured admin
$tempDir = ".\temp-pocketbase-setup"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Create a Dockerfile that sets up admin on startup
@"
FROM spectado/pocketbase:latest

# Copy initialization script
COPY init-admin.sh /init-admin.sh
RUN chmod +x /init-admin.sh

# Set up admin user on container start
ENTRYPOINT ["/init-admin.sh"]
"@ | Out-File -FilePath "$tempDir\Dockerfile" -Encoding UTF8

# Create initialization script
@"
#!/bin/sh
echo "Starting PocketBase with admin setup..."

# Start PocketBase in background
pocketbase serve --http=0.0.0.0:80 &
PB_PID=`$!

# Wait for PocketBase to start
sleep 10

# Check if admin exists, if not create one
ADMIN_CHECK=`$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/api/admins)
if [ "`$ADMIN_CHECK" = "404" ]; then
    echo "Creating admin user..."
    curl -X POST http://localhost:80/api/admins \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@portal.com",
            "password": "AdminPass123",
            "passwordConfirm": "AdminPass123"
        }'
    echo "Admin user created successfully"
else
    echo "Admin already exists"
fi

# Keep PocketBase running in foreground
wait `$PB_PID
"@ | Out-File -FilePath "$tempDir\init-admin.sh" -Encoding UTF8

Write-Host "Building custom PocketBase image..." -ForegroundColor Yellow
Push-Location $tempDir
docker build -t pocketbase-with-admin:latest .
Pop-Location

Write-Host "Pushing image to temporary registry..." -ForegroundColor Yellow
# We'll use Docker Hub for this temporary image
docker tag pocketbase-with-admin:latest dstorey87/pocketbase-with-admin:latest
docker push dstorey87/pocketbase-with-admin:latest

Write-Host "Updating AWS Lightsail container..." -ForegroundColor Yellow
aws lightsail create-container-service-deployment `
    --service-name python-portal-db `
    --containers '{
        "pocketbase": {
            "image": "dstorey87/pocketbase-with-admin:latest",
            "ports": {
                "80": "HTTP"
            },
            "environment": {
                "ADMIN_EMAIL": "admin@portal.com",
                "ADMIN_PASSWORD": "AdminPass123"
            }
        }
    }' `
    --public-endpoint '{
        "containerName": "pocketbase",
        "containerPort": 80,
        "healthCheck": {
            "healthyThreshold": 2,
            "unhealthyThreshold": 2,
            "timeoutSeconds": 5,
            "intervalSeconds": 10,
            "path": "/api/health",
            "successCodes": "200"
        }
    }'

Write-Host "Deployment initiated. Waiting for container to be ready..." -ForegroundColor Yellow

# Wait for deployment
do {
    Start-Sleep 30
    $status = aws lightsail get-container-service --service-name python-portal-db | ConvertFrom-Json
    Write-Host "Status: $($status.containerService.state)" -ForegroundColor Cyan
} while ($status.containerService.state -eq "UPDATING")

Write-Host "AWS PocketBase setup complete!" -ForegroundColor Green
Write-Host "Admin URL: https://python-portal-db.nf0keysv54fy8.eu-west-1.cs.amazonlightsail.com/_/" -ForegroundColor Cyan
Write-Host "Admin Email: admin@portal.com" -ForegroundColor Cyan
Write-Host "Admin Password: AdminPass123" -ForegroundColor Cyan

# Cleanup
Remove-Item -Recurse -Force $tempDir