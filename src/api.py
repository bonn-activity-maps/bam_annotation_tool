from flask import Flask, make_response, request, send_file
import json, os

from python.logic.datasetService import DatasetService
from python.logic.videoService import VideoService
from python.logic.annotationService import AnnotationService
from python.logic.objectTypeService import ObjectTypeService
from python.logic.userService import UserService
from python.logic.taskService import TaskService
from python.logic.aikService import AIKService
from python.logic.frameService import FrameService
from python.logic.actionService import ActionService
from python.logic.activity_service import ActivityService
from python.logic.user_action_service import UserActionService

from python.objects.user import User
from python.objects.dataset import Dataset
from python.objects.video import Video
from python.objects.frame import Frame
from python.objects.object_type import Object_type
from python.objects.annotation import Annotation
from python.objects.object import Object
from python.objects.action import Action
from python.objects.activity import Activity
from python.objects.user_action import UserAction

import python.config as cfg

app = Flask(__name__)

datasetService = DatasetService()
videoService = VideoService()
annotationService = AnnotationService()
objectTypeService = ObjectTypeService()
userService = UserService()
taskService = TaskService()
aikService = AIKService()
frameService = FrameService()
actionService = ActionService()
activity_service = ActivityService()
user_action_service = UserActionService()

from python.db_scripts.precomputeAnnotations import PrecomputeAnnotations
precompute = PrecomputeAnnotations()

# Base redirection to index.html. Let AngularJS handle Webapp states
@app.route("/")
def redirect():
    return make_response(open(cfg.index_path).read())

@app.route("/precomputeAnnotations")
def precomputeAnnotations():
    success, msg, status =  precompute.precomputeAnnotations()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#### USER ####

