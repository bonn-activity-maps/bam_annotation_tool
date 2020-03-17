#!/bin/bash

# Remove backups older than 7 days
sudo find /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups -mtime +6 -delete

# Copy backups from server
scp -P 222 -r 188.138.127.15:/home/cvg_anno/database_backups/* /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups