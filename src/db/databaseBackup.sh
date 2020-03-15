#!/bin/bash

# Backup db
mongodump --host "127.0.0.1:27017" --out /usr/storage/database_backups/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

# Remove backups older than 7 days
find /usr/storage/database_backups -mtime +6 -delete

# Request for merging overlapping actions
curl -X POST http://localhost:5000/api/action/mergeActions
