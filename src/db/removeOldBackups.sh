#!/bin/bash

# Remove backups older than 7 days
find /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups -mtime +6 -execdir rm -r -- '{}' \;