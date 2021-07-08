from flask import Flask, make_response, request, send_file
import json, os
import flask_login, jwt
from datetime import datetime, timedelta

from python.logic.datasetService import DatasetService
from python.logic.videoService import VideoService
from python.logic.annotationService import AnnotationService
from python.logic.objectTypeService import ObjectTypeService
from python.logic.userService import UserService
from python.logic.aikService import AIKService
from python.logic.frameService import FrameService
from python.logic.actionService import ActionService
from python.logic.activity_service import ActivityService
from python.logic.user_action_service import UserActionService
from python.logic.pose_property_service import PosePropertyService
from python.logic.ptService import PTService


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
from python.objects.pose_property import PoseProperty

import python.config as cfg

app = Flask(__name__)

# Login manager for user sessions
login_manager = flask_login.LoginManager()
login_manager.init_app(app)

datasetService = DatasetService()
videoService = VideoService()
annotationService = AnnotationService()
objectTypeService = ObjectTypeService()
userService = UserService()
aikService = AIKService()
frameService = FrameService()
actionService = ActionService()
activity_service = ActivityService()
user_action_service = UserActionService()
pose_property_service = PosePropertyService()
pt_service = PTService()

from python.db_scripts.precomputeAnnotations import PrecomputeAnnotations
precompute = PrecomputeAnnotations()

# Configuration for user session management
app.secret_key = cfg.secret_key                 # key for sessions
login_manager.session_protection = "strong"     # Strong protection


# Base redirection to index.html. Let AngularJS handle Webapp states
@app.route("/")
def redirect():
    return make_response(open(cfg.index_path).read())

@app.route("/precomputeAnnotations")
def precomputeAnnotations():
    success, msg, status = precompute.precomputeAnnotations()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


@app.route("/precomputeIgnoreRegions", methods=['GET'])
def precomputeIgnoreRegions():
    success, msg, status = precompute.precomputeIgnoreRegions()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

#### SESSION ####

# Check if token is valid for each request
# Return user if the token is correct, None ow
@login_manager.request_loader
def request_loader(request):
    auth_headers = request.headers.get('Authorization', '').split()
    if len(auth_headers) != 2:
        return None
    try:
        token = auth_headers[1]
        data = jwt.decode(token, cfg.secret_key)
        # Check if user exist
        success, user, status = userService.get_user(data['sub'])
        if success:
            return user
    except jwt.ExpiredSignatureError:
        return None
    except (jwt.InvalidTokenError, Exception) as e:
        return None
    return None


# Return Unauthorized access message when token is not correct
@login_manager.unauthorized_handler
def unauthorized_handler():
    return json.dumps({'success': False, 'msg': 'Unauthorized'}), 401, {'ContentType': 'application/json'}


#### USER ####

# User login
@app.route("/api/user/login", methods=['GET'])
def user_login():
    success, msg, status = userService.user_login(request.headers['username'], request.headers['password'])

    # Create jwt for 9h if user correctly authenticated
    if success:
        user = msg
        token = jwt.encode({
            'sub': user.name,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=9)},
            cfg.secret_key)

        # Convert to json and add token to response
        msg = user.to_json()
        msg['token'] = token.decode('UTF-8')

    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Logout user
@app.route("/api/user/logout", methods=['GET'])
def logout():
    userService.user_logout(request.headers['username'])
    return json.dumps({'success': True, 'msg': "Logged out"}), 200, {'ContentType': 'application/json'}


# Get user info
@app.route("/api/user/getUser", methods=['GET'])
@flask_login.login_required
def get_user():
    success, msg, status = userService.get_user(request.headers['username'])
    # Convert user object to json if the user exists
    if success:
        msg = msg.to_json()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all users
@app.route("/api/user/getUsers", methods=['GET'])
@flask_login.login_required
def get_users():
    success, msg, status = userService.get_users()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info users by dataset
