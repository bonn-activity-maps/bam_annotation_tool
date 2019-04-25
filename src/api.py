from flask import Flask, render_template, make_response, request
import os
import logging
import json

from python.logic.videoService import VideoService
from python.infrastructure.userManager import UserManager

app = Flask(__name__)
videoService = VideoService()
userManager = UserManager()


# Base redirection to index.html. Let AngularJS handle Webapp states
@app.route("/")
def redirect():
     return make_response(open('/usr/src/templates/index.html').read())

# Admin login handler
@app.route("/api/user/adminLogin", methods=['GET'])
def adminLogin():
    success, msg, status = userManager.loginAdmin(request.headers['password'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Normal user login handler
@app.route("/api/user/userLogin", methods=['GET'])
def userLogin():
    success, msg, status = userManager.loginUser(request.headers['username'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Upload chunked video
@app.route('/api/video/upload', methods=['POST'])
def uploadVideo():
    success, msg, status = videoService.storeVideo(request)
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Unwrap video
@app.route('/api/video/unwrap', methods=['POST'])
def unwrapVideo():
    req_data = request.get_json()
    success, msg, status = videoService.unwrapVideo(req_data['name'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get list of videos and lenght
@app.route('/api/video/info', methods=['GET'])
def getVideoList():
    success, msg, status = videoService.getInfoVideos()
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get frame from video
@app.route('/api/video/getframe', methods=['GET'])
def getVideoFrame():
    success, msg, status = videoService.getVideoFrame(request.headers['fileName'], request.headers['frame'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Rename video
@app.route('/api/video/rename', methods=['POST'])
def renameVideo():
    req_data = request.get_json()
    success, msg, status = videoService.renameVideo(req_data['oldName'], req_data['newName'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Delete video
@app.route('/api/video/delete', methods=['POST'])
def deleteVideo():
    req_data = request.get_json()
    success, msg, status = videoService.deleteVideo(req_data['name'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}


if __name__ == "__main__":
    app.run(host="0.0.0.0")
