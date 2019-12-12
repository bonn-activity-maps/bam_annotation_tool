#!/bin/bash

show_help ()
{
  echo "-----------------------------"
  echo "Usage:"
  echo "sudo ./launch.sh <option>"
  echo "-----------------------------"
  echo "Options:"
  echo "    -bweb: build web application."
  echo "    -lweb: launch web application."
  echo "    -ldb:  launch mongo database. "
  echo "    -rdb:  reset mongo database. "
  echo "    -fdb: fill database with test data."
  echo "    -aweb: build and launch web application (update) synchronously."
  echo "    -daweb: build and launch web application (update) aynchronously."
  echo "    -saweb: stop web application."
  echo "    -dldb: launch mongo database aynchronously."
  echo "    -sdb: stop mongo database."
  echo "-----------------------------"
  echo "It is recomended to launch the web application and the database on"
  echo "different terminals to be able to control the logs of each service."
  exit 0
}

if [ "$#" -ne 1 ]; then
  show_help
fi

if [ "$1" = "-h" ]; then
  show_help
elif [ "$1" = "-bweb" ]; then
  npm install --prefix static/
  sudo docker-compose build web
elif [ "$1" = "-lweb" ]; then
  sudo docker-compose up web
elif [ "$1" = "-ldb" ]; then
  sudo docker-compose up db
elif [ "$1" = "-rdb" ]; then
  mongo 172.18.0.2:27017/cvg db/reset.js
elif [ "$1" = "-fdb" ]; then
  mongo 172.18.0.2:27017/cvg db/initialize.js
  elif [ "$1" = "-aweb" ]; then
  npm install --prefix static/
  sudo docker-compose build web
  sudo docker-compose up web
elif [ "$1" = "-daweb" ]; then
  npm install --prefix static/
  sudo docker-compose build web
  sudo docker-compose up -d web
elif [ "$1" = "-saweb" ]; then
  sudo docker container stop src_web_1
elif [ "$1" = "-dldb" ]; then
  sudo docker-compose up -d db
elif [ "$1" = "-sdb" ]; then
  sudo docker container stop src_db_1
else
  show_help
fi
