from flask import Flask, make_response, request
import json

from python.logic.datasetService import DatasetService
from python.logic.annotationService import AnnotationService
from python.logic.objectService import ObjectService
from python.logic.userService import UserService
from python.logic.taskService import TaskService

app = Flask(__name__)

datasetService = DatasetService()
annotationService = AnnotationService()
objectService = ObjectService()
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
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get user info
@app.route("/api/user/getUser", methods=['GET'])
def getUser():
    success, msg, status = userService.getUser(request.headers['username'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all users
@app.route("/api/user/getUsers", methods=['GET'])
def getUsers():
    success, msg, status = userService.getUsers()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info users by dataset
@app.route("/api/user/getUsersByDataset", methods=['GET'])
def getUsersByDataset():
    success, msg, status = userService.getUsersByDataset(request.headers['dataset'], request.headers['role'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new user
@app.route('/api/user/createUser', methods=['POST'])
def createUser():
    success, msg, status = userService.createUser(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing user
@app.route('/api/user/removeUser', methods=['POST'])
def removeUser():
    req_data = request.get_json()
    success, msg, status = userService.removeUser(req_data['name'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUser', methods=['POST'])
def updateUser():
    success, msg, status = userService.updateUser(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUserPassword', methods=['POST'])
def updateUserPassword():
    # TODO
    success, msg, status = userService.updateUser(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### DATASET ####

# Get dataset info
@app.route("/api/dataset/getDataset", methods=['GET'])
def getDataset():
    success, msg, status = datasetService.getDataset(request.headers['name'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all datasets
@app.route("/api/dataset/getDatasets", methods=['GET'])
def getDatasets():
    success, msg, status = datasetService.getDatasets()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new dataset
@app.route('/api/dataset/createDataset', methods=['POST'])
def createDataset():
    success, msg, status = datasetService.createDataset(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing dataset
@app.route('/api/dataset/removeDataset', methods=['POST'])
def removeDataset():
    req_data = request.get_json()
    success, msg, status = datasetService.removeDataset(req_data['name'])

    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Upload chunked zip file
@app.route('/api/dataset/uploadZip', methods=['POST'])
def uploadZip():
    success, msg, status = datasetService.storeZip(request)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get list of zip files in file system
@app.route('/api/dataset/getZipFiles', methods=['GET'])
def getZipFiles():
    success, msg, status = datasetService.getZipFiles()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Load a zip file already in the file system
@app.route('/api/dataset/loadZip', methods=['POST'])
def loadZip():
    req_data = request.get_json()
    success, msg, status = datasetService.loadZip(req_data['name'], req_data['type'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

#### VIDEO ####

# Unwrap videos of a dataset
@app.route('/api/dataset/unwrapVideos', methods=['POST'])
def unwrapVideos():
    req_data = request.get_json()
    success, msg, status = datasetService.unwrapVideos(req_data['dataset'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get list of videos and length
@app.route('/api/dataset/getVideos', methods=['GET'])
def getVideos():
    success, msg, status = datasetService.getVideos(request.headers['dataset'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get frame from video
@app.route('/api/dataset/getFrameVideo', methods=['GET'])
def getVideoFrame():
    success, msg, status = datasetService.getVideoFrame(request.headers['fileName'], request.headers['frame'],
                                                        request.headers['dataset'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing video
@app.route('/api/dataset/updateVideosFrames', methods=['POST'])
def updateVideosFrames():
    success, msg, status = datasetService.updateVideosFrames(request.headers['dataset'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ANNOTATION ####

# Get annotation info for given frame, dataset, video and user
@app.route('/api/annotation/getAnnotation', methods=['GET'])
def getAnnotation():
    success, msg, status = annotationService.getAnnotation(request.headers['dataset'], request.headers['video'],
                                                           request.headers['frame'], request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotations (all frames) for given dataset, video which are validated and ready to export (user = Root)
@app.route('/api/annotation/getAnnotations', methods=['GET'])
def getAnnotations():
    success, msg, status = annotationService.getAnnotations(request.headers['dataset'], request.headers['video'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new annotation
@app.route('/api/annotation/createAnnotation', methods=['POST'])
def createAnnotation():
    success, msg, status = annotationService.createAnnotation(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing annotation for given frame, dataset, video and user
@app.route('/api/annotation/updateAnnotation', methods=['POST'])
def updateAnnotation():
    success, msg, status = annotationService.updateAnnotation(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete annotation
# TODO: do we need to filter in remove by validated flag?
@app.route('/api/annotation/removeAnnotation', methods=['POST'])
def removeAnnotation():
    success, msg, status = annotationService.removeAnnotation(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Validate frames for given dataset, video and user
# frames: [[1, 2, ..],[3,..], ...], validated: ["correct", "incorrect", ..]
# Each validated flag corresponds to an array of frames (the same position)
@app.route('/api/annotation/updateAnnotation/validate', methods=['POST'])
def updateAnnotationValidation():
    success, msg, status = annotationService.updateValidation(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#####

# Get annotation of one object in frame for given frame, dataset, video and user
@app.route('/api/annotation/getAnnotation/object', methods=['GET'])
def getAnnotationFrameObject():
    success, msg, status = annotationService.getAnnotationFrameObject(request.headers['dataset'],
                                                                      request.headers['video'],
                                                                      request.headers['frame'], request.headers['user'],
                                                                      request.headers['uidObject'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update object in annotation for given frame, dataset, video and user
# Create new one if the annotation for this objects does not exist
@app.route('/api/annotation/updateAnnotation/object', methods=['POST'])
def updateAnnotationFrameObject():
    success, msg, status = annotationService.updateAnnotationFrameObject(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove object in annotation for given frame, dataset, video and user
@app.route('/api/annotation/removeAnnotation/object', methods=['POST'])
def removeAnnotationFrameObject():
    success, msg, status = annotationService.removeAnnotationFrameObject(request.get_json())
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### OBJECTS ####

# Get object info
@app.route('/api/object/getObject', methods=['GET'])
def getObject():
    success, msg, status = objectService.getObject(request.headers['type'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get all objects
@app.route('/api/object/getObjects', methods=['GET'])
def getObjects():
    success, msg, status = objectService.getObjects()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new object
@app.route('/api/object/createObject', methods=['POST'])
def createObject():
    req_data = request.get_json()
    success, msg, status = objectService.createObject(req_data['type'], req_data['numKeypoints'], req_data['labels'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing object
@app.route('/api/object/updateObject', methods=['POST'])
def updateObject():
    req_data = request.get_json()
    success, msg, status = objectService.updateObject(req_data['type'], req_data['numKeypoints'], req_data['labels'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete object
@app.route('/api/object/removeObject', methods=['POST'])
def removeObject():
    req_data = request.get_json()
    success, msg, status = objectService.removeObject(req_data['type'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### TASKS ####

# Get task for specific user
@app.route("/api/task/getTask", methods=['GET'])
def getTask():
    success, msg, status = taskService.getTask(request.headers['name'], request.headers['user'],
                                               request.headers['dataset'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all tasks for specific user
@app.route("/api/task/getTasks", methods=['GET'])
def getTasks():
    success, msg, status = taskService.getTasks(request.headers['user'], request.headers['dataset'])
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
    success, msg, status = taskService.removeTask(req_data['name'], req_data['user'], req_data['dataset'])
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
