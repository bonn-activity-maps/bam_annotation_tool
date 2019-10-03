#!/bin/bash

mongodump --host "172.18.0.2:27017" --out /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

find /home/cvg_anno/Data/datasets/actions_in_kitchens/database_backups -mtime +7 -delete


mongodump --host "172.18.0.2:27017" --out /home/beatriz/Documentos/Work/Test/$(date +"%Y-%m-%d") --db cvg --forceTableScan
find /home/beatriz/Documentos/Work/Test/ -mtime +3 -delete

https://www.linuxtotal.com.mx/?cont=info_admon_006
https://unix.stackexchange.com/questions/194863/delete-files-older-than-x-days


mongodump --host "172.18.0.2:27017" --out /home/beatriz/Documentos/Work/Test/$(date +"%Y-%m-%d_%H:%M:%S") --db cvg --forceTableScan