# User login
@app.route("/api/user/login", methods=['GET'])
def user_login():
    success, msg, status = userService.user_login(request.headers['username'], request.headers['password'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get user info
@app.route("/api/user/getUser", methods=['GET'])
def get_user():
    success, msg, status = userService.get_user(request.headers['username'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all users
@app.route("/api/user/getUsers", methods=['GET'])
def get_users():
    success, msg, status = userService.get_users()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info users by dataset
@app.route("/api/user/getUsersByDataset", methods=['GET'])
def get_users_by_dataset():
    success, msg, status = userService.get_users_by_dataset(request.headers['dataset'], request.headers['role'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new user
@app.route('/api/user/createUser', methods=['POST'])
def create_user():
    user = User.from_json(request.get_json())
    success, msg, status = userService.create_user(user)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing user
@app.route('/api/user/removeUser', methods=['POST'])
def remove_user():
    req_data = request.get_json()
    success, msg, status = userService.remove_user(req_data['name'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUser', methods=['POST'])
def update_user():
    user = User.from_json(request.get_json())
    success, msg, status = userService.update_user(user)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUserPassword', methods=['POST'])
def update_user_password():
    req_data = request.get_json()
    success, msg, status = userService.update_user_password(req_data['username'], req_data['password'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### DATASET ####

# Get dataset info
@app.route("/api/dataset/getDataset", methods=['GET'])
def get_dataset():
    dataset = Dataset(request.headers['name'])
    success, msg, status = datasetService.get_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all datasets
@app.route("/api/dataset/getDatasets", methods=['GET'])
def get_datasets():
    success, msg, status = datasetService.get_datasets()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new dataset
@app.route('/api/dataset/createDataset', methods=['POST'])
def create_dataset():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.create_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing dataset
@app.route('/api/dataset/removeDataset', methods=['POST'])
def remove_dataset():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.remove_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get list of zip files in file system
@app.route('/api/dataset/getZipFiles', methods=['GET'])
def get_zip_files():
    success, msg, status = datasetService.get_zip_files()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Load a zip file already in the file system
# parameter: req_data['name'] = name+extension
@app.route('/api/dataset/loadZip', methods=['POST'])
def load_zip():
    req_data = request.get_json()
    dataset_name, _ = os.path.splitext(req_data['name'])
    dataset = Dataset(dataset_name, req_data['type'], file_name=req_data['name'])
    success, msg, status = datasetService.process_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Export annotation to a file for given dataset
@app.route('/api/dataset/exportDataset', methods=['GET'])
def export_dataset():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = datasetService.export_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Read data from stored zip
@app.route('/api/dataset/readData', methods=['POST'])
def read_data():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.add_info(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### VIDEO ####

# Get info of video
@app.route('/api/video/getVideo', methods=['GET'])
def get_video():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_video(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get list of videos and length
@app.route('/api/video/getVideos', methods=['GET'])
def get_videos():
    dataset = Dataset(request.headers['dataset'])
    success, msg, status = videoService.get_videos(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get max frame of video
@app.route('/api/video/getMaxFrame', methods=['GET'])
def get_max_frame():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_max_frame(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get min frame of video
@app.route('/api/video/getMinFrame', methods=['GET'])
def get_min_frame():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_min_frame(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get a frame from video
@app.route('/usr/storage/<path:filename>', methods=['GET'])
def get_video_frame(filename):
    return send_file('/usr/storage/'+filename)

# Get a range of frames from video
@app.route('/api/video/getFramesVideo', methods=['GET'])
def get_video_frames():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_video_frames(video, int(request.headers['startFrame']), int(request.headers['endFrame']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# # Update existing video
# @app.route('/api/video/updateVideosFrames', methods=['POST'])
# def update_videos_frames():
#     success, msg, status = videoService.update_videos_frames(request.headers['dataset'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ANNOTATION ####

# Get list of folders in file system (except dataset folders)
@app.route('/api/annotation/getFolders', methods=['GET'])
def get_folders():
    success, msg, status = annotationService.get_folders()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get annotation info for given frame, dataset, scene and user
@app.route('/api/annotation/getAnnotation', methods=['GET'])
def get_annotation():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], request.headers['frame'], request.headers['user'])
    success, msg, status = annotationService.get_annotation(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get annotation info for given frame range, dataset, scene and user
@app.route('/api/annotation/getAnnotationsByFrameRange', methods=['GET'])
def get_annotations_by_frame_range():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    start_annotation = Annotation(dataset, request.headers['scene'], request.headers['startFrame'], request.headers['user'])
    end_annotation = Annotation(dataset, request.headers['scene'], request.headers['endFrame'], request.headers['user'])
    success, msg, status = annotationService.get_annotations_by_frame_range(start_annotation, end_annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotations (all frames) for given dataset, video which are validated and ready to export (user = Root)
@app.route('/api/annotation/getAnnotations', methods=['GET'])
def get_annotations():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], user=request.headers['user'])
    success, msg, status = annotationService.get_annotations(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get all annotated objects for dataset, scene and user
@app.route('/api/annotation/getObjects', methods=['GET'])
def get_annotated_objects():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], user=request.headers['user'])
    success, msg, status = annotationService.get_annotated_objects(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update existing annotation for given frame, dataset, video and user
@app.route('/api/annotation/updateAnnotation', methods=['POST'])
def update_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object.from_json(req_data['object'], req_data['datasetType'])
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], [object])
    success, msg, status = annotationService.update_annotation(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing annotation for given frame, dataset, video and user
# @app.route('/api/annotation/updateAnnotationPT', methods=['POST'])
# def update_annotation_PT():
#     req_data = request.get_json()
#     dataset = Dataset(req_data['dataset'], req_data['datasetType'])
#     object = Object.from_json(req_data['object'], req_data['datasetType'])
#     annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], object)
#     success, msg, status = annotationService.update_annotation_PT(annotation)
#
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Validate frames for given dataset, video and user
# frames: [[1, 2, ..],[3,..], ...], validated: ["correct", "incorrect", ..]
# Each validated flag corresponds to an array of frames (the same position)
# @app.route('/api/annotation/updateAnnotation/validate', methods=['POST'])
# def updateAnnotationValidation():
#     success, msg, status = annotationService.updateValidation(request.get_json())
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Create and return new uid for an object in annotations for a dataset to avoid duplicated uid objects
@app.route('/api/annotation/createNewUidObject', methods=['POST'])
def create_new_uid_object():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'])
    success, msg, status = annotationService.create_new_uid_object(annotation, req_data['type'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Interpolate between 2 points and store the interpolated 3d points
@app.route('/api/annotation/interpolate', methods=['POST'])
def interpolate_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object1 = Object(req_data['uidObject'], req_data['objectType'], dataset_type=req_data['datasetType'],
                     track_id=req_data['track_id'])
    object2 = Object(req_data['uidObject2'], req_data['objectType'], dataset_type=req_data['datasetType'],
                     track_id=req_data['track_id'])
    start_annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [object1])
    end_annotation = Annotation(dataset, req_data['scene'], req_data['endFrame'], req_data['user'], [object1])
    success, msg, status = annotationService.interpolate_annotation(dataset, start_annotation, end_annotation, object2)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotation of one object in frame range for given frame, dataset, video and user
@app.route('/api/annotation/getAnnotation/object', methods=['GET'])
def get_annotation_frame_object():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    object = Object(request.headers['uidObject'],  request.headers['objectType'], dataset_type=request.headers['datasetType'], track_id=request.headers['uidObject'])
    annotation1 = Annotation(dataset, request.headers['scene'], request.headers['startFrame'], request.headers['user'], [object])
    annotation2 = Annotation(dataset, request.headers['scene'], request.headers['endFrame'], request.headers['user'], [object])
    success, msg, status = annotationService.get_annotation_frame_object(annotation1, annotation2)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Create a new person for Posetrack. This implies computing a new ID and precomputing all annotations
@app.route('/api/annotation/createPersonPT', methods=['POST'])
def create_person_pt():
    req_data = request.get_json()
    video = Video(req_data['scene'], Dataset(req_data['dataset'], req_data['datasetType']))
    success, msg, status = annotationService.create_person_pt(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Return True if the person id is in use, false otherwise
@app.route('/api/annotation/isPersonIDInUse', methods=['GET'])
def is_person_id_in_use():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = annotationService.is_person_id_in_use(dataset, request.headers['person_id'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update object in annotation for given frame, dataset, video and user
# Create new one if the annotation for this objects does not exist
# @app.route('/api/annotation/updateAnnotation/object', methods=['POST'])
# def update_annotation_frame_object():
#     success, msg, status = annotationService.update_annotation_frame_object(request.get_json())
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Delete annotation for given frames, dataset, video and user and object id
@app.route('/api/annotation/removeAnnotation/object', methods=['POST'])
def remove_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=req_data['datasetType'],
                    track_id=req_data['uidObject'])
    start_annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [object])
    end_annotation = Annotation(dataset, req_data['scene'], req_data['endFrame'], req_data['user'], [object])
    success, msg, status = annotationService.remove_annotation_frame_object(start_annotation, end_annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Read data from stored zip
@app.route('/api/annotation/uploadAnnotations', methods=['POST'])
def upload_annotations():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = annotationService.upload_annotations(dataset, req_data['folder'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### OBJECT TYPE ####

# Get object type info
@app.route('/api/objectType/getObjectType', methods=['GET'])
def get_object_type():
    object_type = Object_type(request.headers['type'], request.headers['datasetType'])
    success, msg, status = objectTypeService.get_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get all object types
@app.route('/api/objectType/getObjectTypes', methods=['GET'])
def get_object_types():
    success, msg, status = objectTypeService.get_object_types(request.headers['datasetType'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new object type
@app.route('/api/objectType/createObjectType', methods=['POST'])
def create_object_type():
    object_type = Object_type.from_json(request.get_json())
    success, msg, status = objectTypeService.create_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing object type
@app.route('/api/objectType/updateObjectType', methods=['POST'])
def update_object_type():
    object_type = Object_type.from_json(request.get_json())
    success, msg, status = objectTypeService.update_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete object
@app.route('/api/objectType/removeObjectType', methods=['POST'])
def remove_object_type():
    req_data = request.get_json()
    object_type = Object_type(req_data['type'], req_data['datasetType'])
    success, msg, status = objectTypeService.remove_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### TASKS ####

# # Get task for specific user
# @app.route("/api/task/getTask", methods=['GET'])
# def getTask():
#     success, msg, status = taskService.getTask(request.headers['name'], request.headers['user'],
#                                                request.headers['dataset'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Get info of all tasks for specific user
# @app.route("/api/task/getTasks", methods=['GET'])
# def getTasks():
#     success, msg, status = taskService.getTasks(request.headers['user'], request.headers['dataset'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Create new task for specific user
# @app.route('/api/task/createTask', methods=['POST'])
# def createTask():
#     req_data = request.get_json()
#     success, msg, status = taskService.createTask(req_data['name'], req_data['user'], req_data['dataset'],
#                                                   req_data['scene'], req_data['frameFrom'], req_data['frameTo'],
#                                                   req_data['description'], req_data['POV'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Remove existing task for specific user
# @app.route('/api/task/removeTask', methods=['POST'])
# def removeTask():
#     req_data = request.get_json()
#     success, msg, status = taskService.removeTask(req_data['name'], req_data['user'], req_data['dataset'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Update existing task for specific user
# @app.route('/api/task/updateTask', methods=['POST'])
# def updateTask():
#     req_data = request.get_json()
#     success, msg, status = taskService.updateTask(req_data['name'], req_data['user'], req_data['dataset'],
#                                                   req_data['scene'], req_data['frameFrom'], req_data['frameTo'],
#                                                   req_data['description'], req_data['lastFrame'], req_data['POV'],
#                                                   req_data['finished'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Update and finish existing task
# @app.route('/api/task/finishTask', methods=['POST'])
# def finishTask():
#     req_data = request.get_json()
#     success, msg, status = taskService.finishTask(req_data['name'], req_data['user'], req_data['dataset'],
#                                                   req_data['scene'], req_data['finished'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}
#
#
# # Update last modified frame in task
# @app.route('/api/task/updateFrameTask', methods=['POST'])
# def updateFrameTask():
#     req_data = request.get_json()
#     success, msg, status = taskService.updateFrameTask(req_data['name'], req_data['user'], req_data['dataset'],
#                                                        req_data['scene'], req_data['lastFrame'])
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ACTIVITIES ####

# Get activities list
@app.route("/api/activity/getActivities", methods=['GET'])
def get_activities():
    # dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = activity_service.get_activities()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Create a new Activity
@app.route("/api/activity/createActivity", methods=['POST'])
def create_activity():
    req_data = request.get_json()
    activity = Activity(req_data['activity'])
    success, msg, status = activity_service.create_activity(activity)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Remove existing activity
@app.route("/api/activity/removeActivity", methods=['POST'])
def remove_activity():
    req_data = request.get_json()
    activity = Activity(req_data['activity'])
    success, msg, status = activity_service.remove_activity(activity)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ACTIONS ####

# Get action for specific user and frame range
@app.route("/api/action/getAction", methods=['GET'])
def get_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    action = Action(request.headers['name'], dataset, request.headers['objectUID'], request.headers['user'],
                    request.headers['startFrame'], request.headers['endFrame'])
    success, msg, status = actionService.get_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get actions for specific user and frame range
@app.route("/api/action/getActions", methods=['GET'])
def get_actions():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = actionService.get_actions(dataset, request.headers['user'], request.headers['startFrame'], request.headers['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get actions for specific object, user and frame range
@app.route("/api/action/getActionsByUID", methods=['GET'])
def get_actions_by_UID():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = actionService.get_actions_by_UID(dataset, request.headers['objectUID'], request.headers['user'],
                                                         request.headers['startFrame'], request.headers['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Create new action for specific user
@app.route('/api/action/createAction', methods=['POST'])
def create_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    action = Action(req_data['name'], dataset, req_data['objectUID'], req_data['user'], req_data['startFrame'], req_data['endFrame'])
    success, msg, status = actionService.create_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Remove an action
@app.route('/api/action/removeAction', methods=['POST'])
def remove_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    action = Action(req_data['name'], dataset, req_data['objectUID'], req_data['user'], req_data['startFrame'], req_data['endFrame'])
    success, msg, status = actionService.remove_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Merge actions with same start and end frames
@app.route('/api/action/mergeActions', methods=['POST'])
def merge_actions():
    success, msg, status = actionService.merge_actions()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### AIK and OPENCV computations ####
# Given 3D point coordinates (can be more than one), video, dataset and frame -> Returns the proyected points
@app.route('/api/aik/projectToCamera', methods=['GET'])
def project_to_camera():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = aikService.project_to_camera(int(request.headers['startFrame']), int(request.headers['endFrame']),
                                                        int(request.headers['cameraName']), dataset,
                                                        request.headers['points'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


@app.route('/api/aik/computeEpiline', methods=['GET'])
def compute_epiline():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    frame1 = Frame(request.headers['frame'], request.headers['cam1'], dataset)
    frame2 = Frame(request.headers['frame'], request.headers['cam2'], dataset)
    el1, el2 = aikService.compute_epiline(request.headers['point'], frame1, frame2)
    return json.dumps({'success': True, 'msg': {'el1': el1, 'el2': el2}}), 200, {'ContentType': 'application/json'}

# Return 6 mugshot of person uid from different cameras
@app.route('/api/aik/getMugshot', methods=['GET'])
def get_mugshot():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = aikService.get_mugshot(dataset, request.headers['scene'], request.headers['user'],
                                                  int(request.headers['uid']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

#### FRAME ####

# Get frame
@app.route("/api/frame/getFrame", methods=['GET'])
def get_frame():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    frame = Frame(request.headers['frame'], request.headers['video'], dataset)
    success, msg, status = frameService.get_frame(frame)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all frames
@app.route("/api/frame/getFrames", methods=['GET'])
def get_frames():
    #TODO change dataset
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = frameService.get_frames(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Remove existing frame for specific user
@app.route('/api/frame/removeFrame', methods=['POST'])
def remove_frame():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    frame = Frame(req_data['frame'], req_data['video'], dataset)
    success, msg, status = frameService.remove_frame(frame)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get initial and ending frame number of a video
@app.route('/api/frame/getFrameInfoOfDataset', methods=['GET'])
def get_frames_info_of_dataset_group_by_video():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = frameService.get_frames_info_of_dataset_group_by_video(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### USER ACTIONS ####

# Get user action for specific user and dataset
@app.route("/api/userAction/getUserActions/user", methods=['GET'])
def get_user_action_by_user():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_user(dataset, request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}

# Get user actions for specific action and dataset
@app.route("/api/userAction/getUserActions/action", methods=['GET'])
def get_user_action_by_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_action(dataset, request.headers['action'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}

# Get user actions for specific user, action and dataset
@app.route("/api/userAction/getUserActions/user/action", methods=['GET'])
def get_user_action_by_user_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_user_action(dataset, request.headers['user'],
                                                                              request.headers['action'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}

# Get user action for specific dataset
@app.route("/api/userAction/getUserActions", methods=['GET'])
def get_user_actions():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_actions(dataset)
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}

# Create new action for specific user
@app.route('/api/userAction/createUserAction', methods=['POST'])
def create_user_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    user_action = UserAction(req_data['user'], req_data['action'], req_data['scene'], dataset)
    success, msg, status = user_action_service.create_user_action(user_action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Remove an action
@app.route('/api/userAction/removeUserAction', methods=['POST'])
def remove_user_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    user_action = UserAction(req_data['user'], req_data['action'], req_data['scene'], dataset, req_data['timestamp'])
    success, msg, status = user_action_service.remove_user_action(user_action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


## USE ONLY IN CASE OF ERROR UPLOADING FRAMES
# Remove and insert new frames for one video and dataset
@app.route('/api/dataset/insertFramesError', methods=['POST'])
def insert_frames():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], 'actionInKitchen')
    success, msg, status = datasetService.insertFrames(dataset, int(req_data['video']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}



if __name__ == "__main__":
    app.run(host=cfg.app["ip"], port=cfg.app["port"])
