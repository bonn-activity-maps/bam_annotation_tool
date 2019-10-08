#!/bin/bash

mongodump --host "172.18.0.2:27017" --out /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

find /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups -mtime +7 -delete


