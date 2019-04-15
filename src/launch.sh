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
  echo "    -ldbf: launch mongo database and fill it with test data."
  echo "    -aweb: build and launch web application (update)."
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
  sudo docker-compose build web
elif [ "$1" = "-lweb" ]; then
  sudo docker-compose up web
elif [ "$1" = "-ldb" ]; then
  sudo docker-compose up db
elif [ "$1" = "-rdb" ]; then
  mongo 172.18.0.2:27017/users db/reset.js
elif [ "$1" = "-ldbf" ]; then
  sudo docker-compose up db
  mongo 172.18.0.2:27017/users db/initialize.js
elif [ "$1" = "-aweb" ]; then
  sudo docker-compose build web
  sudo docker-compose up web
else
  show_help
fi
