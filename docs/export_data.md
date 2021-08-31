# Create backup and import data into a local database

## 1. Create a backup and download it from the server

- Create a new backup from bam_annotation_tool/src/db (This may take a few minutes):
```
./databaseBackup.sh
```
or 
- Download the last backup


All the backups are located in `.../database_backups`

The name of the backup folder is the date in format:  `yyyy-mm-dd_hh:mm:ss`

## 2. Import into local database

- Launch in local the database and annotation tool with docker:
```
./launch.sh -ldb
./launch.sh -aweb
```

- If you have previous data in the database, you can remove it:
```
mongo 172.18.0.2:27017/cvg path_to_bam_tool/src/db/reset.js
```

- Import the backup (this may take 5-10 min):
```
mongorestore --host "172.18.0.2:27017" --db cvg path_to_backup/'yyyy-mm-dd_hh:mm:ss'/cvg
```

## 3. Export from the local annotation tool

- Log in in the tool as root
- Go to dataset tab
- Export the datasets. The exported json files will be located in:  `/usr/share/cvg/datasets`









