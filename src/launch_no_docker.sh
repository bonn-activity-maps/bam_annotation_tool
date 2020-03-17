#!/bin/bash

show_help ()
{
  echo "-----------------------------"
  echo "Usage:"
  echo "sudo ./launch.sh <option>"
  echo "-----------------------------"
  echo "Options:"
  echo "    -rdb:  reset mongo database. "
  echo "    -fdb: fill database with test data."
  echo "    -aweb: launch web application (update) synchronously."
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
elif [ "$1" = "-rdb" ]; then
  mongo 127.0.0.1:27017/cvg db/reset.js
elif [ "$1" = "-fdb" ]; then
  mongo 127.0.0.1:27017/cvg db/initialize.js
elif [ "$1" = "-aweb" ]; then
  pip3 install -r requirements.txt
  sudo npm install --prefix static/
  python api.py
else
  show_help
fi