@app.route("/api/user/getUsersByDataset", methods=['GET'])
@flask_login.login_required
def get_users_by_dataset():
    success, msg, status = userService.get_users_by_dataset(request.headers['dataset'], request.headers['role'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new user
@app.route('/api/user/createUser', methods=['POST'])
@flask_login.login_required
def create_user():
    user = User.from_json(request.get_json())
    success, msg, status = userService.create_user(user)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing user
@app.route('/api/user/removeUser', methods=['POST'])
@flask_login.login_required
def remove_user():
    req_data = request.get_json()
    success, msg, status = userService.remove_user(req_data['name'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUser', methods=['POST'])
@flask_login.login_required
def update_user():
    user = User.from_json(request.get_json())
    success, msg, status = userService.update_user(user)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing user
@app.route('/api/user/updateUserPassword', methods=['POST'])
@flask_login.login_required
def update_user_password():
    req_data = request.get_json()
    success, msg, status = userService.update_user_password(req_data['username'], req_data['password'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Reset existing user password
@app.route('/api/user/resetUserPassword', methods=['POST'])
@flask_login.login_required
def reset_user_password():
    req_data = request.get_json()
    success, msg, status = userService.reset_user_password(req_data['username'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

#### DATASET ####

# Get dataset info
@app.route("/api/dataset/getDataset", methods=['GET'])
@flask_login.login_required
def get_dataset():
    dataset = Dataset(request.headers['name'])
    success, msg, status = datasetService.get_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all datasets
@app.route("/api/dataset/getDatasets", methods=['GET'])
@flask_login.login_required
def get_datasets():
    success, msg, status = datasetService.get_datasets()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new dataset
@app.route('/api/dataset/createDataset', methods=['POST'])
@flask_login.login_required
def create_dataset():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.create_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing dataset
@app.route('/api/dataset/removeDataset', methods=['POST'])
@flask_login.login_required
def remove_dataset():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.remove_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get list of zip files in file system
@app.route('/api/dataset/getZipFiles', methods=['GET'])
@flask_login.login_required
def get_zip_files():
    success, msg, status = datasetService.get_zip_files()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Load a zip file already in the file system
# parameter: req_data['name'] = name+extension
@app.route('/api/dataset/loadZip', methods=['POST'])
@flask_login.login_required
def load_zip():
    req_data = request.get_json()
    dataset_name, _ = os.path.splitext(req_data['name'])
    dataset = Dataset(dataset_name, req_data['type'], file_name=req_data['name'])
    success, msg, status = datasetService.process_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Export annotation to a file for given dataset
@app.route('/api/dataset/exportDataset', methods=['GET'])
@flask_login.login_required
def export_dataset():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = datasetService.export_dataset(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Read data from stored zip
@app.route('/api/dataset/readData', methods=['POST'])
@flask_login.login_required
def read_data():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.add_info(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Read ignore regions data from annotation files and load it into the db
@app.route('/api/dataset/loadIgnoreRegions', methods=['POST'])
@flask_login.login_required
def load_ignore_regions():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.load_ignore_regions(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Read posetrack poses data from annotation files and load it into the db
@app.route('/api/dataset/loadPTPoses', methods=['POST'])
@flask_login.login_required
def load_pt_poses():
    dataset = Dataset.from_json(request.get_json())
    success, msg, status = datasetService.load_pt_poses(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

#### VIDEO ####

# Get info of video
@app.route('/api/video/getVideo', methods=['GET'])
@flask_login.login_required
def get_video():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_video(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get list of videos and length
@app.route('/api/video/getVideos', methods=['GET'])
@flask_login.login_required
def get_videos():
    dataset = Dataset(request.headers['dataset'])
    success, msg, status = videoService.get_videos(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get max frame of video
@app.route('/api/video/getMaxFrame', methods=['GET'])
@flask_login.login_required
def get_max_frame():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_max_frame(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get min frame of video
@app.route('/api/video/getMinFrame', methods=['GET'])
@flask_login.login_required
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
@flask_login.login_required
def get_video_frames():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = videoService.get_video_frames(video, int(request.headers['startFrame']), int(request.headers['endFrame']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ANNOTATION ####

# Get list of folders in file system (except dataset folders)
@app.route('/api/annotation/getFolders', methods=['GET'])
@flask_login.login_required
def get_folders():
    success, msg, status = annotationService.get_folders()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotation info for given frame, dataset, scene and user
@app.route('/api/annotation/getAnnotation', methods=['GET'])
@flask_login.login_required
def get_annotation():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], request.headers['frame'], request.headers['user'])
    success, msg, status = annotationService.get_annotation(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotation info for given frame range, dataset, scene and user
@app.route('/api/annotation/getAnnotationsByFrameRange', methods=['GET'])
@flask_login.login_required
def get_annotations_by_frame_range():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    start_annotation = Annotation(dataset, request.headers['scene'], request.headers['startFrame'], request.headers['user'])
    end_annotation = Annotation(dataset, request.headers['scene'], request.headers['endFrame'], request.headers['user'])
    success, msg, status = annotationService.get_annotations_by_frame_range(start_annotation, end_annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotations (all frames) for given dataset, video which are validated and ready to export (user = Root)
@app.route('/api/annotation/getAnnotations', methods=['GET'])
@flask_login.login_required
def get_annotations():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], user=request.headers['user'])
    success, msg, status = annotationService.get_annotations(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get all annotated objects for dataset, scene and user
@app.route('/api/annotation/getObjects', methods=['GET'])
@flask_login.login_required
def get_annotated_objects():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    annotation = Annotation(dataset, request.headers['scene'], user=request.headers['user'])
    success, msg, status = annotationService.get_annotated_objects(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing annotation for given frame, dataset, video and user
@app.route('/api/annotation/updateAnnotation', methods=['POST'])
@flask_login.login_required
def update_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object.from_json(req_data['object'], req_data['datasetType'])
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], [object])
    success, msg, status = annotationService.update_annotation(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Get the numbers of the frames that can be annotated in a video for posetrack persons
@app.route('/api/annotation/getFramesToAnnotatePersonsPT', methods=['GET'])
def get_frames_to_annotate_persons_pt():
    success, msg, status = pt_service.get_frames_to_annotate_per_video(request.headers['video'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Validate frames for given dataset, video and user
# frames: [[1, 2, ..],[3,..], ...], validated: ["correct", "incorrect", ..]
# Each validated flag corresponds to an array of frames (the same position)
# @app.route('/api/annotation/updateAnnotation/validate', methods=['POST'])
# def updateAnnotationValidation():
#     success, msg, status = annotationService.updateValidation(request.get_json())
#     return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create and return new uid for an object in annotations for a dataset to avoid duplicated uid objects
@app.route('/api/annotation/createNewUidObject', methods=['POST'])
@flask_login.login_required
def create_new_uid_object():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'])
    success, msg, status = annotationService.create_new_uid_object(annotation, req_data['type'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Interpolate between 2 points and store the interpolated 3d points
# startFrame is an array with the frame of each label
@app.route('/api/annotation/interpolate', methods=['POST'])
@flask_login.login_required
def interpolate_annotation():
    req_data = request.get_json()
    start_frames = req_data['startFrames']
    end_frame = int(req_data['endFrame'])
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])

    # Check if all elements are the same and substitute by only one element
    if len(start_frames) > 1 and all(x == start_frames[0] for x in start_frames):
        start_frames = [start_frames[0]]

    # Check if all are -1 or the difference between startFrame and endFrame is 1 --> not need to interpolate
    interpolate = False
    for frame in start_frames:
        if frame != -1 and (end_frame - frame > 1):
            interpolate = True
            break
    # If we don't need to interpolate, return ok
    if not interpolate:
        success, msg, status = True, 'ok', 200
    # Use old interpolate if there is only 1 keypoint to interpolate, use new one if it's a poseAIK (>1kp)
    elif len(start_frames) == 1:
        object1 = Object(req_data['uidObject'], req_data['objectType'], dataset_type=req_data['datasetType'],
                         track_id=req_data['track_id'])
        object2 = Object(req_data['uidObject2'], req_data['objectType'], dataset_type=req_data['datasetType'],
                         track_id=req_data['track_id'])
        start_annotation = Annotation(dataset, req_data['scene'], start_frames[0], req_data['user'], [object1])
        end_annotation = Annotation(dataset, req_data['scene'], req_data['endFrame'], req_data['user'], [object1])
        success, msg, status = annotationService.interpolate_annotation(dataset, start_annotation, end_annotation, object2)
    else:
        success, msg, status = annotationService.interpolate_annotation_labels_aik(dataset, req_data['scene'], req_data['user'],
                                                                        int(req_data['uidObject']), req_data['objectType'],
                                                                        start_frames, req_data['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Replicate object between start and end frame
@app.route('/api/annotation/getSanityCheck', methods=['GET'])
@flask_login.login_required
def get_sanity_check():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = annotationService.get_sanity_check(dataset, request.headers['scene'], request.headers['user'],
                                                              request.headers['startFrame'], request.headers['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Autocomplete between 2 points and store the completed 3d points
# startFrame is an array with the frame of each label
@app.route('/api/annotation/autocomplete', methods=['POST'])
@flask_login.login_required
def autocomplete_annotation():
    req_data = request.get_json()
    start_frames = req_data['startFrames']
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = annotationService.autocomplete_annotation(dataset, req_data['scene'], req_data['user'],
                                                                     int(req_data['uidObject']), req_data['objectType'],
                                                                     start_frames, req_data['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Replicate object between start and end frame
@app.route('/api/annotation/replicate/object', methods=['POST'])
@flask_login.login_required
def replicate_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = annotationService.replicate_annotation(dataset, req_data['scene'], req_data['user'],
                                                                  int(req_data['uidObject']), req_data['objectType'],
                                                                  req_data['startFrame'], req_data['endFrame'],
                                                                  req_data['track_id'], req_data["forward"])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Replicate static object between start and end frame
# and delete frames after last frame if is different from last frame of dataset
@app.route('/api/annotation/replicate/staticobject', methods=['POST'])
@flask_login.login_required
def replicate_annotation_static_object():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = annotationService.replicate_annotation_static_object(dataset, req_data['scene'], req_data['user'],
                                                                  int(req_data['uidObject']), req_data['objectType'],
                                                                  req_data['startFrame'], req_data['endFrame'],
                                                                  req_data['lastDatasetFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Force the box object to be in contact with the floor and update the existing annotation for given frame, dataset, video and user
@app.route('/api/annotation/extendBox', methods=['POST'])
@flask_login.login_required
def extend_box():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=dataset.type)
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], [object])
    success, msg, status = annotationService.extend_box(annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Only to check that the method works
# Update only one label in one object in one frame
# @app.route('/api/annotation/updateLabel', methods=['POST'])
# def update_label():
#     req_data = request.get_json()
#     dataset = Dataset(req_data['dataset'], req_data['datasetType'])
#     empty_kpts = [[] for i in range(req_data['numKeypoints'])]
#     obj = Object(req_data['uidObject'], req_data['objectType'], empty_kpts)
#     annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], [obj])
#     msg = annotationService.update_annotation_frame_object_label(annotation,
#     return json.dumps({'success': True, 'msg': msg}), 200, {'ContentType': 'application/json'}


# Force the size of the indicated limb and update existing annotation for given frame, dataset, video and user
@app.route('/api/annotation/forceLimbLength', methods=['POST'])
@flask_login.login_required
def force_limb_length():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=dataset.type)
    annotation = Annotation(dataset, req_data['scene'], req_data['frame'], req_data['user'], [object])
    success, msg, status = annotationService.force_limb_length(annotation, req_data['startLabels'],
                                                               req_data['endLabels'], float(req_data['limbLength']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Force the size of the limbs and update annotations for range of frames, dataset, video and user
@app.route('/api/annotation/forceLimbsLength', methods=['POST'])
@flask_login.login_required
def force_limbs_length():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=dataset.type)
    annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [object])
    success, msg, status = annotationService.force_limbs_length(annotation, req_data['startFrame'], req_data['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get annotation of one object in frame range for given frame, dataset, video and user
@app.route('/api/annotation/getAnnotation/object', methods=['GET'])
@flask_login.login_required
def get_annotation_frame_object():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    object = Object(request.headers['uidObject'],  request.headers['objectType'], dataset_type=request.headers['datasetType'], track_id=request.headers['uidObject'])
    annotation1 = Annotation(dataset, request.headers['scene'], request.headers['startFrame'], request.headers['user'], [object])
    annotation2 = Annotation(dataset, request.headers['scene'], request.headers['endFrame'], request.headers['user'], [object])
    success, msg, status = annotationService.get_annotation_frame_object(annotation1, annotation2)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create a new person for Posetrack. This implies computing a new ID and precomputing all annotations
@app.route('/api/annotation/createPersonPT', methods=['POST'])
@flask_login.login_required
def create_person_pt():
    req_data = request.get_json()
    video = Video(req_data['scene'], Dataset(req_data['dataset'], req_data['datasetType']))
    success, msg, status = annotationService.create_person_pt(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create a new person for Posetrack. This implies computing a new ID and precomputing all annotations
@app.route('/api/annotation/createIgnoreRegion', methods=['POST'])
@flask_login.login_required
def create_ignore_region():
    req_data = request.get_json()
    video = Video(req_data['scene'], Dataset(req_data['dataset'], req_data['datasetType']))
    success, msg, status = annotationService.create_ignore_region(video, req_data['minIRTrackID'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Return True if the person id is in use, false otherwise
@app.route('/api/annotation/isPersonIDInUse', methods=['GET'])
@flask_login.login_required
def is_person_id_in_use():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = annotationService.is_person_id_in_use(dataset, request.headers['personID'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}

# Update the person id for every object in a sequence
@app.route('/api/annotation/updatePersonID', methods=['POST'])
@flask_login.login_required
def update_person_id():
    req_data = request.get_json()
    video = Video(req_data["scene"], Dataset(req_data['dataset'], req_data['datasetType']))
    new_person_id = req_data["newPersonID"]
    track_id = req_data["trackID"]
    user = req_data["user"]
    success, msg, status = annotationService.update_person_id(video, track_id, new_person_id, user)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update the track id for an object in a sequence frame
@app.route('/api/annotation/updateTrackID', methods=['POST'])
@flask_login.login_required
def update_track_id():
    req_data = request.get_json()
    video = Video(req_data["scene"], Dataset(req_data['dataset'], req_data['datasetType']))
    new_track_id = req_data["newTrackID"]
    track_id = req_data["trackID"]
    user = req_data["user"]
    obj_type = req_data["obj_type"]
    frame_start = req_data["frame_start"]
    frame_end = req_data["frame_end"]
    success, msg, status = annotationService.update_track_id(video, track_id, new_track_id, user, obj_type,
                                                             frame_start, frame_end)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete annotation for given frames, dataset, video and user and object id
@app.route('/api/annotation/removeAnnotation/object', methods=['POST'])
@flask_login.login_required
def remove_annotation():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=req_data['datasetType'],
                    track_id=req_data['uidObject'])
    start_annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [object])
    end_annotation = Annotation(dataset, req_data['scene'], req_data['endFrame'], req_data['user'], [object])
    success, msg, status = annotationService.remove_annotation_frame_object(start_annotation, end_annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete label(position in array) for an object in annotation for given frames, dataset, video and user
@app.route('/api/annotation/removeAnnotation/object/label', methods=['POST'])
@flask_login.login_required
def remove_annotation_frame_object_label():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    object = Object(req_data['uidObject'], req_data['objectType'], dataset_type=req_data['datasetType'],
                    track_id=req_data['uidObject'])
    annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [object])
    success, msg, status = annotationService.remove_annotation_frame_object_label(annotation, int(req_data['startFrame']),
                                                                                  int(req_data['endFrame']), req_data['objectType'],
                                                                                  int(req_data['label']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Read data from stored zip
@app.route('/api/annotation/uploadAnnotations', methods=['POST'])
@flask_login.login_required
def upload_annotations():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = annotationService.upload_annotations(dataset, req_data['folder'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Transfer pose to another person in one frame. If this person already has a pose they are swapped
@app.route('/api/annotation/transferObject', methods=['POST'])
@flask_login.login_required
def transfer_object():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    old_object = Object(req_data['oldUid'], req_data['objectType'], dataset_type=req_data['datasetType'])
    new_object = Object(req_data['newUid'], req_data['objectType'], dataset_type=req_data['datasetType'])
    old_annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [old_object])
    new_annotation = Annotation(dataset, req_data['scene'], req_data['startFrame'], req_data['user'], [new_object])
    success, msg, status = annotationService.transfer_object(dataset, old_annotation, new_annotation,
                                                             req_data['startFrame'], req_data['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### OBJECT TYPE ####

# Get object type info
@app.route('/api/objectType/getObjectType', methods=['GET'])
@flask_login.login_required
def get_object_type():
    object_type = Object_type(request.headers['type'], request.headers['datasetType'])
    success, msg, status = objectTypeService.get_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get all object types
@app.route('/api/objectType/getObjectTypes', methods=['GET'])
@flask_login.login_required
def get_object_types():
    success, msg, status = objectTypeService.get_object_types(request.headers['datasetType'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new object type
@app.route('/api/objectType/createObjectType', methods=['POST'])
@flask_login.login_required
def create_object_type():
    object_type = Object_type.from_json(request.get_json())
    success, msg, status = objectTypeService.create_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update existing object type
@app.route('/api/objectType/updateObjectType', methods=['POST'])
@flask_login.login_required
def update_object_type():
    object_type = Object_type.from_json(request.get_json())
    success, msg, status = objectTypeService.update_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Delete object
@app.route('/api/objectType/removeObjectType', methods=['POST'])
@flask_login.login_required
def remove_object_type():
    req_data = request.get_json()
    object_type = Object_type(req_data['type'], req_data['datasetType'])
    success, msg, status = objectTypeService.remove_object_type(object_type)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ACTIVITIES ####

# Get activities list
@app.route("/api/activity/getActivities", methods=['GET'])
@flask_login.login_required
def get_activities():
    # dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = activity_service.get_activities()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create a new Activity
@app.route("/api/activity/createActivity", methods=['POST'])
@flask_login.login_required
def create_activity():
    req_data = request.get_json()
    activity = Activity(req_data['activity'])
    success, msg, status = activity_service.create_activity(activity)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing activity
@app.route("/api/activity/removeActivity", methods=['POST'])
@flask_login.login_required
def remove_activity():
    req_data = request.get_json()
    activity = Activity(req_data['activity'])
    success, msg, status = activity_service.remove_activity(activity)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### ACTIONS ####

# Get action for specific user and frame range
@app.route("/api/action/getAction", methods=['GET'])
@flask_login.login_required
def get_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    action = Action(request.headers['name'], dataset, request.headers['objectUID'], request.headers['user'],
                    request.headers['startFrame'], request.headers['endFrame'])
    success, msg, status = actionService.get_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get actions for specific user and frame range
@app.route("/api/action/getActions", methods=['GET'])
@flask_login.login_required
def get_actions():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = actionService.get_actions(dataset, request.headers['user'], request.headers['startFrame'], request.headers['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get actions for specific object, user and frame range
@app.route("/api/action/getActionsByUID", methods=['GET'])
@flask_login.login_required
def get_actions_by_UID():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = actionService.get_actions_by_UID(dataset, request.headers['objectUID'], request.headers['user'],
                                                         request.headers['startFrame'], request.headers['endFrame'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Create new action for specific user
@app.route('/api/action/createAction', methods=['POST'])
@flask_login.login_required
def create_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    action = Action(req_data['name'], dataset, req_data['objectUID'], req_data['user'], req_data['startFrame'], req_data['endFrame'])
    success, msg, status = actionService.create_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove an action
@app.route('/api/action/removeAction', methods=['POST'])
@flask_login.login_required
def remove_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    action = Action(req_data['name'], dataset, req_data['objectUID'], req_data['user'], req_data['startFrame'], req_data['endFrame'])
    success, msg, status = actionService.remove_action(action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Merge actions with same start and end frames (no login required)
@app.route('/api/action/mergeActions', methods=['POST'])
def merge_actions():
    success, msg, status = actionService.merge_actions()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### AIK and OPENCV computations ####

# Given uid and type object, video, dataset, user and range of frames -> Returns the proyected points
@app.route('/api/aik/projectToCamera', methods=['GET'])
@flask_login.login_required
def project_to_camera_2():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    object = Object(request.headers['uidObject'],  request.headers['objectType'], dataset_type=dataset.type)
    start_annotation = Annotation(dataset, dataset.name, request.headers['startFrame'], request.headers['user'], [object])
    end_annotation = Annotation(dataset, dataset.name, request.headers['endFrame'], request.headers['user'], [object])
    success, msg, status = aikService.project_to_camera_2(int(request.headers['cameraName']), request.headers['objectType'],
                                                          start_annotation, end_annotation)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


@app.route('/api/aik/computeEpiline', methods=['GET'])
@flask_login.login_required
def compute_epiline():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    frame1 = Frame(request.headers['frame'], request.headers['cam1'], dataset)
    frame2 = Frame(request.headers['frame'], request.headers['cam2'], dataset)
    el1, el2 = aikService.compute_epiline(request.headers['point'], frame1, frame2)
    return json.dumps({'success': True, 'msg': {'el1': el1, 'el2': el2}}), 200, {'ContentType': 'application/json'}


# Return 6 mugshot of person uid from different cameras
@app.route('/api/aik/getMugshot', methods=['GET'])
@flask_login.login_required
def get_mugshot():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = aikService.get_mugshot(dataset, request.headers['scene'], request.headers['user'],
                                                  int(request.headers['uid']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### FRAME ####

# Get frame
@app.route("/api/frame/getFrame", methods=['GET'])
@flask_login.login_required
def get_frame():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    frame = Frame(request.headers['frame'], request.headers['video'], dataset)
    success, msg, status = frameService.get_frame(frame)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get info of all frames
@app.route("/api/frame/getFrames", methods=['GET'])
@flask_login.login_required
def get_frames():
    #TODO change dataset
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    video = Video(request.headers['video'], dataset)
    success, msg, status = frameService.get_frames(video)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove existing frame for specific user
@app.route('/api/frame/removeFrame', methods=['POST'])
@flask_login.login_required
def remove_frame():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    frame = Frame(req_data['frame'], req_data['video'], dataset)
    success, msg, status = frameService.remove_frame(frame)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get initial and ending frame number of a video
@app.route('/api/frame/getFrameInfoOfDataset', methods=['GET'])
@flask_login.login_required
def get_frames_info_of_dataset_group_by_video():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = frameService.get_frames_info_of_dataset_group_by_video(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### POSE PROPERTY ####

# Get pose properties for specific dataset
@app.route("/api/poseProperty/getPoseProperties/dataset", methods=['GET'])
@flask_login.login_required
def get_pose_properties_by_dataset():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = pose_property_service.get_pose_properties_by_dataset(dataset, request.headers['scene'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Get pose property for specific uid and dataset
@app.route("/api/poseProperty/getPoseProperty/uid", methods=['GET'])
@flask_login.login_required
def get_pose_property_by_uid():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = pose_property_service.get_pose_property_by_uid(dataset, request.headers['scene'],
                                                                          request.headers['objectType'], int(request.headers['uidObject']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Update/Create new pose property
@app.route('/api/poseProperty/updatePoseProperty', methods=['POST'])
@flask_login.login_required
def update_pose_property():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    pose_property = PoseProperty(dataset, req_data['scene'], req_data['objectType'], req_data['uidObject'], req_data['lowerLegLength'],
                                 req_data['upperLegLength'], req_data['lowerArmLength'], req_data['upperArmLength'])
    success, msg, status = pose_property_service.update_pose_property(pose_property)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove a pose properties
@app.route('/api/poseProperty/removePoseProperty', methods=['POST'])
@flask_login.login_required
def remove_pose_property():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = pose_property_service.remove_pose_property(dataset, req_data['scene'],
                                                                      req_data['objectType'], int(req_data['uidObject']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Initialize pose properties to -1
@app.route('/api/poseProperty/initializePoseProperties', methods=['POST'])
@flask_login.login_required
def initialize_pose_properties():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    success, msg, status = pose_property_service.initialize_pose_properties(dataset, req_data['scene'], req_data['objectType'])
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


#### USER ACTIONS ####

# Get user actions for specific user and dataset
@app.route("/api/userAction/getUserActions/user", methods=['GET'])
@flask_login.login_required
def get_user_action_by_user():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_user(dataset, request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Get user actions for specific action and dataset
@app.route("/api/userAction/getUserActions/action", methods=['GET'])
@flask_login.login_required
def get_user_action_by_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_action(dataset, request.headers['action'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Get user actions for specific user, action and dataset
@app.route("/api/userAction/getUserActions/user/action", methods=['GET'])
@flask_login.login_required
def get_user_action_by_user_action():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_action_by_user_action(dataset, request.headers['user'],
                                                                              request.headers['action'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Get user actions for specific dataset
@app.route("/api/userAction/getUserActions", methods=['GET'])
@flask_login.login_required
def get_user_actions():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_user_actions(dataset)
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Create new action for specific user
@app.route('/api/userAction/createUserAction', methods=['POST'])
@flask_login.login_required
def create_user_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    user_action = UserAction(req_data['user'], req_data['action'], req_data['scene'], dataset)
    success, msg, status = user_action_service.create_user_action(user_action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Remove an action
@app.route('/api/userAction/removeUserAction', methods=['POST'])
@flask_login.login_required
def remove_user_action():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], req_data['datasetType'])
    user_action = UserAction(req_data['user'], req_data['action'], req_data['scene'], dataset, req_data['timestamp'])
    success, msg, status = user_action_service.remove_user_action(user_action)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Return number of actions per session (for one user)
@app.route("/api/userAction/getStatistic/actions/session", methods=['GET'])
@flask_login.login_required
def get_statistic_actions_per_session():
    success, msg, status = user_action_service.get_statistic_actions_per_session(request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return number of actions per day (for one user)
# Filter by dataset if dataset is not None
@app.route("/api/userAction/getStatistic/actions/day", methods=['GET'])
@flask_login.login_required
def get_statistic_actions_per_day():
    success, msg, status = user_action_service.get_statistic_actions_per_day(request.headers['user'], request.headers['dataset'],
                                                                       request.headers['datasetType'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return average actions per minute (for one user)
# If user == None --> return avg for each user associated to the dataset
@app.route("/api/userAction/getStatistic/avg/actions/minute", methods=['GET'])
@flask_login.login_required
def get_statistic_avg_actions_per_minute():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_statistic_avg_actions_per_minute(dataset, request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return total hours worked per week (for one user)
@app.route("/api/userAction/getStatistic/hours/week", methods=['GET'])
@flask_login.login_required
def get_statistic_hours_per_week():
    success, msg, status = user_action_service.get_statistic_hours_per_week(request.headers['user'])
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return time between first and last annotation for each scene (in posetrack)
@app.route("/api/userAction/getStatistic/time/scene", methods=['GET'])
@flask_login.login_required
def get_statistic_time_per_scene():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_statistic_time_per_scene(dataset)
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return max, mix and average time to annotate the scenes in the dataset (in posetrack)
@app.route("/api/userAction/getStatistic/stats/time/scenes", methods=['GET'])
@flask_login.login_required
def get_statistic_stats_per_scenes():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_statistic_stats_per_scenes(dataset)
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


# Return max, mix and average time divided by the number of persons within a sequence to annotate the scenes in PT
@app.route("/api/userAction/getStatistic/stats/time/scenes/persons", methods=['GET'])
@flask_login.login_required
def get_statistic_stats_per_scenes_per_persons():
    dataset = Dataset(request.headers['dataset'], request.headers['datasetType'])
    success, msg, status = user_action_service.get_statistic_stats_per_scenes_per_persons(dataset)
    return json.dumps({'success': success, 'msg': msg}, default=str), status, {'ContentType': 'application/json'}


######## NOTIFICATION SYSTEM ##########
# Global variable to store de notification data
showNotification = False
notificationMessage = ""

@app.route("/api/notification/update", methods=['POST'])
@flask_login.login_required
def update_notification_state():
    global showNotification, notificationMessage
    request_data = request.get_json()
    showNotification = request_data['showNotification']
    notificationMessage = request_data['notificationMessage']

    return json.dumps({'success': True, 'msg': ""}, default=str), 200, {'ContentType': 'application/json'}


@app.route("/api/notification/obtain", methods=['GET'])
def get_notification_state():
    global showNotification, notificationMessage
    return json.dumps({'success': True, 'msg': {'showNotification': showNotification,
          'notificationMessage': notificationMessage}}, default=str), 200, {'ContentType': 'application/json'}

######################################################################################################################


# Update camera calibration parameters
@app.route('/api/frame/updateCameraCalibration', methods=['POST'])
@flask_login.login_required
def update_camera_calibration():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], 'actionInKitchen')
    success, msg, status = frameService.update_camera_calibration(dataset)
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


## USE ONLY IN CASE OF ERROR UPLOADING FRAMES
# Remove and insert new frames for one video and dataset
@app.route('/api/dataset/insertFramesError', methods=['POST'])
@flask_login.login_required
def insert_frames():
    req_data = request.get_json()
    dataset = Dataset(req_data['dataset'], 'actionInKitchen')
    success, msg, status = datasetService.insert_frames(dataset, int(req_data['video']))
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


# Load person_ids from a hardcoded local JSON file
@app.route('/api/loadPersonIDs', methods=['POST'])
def load_person_ids():
    success, msg, status = annotationService.load_person_ids()
    return json.dumps({'success': success, 'msg': msg}), status, {'ContentType': 'application/json'}


if __name__ == "__main__":
    app.run(host=cfg.app["ip"], port=cfg.app["port"])
