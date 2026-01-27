#!/bin/bash

# ===========================================
# Complete Docker Deployment Script
# Backup → Build → Push → Deploy
# ===========================================

set -e  # Exit on error

# Configuration
DOCKER_USERNAME="itzharukixyz"
IMAGE_NAME="venuebooking"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=========================================="
echo "Docker Deployment Script"
echo "=========================================="
echo "Time: $(date)"
echo "=========================================="

# Step 1: Backup Database
echo ""
echo "===== Step 1: Backup Database ====="
if [ -f "./backup.sh" ]; then
    ./backup.sh
else
    echo "Warning: backup.sh not found, skipping backup..."
fi

# Step 2: Build Docker Image
echo ""
echo "===== Step 2: Build Docker Image ====="
docker build -t ${IMAGE_NAME}:latest .
echo "✓ Build completed"

# Step 3: Tag Images
echo ""
echo "===== Step 3: Tag Images ====="
docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:v${TIMESTAMP}
echo "✓ Tagged as:"
echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:v${TIMESTAMP}"

# Step 4: Push to Docker Hub (optional, ask for confirmation)
echo ""
echo "===== Step 4: Push to Docker Hub ====="
read -p "Do you want to push to Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing images to Docker Hub..."
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:v${TIMESTAMP}
    echo "✓ Push completed"
else
    echo "Skipping push to Docker Hub"
fi

# Step 5: Deploy with Docker Compose
echo ""
echo "===== Step 5: Deploy with Docker Compose ====="
read -p "Do you want to deploy now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping existing containers..."
    docker-compose down
    
    echo "Starting new containers..."
    docker-compose up -d
    
    echo ""
    echo "✓ Deployment completed"
    echo ""
    echo "===== Container Status ====="
    docker-compose ps
    
    echo ""
    echo "===== Viewing Logs ====="
    echo "Press Ctrl+C to exit log view"
    sleep 2
    docker-compose logs -f app
else
    echo "Skipping deployment"
fi

echo ""
echo "=========================================="
echo "Deployment script finished!"
echo "=========================================="
