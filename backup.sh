#!/bin/bash

# ===========================================
# MongoDB Backup Script for Docker Deployment
# ===========================================

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found!"
    echo "Please create .env file with MONGODB_URI variable"
    exit 1
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI is not set in .env file"
    exit 1
fi

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Starting MongoDB Backup"
echo "=========================================="
echo "Time: $(date)"
echo "Backup Path: $BACKUP_PATH"
echo "=========================================="

# Perform backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✓ Backup completed successfully!"
    echo "Location: $BACKUP_PATH"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    echo "Size: $BACKUP_SIZE"
    
    # List all backups
    echo "=========================================="
    echo "Available backups:"
    ls -lh "$BACKUP_DIR" | grep "^d"
    
    # Delete backups older than 7 days
    echo "=========================================="
    echo "Cleaning old backups (older than 7 days)..."
    find "$BACKUP_DIR" -type d -name "backup-*" -mtime +7 -exec rm -rf {} +
    echo "✓ Cleanup completed"
    
    echo "=========================================="
    echo "Backup process finished successfully!"
    echo "=========================================="
else
    echo "=========================================="
    echo "✗ Backup failed!"
    echo "Please check your MONGODB_URI and try again"
    echo "=========================================="
    exit 1
fi
