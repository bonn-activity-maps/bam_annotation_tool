from flask import Flask, render_template, make_response, request
import os
import logging
import json

from python.logic.videoService import VideoService
from python.logic.annotationService import AnnotationService
from python.logic.userService import UserService

app = Flask(__name__)

videoService = VideoService()
annotationService = AnnotationService()
userService = UserService()

# Base redirection to index.html. Let AngularJS handle Webapp states
@app.route("/")
def redirect():
     return make_response(open('/usr/src/templates/index.html').read())

#### USER ####

# User login
@app.route("/api/user/login", methods=['GET'])
def userLogin():
    success, msg, status = userService.userLogin(request.headers['username'], request.headers['password'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get user info
@app.route("/api/user/getuser", methods=['GET'])
def getUser():
    success, msg, status = userService.getUser(request.headers['username'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get info of all users
@app.route("/api/user/getusers", methods=['GET'])
def getUsers():
    success, msg, status = userService.getUsers()
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get info users by dataset
@app.route("/api/user/getusersbydataset", methods=['GET'])
def getUsersDataset():
    success, msg, status = userService.getUsersByDataset(request.headers['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Create new user
@app.route('/api/user/createUser', methods=['POST'])
def createUser():
    success, msg, status = userService.createUser(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Remove existing user
@app.route('/api/user/removeUser', methods=['POST'])
def removeUser():
    req_data = request.get_json()
    success, msg, status = userService.removeUser(req_data['name'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Update existing user
@app.route('/api/user/updateUser', methods=['POST'])
def updateUser():
    success, msg, status = userService.updateUser(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}


#### VIDEO ####

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


#### ANNOTATION ####

# Get annotation info for given frame
@app.route('/api/annotation/get/frame', methods=['GET'])
def getAnnotation():
    success, msg, status = annotationService.getAnnotation(request.headers['fileName'], request.headers['frame'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Store annotation info for given frame
@app.route('/api/annotation/upload/frame', methods=['POST'])
def uploadAnnotation():
    success, msg, status = annotationService.uploadAnnotation(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get annotation of object in frame
@app.route('/api/annotation/get/frame/object', methods=['GET'])
def getAnnotationFrameObject():
    success, msg, status = annotationService.getAnnotationFrameObject(request.headers['fileName'], request.headers['frame'], request.headers['obj'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Store annotation for an object in a frame
@app.route('/api/annotation/upload/frame/object', methods=['POST'])
def uploadAnnotationFrameObject():
    success, msg, status = annotationService.uploadAnnotationFrameObject(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get annotation object by type
@app.route('/api/annotation/get/object', methods=['GET'])
def getAnnotationObject():
    success, msg, status = annotationService.getAnnotationObject(request.headers['type'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Create annotation object with type, #keypoints and labels for each keypoint
@app.route('/api/annotation/upload/object', methods=['POST'])
def uploadAnnotationObject():
    success, msg, status = annotationService.uploadAnnotationObject(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}




if __name__ == "__main__":
    app.run(host="0.0.0.0")
