#!/bin/bash

show_help ()
{
  echo "-----------------------------"
  echo "Usage:"
  echo "sudo ./deploy.sh <option>"
  echo "-----------------------------"
  echo "Options:"
  echo "    -tunnel: build the web app tunnel between your pc and the login server in port 8000."
  echo "             CTRL+C to finish the tunnel"
  echo "    -tunneldb: build the db tunnel between your pc and the login server in port 8200."
  echo "             CTRL+C to finish the tunnel"
  echo "    -redeploy: pull, stop and launch web application."
  echo "-----------------------------"
  exit 0
}

if [ "$#" -ne 1 ]; then
  show_help
fi

if [ "$1" = "-h" ]; then
  show_help
elif [ "$1" = "-tunnel" ]; then
  echo "-- CTRL+C to finish the tunnel --"
  echo "Your informatik username: "
  read user
  ssh -N -L localhost:8000:localhost:8888 "$user"@login.iai.uni-bonn.de
elif [ "$1" = "-tunneldb" ]; then
  echo "-- CTRL+C to finish the tunnel --"
  echo "Your informatik username: "
  read user
  ssh -N -L localhost:8200:localhost:8200 "$user"@login.iai.uni-bonn.de
elif [ "$1" = "-redeploy" ]; then
  sudo git pull
  sudo ./launch.sh -saweb
  sudo ./launch.sh -daweb
else
  show_help
fi
