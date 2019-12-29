import logging
import numpy as np
import os, json

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectTypeManager import ObjectTypeManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager
from python.logic.aikService import AIKService

from python.objects.frame import Frame

# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectTypeManager = ObjectTypeManager()
frameManager = FrameManager()
actionManager = ActionManager()
datasetManager = DatasetManager()
aikService = AIKService()


class AnnotationService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the annotations
    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def pad(self, num, size):
        s = str(num)
        while len(s) < size:
            s = "0" + s
        return s

    def generateNewOriginalUid(self, track_id, video, frame):
        frame = self.pad(frame, 4)
        track_id = self.pad(track_id, 2)
        return int("1" + video + frame + track_id)

    # Get annotation info for given frame, dataset, video and user
    def getAnnotation(self, dataset, datasetType, scene, frame, user):
        result = annotationManager.getAnnotation(dataset, datasetType, scene, frame, user)
        if result == 'Error':
            return False, 'Error retrieving annotation', 400
        else:
            return True, result, 200

    # Get annotation info for given frame range, dataset, video and user
    def getAnnotationsByFrameRange(self, dataset, datasetType, scene, startFrame, endFrame, user):
        result = annotationManager.getAnnotationsByFrameRange(dataset, datasetType, scene, startFrame, endFrame, user)
        if result == 'Error':
            return False, 'Error retrieving annotations', 400
        else:
            return True, result, 200

    # Get annotations  (all frames) for given dataset, video which are validated and ready to export (user = Root)
    def getAnnotations(self, dataset, datasetType, video, user):
        result = annotationManager.getAnnotations(dataset, datasetType, video, user, "correct")
        if result == 'Error':
            return False, 'Error retrieving annotations', 400
        else:
            return True, result, 200

    # Get all annotated objects for dataset, scene and user
    def getAnnotatedObjects(self, dataset, datasetType, scene, user):
        result = annotationManager.getAnnotatedObjects(dataset, datasetType, scene, user)
        if result == 'Error':
            return False, 'Error retrieving annotated objects', 400
        else:
            return True, result, 200

    # Triangulate points from 2D points to 3D
    def obtain3dPointsAIK(self, frame, dataset, objects):
        keypoints2d = objects["keypoints"]
        keypoints3d = []  # New 3d kps

        # Triangulate all keypoints of object
        for kp in keypoints2d:
            # Keypoints and camera parameters to triangulate
            keypointsTriangulate = []
            cameraParamsTriangulate = []

            # Add existing points to triangulate (max 4 points)
            if kp["cam1"] != "":
                f = Frame(frame, kp["cam1"], dataset, dataset_type='actionInKitchen')
                frame1 = frameManager.get_frame(f)
                keypointsTriangulate.append(kp["p1"])
                cameraParamsTriangulate.append(frame1.camera_parameters)

            if kp["cam2"] != "":
                f = Frame(frame, kp["cam2"], dataset, dataset_type='actionInKitchen')
                frame2 = frameManager.get_frame(f)
                keypointsTriangulate.append(kp["p2"])
                cameraParamsTriangulate.append(frame2.camera_parameters)

            if kp["cam3"] != "":
                f = Frame(frame, kp["cam3"], dataset, dataset_type='actionInKitchen')
                frame3 = frameManager.get_frame(f)
                keypointsTriangulate.append(kp["p3"])
                cameraParamsTriangulate.append(frame3.camera_parameters)

            if kp["cam4"] != "":
                f = Frame(frame, kp["cam4"], dataset, dataset_type='actionInKitchen')
                frame4 = frameManager.get_frame(f)
                keypointsTriangulate.append(kp["p4"])
                cameraParamsTriangulate.append(frame4.camera_parameters)

            if len(keypointsTriangulate) == 0:  # If 0 points, let the keypoint empty
                keypointsTriangulate.append([])
                cameraParamsTriangulate.append([])
            elif len(keypointsTriangulate) < 2:  # Error if only 1 points
                return objects, True
            else:  # Triangulate using all available points
                point3d = aikService.triangulate_2D_points(keypointsTriangulate, cameraParamsTriangulate)
                keypoints3d.append(point3d.tolist())  # Store 3d point

        # Modify original objects which contains info of object with calculated 3d keypoints
        objects["keypoints"] = keypoints3d
        return objects, False

    # Return the object with the 3d points for AIK datasets
    def updateAnnotationAIK(self, dataset, frame, objects):

        # Triangulate points from 2D points to 3D if dataset is AIK
        objects, errorFlag = self.obtain3dPointsAIK(frame, dataset, objects)

        # If the object is not a person -> we have to calculate 8 points for the box of object
        if objects['type'] != 'personAIK' and not errorFlag:
            kp1, kp2, kp3 = np.asarray(objects['keypoints'])
            objects['keypoints'] = aikService.create_box(kp1, kp2, kp3).tolist()
        return objects, errorFlag

    # Return 'ok' if the annotation has been updated
    def updateAnnotation(self, dataset, datasetType, scene, frame, user, objects):

        # Triangulate points from 2D points to 3D if dataset is AIK
        if datasetType == self.aik:
            objects, errorFlag = self.updateAnnotationAIK(dataset, frame, objects)

            if errorFlag:
                return False, 'Error incorrect keypoints', 400

            # Update only one object in the annotation for concrete frame
            result = self.updateAnnotationFrameObject(dataset, scene, frame, user, objects, datasetType)
            if result == 'Error':
                return False, 'Error updating annotation', 400
            else:
                return True, result, 200
        elif datasetType == self.pt:
            for object in objects:
                result = self.updateAnnotationFrameObject(dataset, scene, frame, user, object, datasetType)
                if result == 'Error':
                    return False, 'Error updating annotation', 400
        return True, 'Ok', 200

    # Return 'ok' if the annotation has been updated
    # Same as above but for PoseTrack
    def updateAnnotationPT(self, dataset, datasetType, scene, frame, user, object, points):
        keypoints = []
        for point in points:
            keypoints.append(point["points"][0])
        object["keypoints"] = keypoints
        object["category_id"] = 1
        result = self.updateAnnotationFrameObject(dataset, scene, frame, user, object, datasetType)
        if result == 'Error':
            return False, 'Error updating annotation', 400
        return True, 'Ok', 200

    # Return 'ok' if the annotation has been removed
    def removeAnnotation(self, dataset, scene, frame, user):
        result = annotationManager.removeAnnotation(dataset, scene, frame, user)
        if result == 'Error':
            return False, 'Error deleting annotation', 400
        else:
            return True, result, 200

    # Return 'ok' if the validated flags have been updated properly in all cases
    def updateValidation(self, req):
        # frames: [[1, 2, ..],[3,..], ...], validated: ["correct", "incorrect", ..]
        # Each validated flag corresponds to an array of frames (the same position)
        # All frames in an array have to be modified with its correspondent flag
        result = []
        for i, v in enumerate(req['validated']):
            result.append(
                annotationManager.updateValidation(req['dataset'], req['video'], req['frames'][i], req['user'], v))

        # Return 'ok' only if all results are correct ('ok')
        if result.count(result[0]) == len(result) and result[0] == 'ok':
            return True, 'ok', 200
        else:
            return False, 'Error updating validated flag of annotation. Some flags could have not changed', 400

    # Return new uid for an object in annotations for a dataset to avoid duplicated uid objects
    def createNewUidObject(self, dataset, datasetType, scene, frame, user, objectType):
        maxUid = annotationManager.maxUidObjectDataset(dataset)

        if maxUid == 'Error':
            return False, 'Error getting max uid object for dataset in db', 400
        else:
            # Create new object with maxUid+1
            newUid = maxUid + 1
            objects = {'uid': newUid, 'type': objectType, 'keypoints': []}
            result = annotationManager.createFrameObject(dataset, scene, frame, user, objects, datasetType)

            if result == 'Error':
                return False, 'Error creating new object in annotation', 400
            else:
                return True, {'maxUid': newUid}, 200

    # Get annotation of object in frame
    def getAnnotationFrameObject(self, dataset, datasetType, scene, startFrame, endFrame, user, obj, objectType):
        result = annotationManager.getObjectInFrames(dataset, datasetType, scene, startFrame, endFrame, user, obj, objectType)
        if result == 'Error':
            return False, 'The object does not exist in frames', 400
        else:
            return True, result, 200

    # Store annotation for an object for given frame, dataset, video and user
    # If the object does not exist, it's stored in db
    def updateAnnotationFrameObject(self, dataset, scene, frame, user, objects, datasetType=None):
        # Read uid object  and check if it exists
        uidObj = objects["uid"]
        type = objects["type"]

        found = annotationManager.getFrameObject(dataset, datasetType, scene, frame, user, uidObj, type)

        if found == 'Error':
            return 'Error'
        elif found == 'No annotation':  # Add new existing object in frame
            result = annotationManager.createFrameObject(dataset, scene, frame, user, objects, datasetType)
        else:  # Update object in frame
            if datasetType == 'poseTrack' and found['type'] != objects['type']:
                result = annotationManager.createFrameObject(dataset, scene, frame, user, objects, datasetType)
            else:
                result = annotationManager.updateFrameObject(dataset, scene, frame, user, objects, datasetType)

        return result

    # Remove annotation for an object for given frame, dataset, video and user
    def removeAnnotationFrameObject(self, dataset, datasetType, scene, startFrame, endFrame, user, uidObject, objectType):
        # PT: the uidObject change for each frame, iterate for all frames with the corresponding id
        if datasetType == self.pt:
            result = 'ok'
            for f in range(startFrame, endFrame+1):
                originalUid = self.generateNewOriginalUid(uidObject, scene, f)
                r = annotationManager.remove_frameObject(dataset, datasetType, scene, f, f, user, originalUid, objectType)
                if r == 'Error': result = 'Error'
        else:
            result = annotationManager.remove_frameObject(dataset, datasetType, scene, startFrame, endFrame, user, uidObject, objectType)

        if result == 'ok':
            return True, result, 200
        else:
            return False, 'Error deleting annotation', 500

    # Interpolate all keypoints between 2 points
    def interpolate(self, numFrames, numKpts, kpDim, kps1, kps2):
        # Structure to store all keypoints ordered by frame (row: frame, column:kpt)
        finalKpts = np.zeros((numFrames, numKpts, 3)) if kpDim == 3 else np.zeros((numFrames, numKpts, 2))

        # Interpolate for all keypoints in all frames in between
        for i in range(numKpts):
            interpolatedKps = []

            # Interpolate each coordinate of keypoint
            for j in range(kpDim):
                interpolatedCoords = np.linspace(kps1[i][j], kps2[i][j], num=numFrames)
                interpolatedKps.append(interpolatedCoords)

            interpolatedKps = np.asarray(interpolatedKps)

            # Build interpolated keypoints for each frame
            for k in range(len(interpolatedKps[0])):
                finalKpts[k, i] = interpolatedKps[:, k]

        return finalKpts

    # Interpolate and store the interpolated 3d points
    def interpolateAnnotation(self, dataset, scene, user, startFrame, endFrame, uidObject, objectType,
                              uidObject2):
        # Search object in respective start and end frames
        obj1 = annotationManager.getFrameObject(dataset.name, dataset.type, scene, startFrame, user, uidObject, objectType) \
            if dataset.type == self.aik \
            else annotationManager.getFrameObject(dataset, dataset.type, scene, startFrame, user, uidObject2, objectType)
        obj2 = annotationManager.getFrameObject(dataset, dataset.type, scene, endFrame, user, uidObject, objectType)

        type = obj1['type']
        kps1 = obj1['keypoints']
        kps2 = obj2['keypoints']

        numFrames = endFrame - startFrame + 1
        numKpts = len(kps1)
        finalResult = 'ok'

        # Final keypoints
        finalKpts = self.interpolate(numFrames, numKpts, dataset.keypoint_dim, kps1, kps2)

        # Store interpolated keypoints for frames in between (avoid start and end frame)
        for i in range(1, finalKpts.shape[0] - 1):
            if datasetType == self.pt:
                obj = {'uid': self.generateNewOriginalUid(abs(uidObject) % 100, scene, startFrame + i), 'type': type, 'keypoints': finalKpts[i].tolist()}
            else:
                obj = {'uid': uidObject, 'type': type, 'keypoints': finalKpts[i].tolist()}
            result = self.updateAnnotationFrameObject(dataset, scene, startFrame + i, user, obj, dataset.type)
            if result == 'Error':
                finalResult = 'There was some error interpolating the keypoints, please check them'

        if finalResult == 'ok':
            return True, finalResult, 200
        else:
            log.error('Error interpolating keypoints')
            return False, finalResult, 500

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if has been some problem
    def add_annotations_AIK(self, dataset, dir):
        listDir = os.listdir(dir)   # List of all objects/persons
        type = 'personAIK'          # Type of objects
        finalResult = True

        for f in listDir:
            trackFile = os.path.join(dir, f)

            # Read uid/number of object
            uid = int(os.path.splitext(f)[0].split('track')[1])

            # Read data from file
            try:
                with open(trackFile) as jsonFile:
                    tracks = json.load(jsonFile)
            except OSError:
                log.exception('Could not read from file')
                return False

            # Transform annotation to our format and store in db
            frames = tracks['frames']
            poses = tracks['poses']
            for i, frame in enumerate(frames):
                keypoints = poses[i]
                objects = {"uid": uid, "type": type, "keypoints": keypoints}
                result = self.updateAnnotationFrameObject(dataset, dataset, frame, 'root', objects)
                if result == 'Error':
                    finalResult = False   # finalResult False if there is some problem

        return finalResult