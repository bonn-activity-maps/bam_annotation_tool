#!/bin/bash
echo '------ Remove previous docker app ------'
sudo docker rm app

echo '------ Build docker app ------'
sudo docker build -t app .

echo '------ Run docker app ------'
sudo docker run -p 8888:5000 --name app --mount src=videos,dst=/usr/storage app
