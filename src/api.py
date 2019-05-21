from flask import Flask, make_response, request
import json

from python.logic.datasetService import DatasetService
from python.logic.annotationService import AnnotationService
from python.logic.userService import UserService
from python.logic.taskService import TaskService

app = Flask(__name__)

datasetService = DatasetService()
annotationService = AnnotationService()
userService = UserService()
taskService = TaskService()

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
@app.route("/api/user/getUser", methods=['GET'])
def getUser():
    success, msg, status = userService.getUser(request.headers['username'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get info of all users
@app.route("/api/user/getUsers", methods=['GET'])
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


#### DATASET ####

# Get dataset info
@app.route("/api/dataset/getDataset", methods=['GET'])
def getDataset():
    success, msg, status = datasetService.getDataset(request.headers['name'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get info of all datasets
@app.route("/api/dataset/getDatasets", methods=['GET'])
def getDatasets():
    success, msg, status = datasetService.getDatasets()
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Create new dataset
@app.route('/api/dataset/createDataset', methods=['POST'])
def createDataset():
    success, msg, status = datasetService.createDataset(request.get_json())
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Remove existing dataset
@app.route('/api/dataset/removeDataset', methods=['POST'])
def removeDataset():
    req_data = request.get_json()
    success, msg, status = datasetService.removeDataset(req_data['name'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Upload chunked zip file
@app.route('/api/dataset/uploadZip', methods=['POST'])
def uploadZip():

    success, msg, status = datasetService.storeZip(request, request.headers['type'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}


#### VIDEO ####

# Upload chunked video
@app.route('/api/dataset/uploadVideo', methods=['POST'])
def uploadVideo():
    success, msg, status = datasetService.storeVideo(request, request.headers['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Unwrap video
@app.route('/api/dataset/unwrapVideo', methods=['POST'])
def unwrapVideo():
    req_data = request.get_json()
    success, msg, status = datasetService.unwrapVideo(req_data['name'], req_data['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get list of videos and length
@app.route('/api/dataset/getVideos', methods=['GET'])
def getVideos():
    success, msg, status = datasetService.getVideos(request.headers['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Get frame from video
@app.route('/api/dataset/getFrameVideo', methods=['GET'])
def getVideoFrame():
    success, msg, status = datasetService.getVideoFrame(request.headers['fileName'], request.headers['frame'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Rename video
@app.route('/api/dataset/renameVideo', methods=['POST'])
def renameVideo():
    req_data = request.get_json()
    success, msg, status = datasetService.renameVideo(req_data['oldName'], req_data['newName'], req_data['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Delete video
@app.route('/api/dataset/removeVideo', methods=['POST'])
def removeVideo():
    req_data = request.get_json()
    success, msg, status = datasetService.removeVideo(req_data['name'], req_data['dataset'])
    return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}

# Update existing video
@app.route('/api/dataset/updateVideoFrames', methods=['POST'])
def updateVideoFrames():
    req_data = request.get_json()
    success, msg, status = datasetService.updateVideoFrames(req_data['name'], req_data['dataset'])
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

#### TASKS ####

# Get task for specific user
@app.route("/api/task/getTask", methods=['GET'])
def getTask():
    success, msg, status = taskService.getTask(request.headers['name'], request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get info of all tasks for specific user
@app.route("/api/task/getTasks", methods=['GET'])
def getTasks():
    success, msg, status = taskService.getTasks(request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Create new task for specific user
@app.route('/api/task/createTask', methods=['POST'])
def createTask():
    success, msg, status = taskService.createTask(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Remove existing task for specific user
@app.route('/api/task/removeTask', methods=['POST'])
def removeTask():
    req_data = request.get_json()
    success, msg, status = taskService.removeTask(req_data['name'], req_data['user'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update existing task for specific user
@app.route('/api/task/updateTask', methods=['POST'])
def updateTask():
    success, msg, status = taskService.updateTask(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update and finish existing task
@app.route('/api/task/finishTask', methods=['POST'])
def finishTask():
    success, msg, status = taskService.finishTask(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update last modified frame in task
@app.route('/api/task/updateFrameTask', methods=['POST'])
def updateFrameTask():
    success, msg, status = taskService.updateFrameTask(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}



if __name__ == "__main__":
    app.run(host="0.0.0.0")
