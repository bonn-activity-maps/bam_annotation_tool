#!/bin/bash

# Backup db
mongodump --host "127.0.0.1:27017" --out /home/cvg_anno/database_backups/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

# Request for merging overlapping actions
curl -X POST http://localhost:8888/api/action/mergeActions

#Copy to cvg25

# Remove backup
rm -rf /home/cvg_anno/database_backups/*

