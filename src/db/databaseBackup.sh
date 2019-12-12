#!/bin/bash

# Backup db
mongodump --host "172.18.0.2:27017" --out /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

# Remove backups older than 7 days
find /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups -mtime +6 -delete

# Request for merging overlapping actions
curl -X POST http://localhost:8888/api/action/mergeActions
