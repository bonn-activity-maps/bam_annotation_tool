import logging
import numpy as np

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectTypeManager import ObjectTypeManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager
from python.logic.aikService import AIKService

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

    # Get annotation info for given frame, dataset, video and user
    def getAnnotation(self, dataset, datasetType, scene, frame, user):
        result = annotationManager.getAnnotation(dataset, datasetType, scene, frame, user)
        if result == 'Error':
            return False, 'The frame does not have an annotation', 400
        else:
            return True, result, 200

    # Get annotations  (all frames) for given dataset, video which are validated and ready to export (user = Root)
    def getAnnotations(self, dataset, datasetType, video, user):
        result = annotationManager.getAnnotations(dataset, datasetType, video, user, "correct")
        if result == 'Error':
            return False, 'The video in dataset does not have the final annotations', 400
        else:
            return True, result, 200

    # Get all annotated objects for dataset, scene and user
    def getAnnotatedObjects(self, dataset, scene, user, datasetType):
        # print("Looking for Annotated Objects ", dataset, scene, user)
        result = annotationManager.getAnnotatedObjects(dataset, scene, user, datasetType)
        # print("Got Annotated objects: ", result)
        if result == 'Error':
            return False, 'Error retrieving annotated objects', 400
        else:
            return True, result, 200

    # # Return 'ok' if the annotation has been updated
    # def createAnnotation(self, req):
    #     result = annotationManager.updateAnnotation(req['dataset'], req['video'], req['frame'], req['user'],
    #                                                 req['objects'], req['validated'], req['keypointDim'])
    #     if result == 'Error':
    #         return False, 'Error creating annotation', 400
    #     else:
    #         return True, result, 200

    # Triangulate points from 2D points to 3D
    def obtain3dPointsAIK(self, frame, dataset, objects):
        keypoints2d = objects["keypoints"]
        keypoints3d = []                        # New 3d kps

        # Triangulate all keypoints of object
        for kp in keypoints2d:
            # Keypoints and camera parameters to triangulate
            keypointsTriangulate = []
            cameraParamsTriangulate = []

            # Add existing points to triangulate (max 4 points)
            if kp["cam1"] != "":
                frame1 = frameManager.getFrame(frame, int(kp["cam1"]), dataset)
                keypointsTriangulate.append(kp["p1"])
                cameraParamsTriangulate.append(frame1["cameraParameters"])

            if kp["cam2"] != "":
                frame2 = frameManager.getFrame(frame, int(kp["cam2"]), dataset)
                keypointsTriangulate.append(kp["p2"])
                cameraParamsTriangulate.append(frame2["cameraParameters"])

            if kp["cam3"] != "":
                frame3 = frameManager.getFrame(frame, int(kp["cam3"]), dataset)
                keypointsTriangulate.append(kp["p3"])
                cameraParamsTriangulate.append(frame3["cameraParameters"])

            if kp["cam4"] != "":
                frame4 = frameManager.getFrame(frame, int(kp["cam4"]), dataset)
                keypointsTriangulate.append(kp["p4"])
                cameraParamsTriangulate.append(frame4["cameraParameters"])

            if len(keypointsTriangulate) == 0:      # If 0 points, let the keypoint empty
                keypointsTriangulate.append([])
                cameraParamsTriangulate.append([])
            elif len(keypointsTriangulate) < 2:     # Error if only 1 points
                return objects, True
            else:                                   # Triangulate using all available points
                point3d = aikService.triangulate2DPoints(keypointsTriangulate, cameraParamsTriangulate)
                keypoints3d.append(point3d.tolist())    # Store 3d point

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
            objects['keypoints'] = aikService.createBox(kp1, kp2, kp3).tolist()
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
            result.append(annotationManager.updateValidation(req['dataset'], req['video'], req['frames'][i], req['user'], v))

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
    def getAnnotationFrameObject(self, dataset, datasetType, scene, frame, user, obj, objectType=None):
        result = annotationManager.getFrameObject(dataset, datasetType, scene, frame, user, obj, objectType)
        if result == 'Error':
            return False, 'The object does not exist in frame '+frame, 400
        else:
            return True, result, 200


    # Store annotation for an object for given frame, dataset, video and user
    # If the object does not exist, it's stored in db
    def updateAnnotationFrameObject(self, dataset, scene, frame, user, objects, datasetType=None):
        # Read uid object  and check if it exists
        uidObj = objects["uid"]
        found = annotationManager.getFrameObject(dataset, datasetType, scene, frame, user, uidObj)

        if found == 'Error':
            return 'Error'
        elif found == 'No annotation':   # Add new existing object in frame
            result = annotationManager.createFrameObject(dataset, scene, frame, user, objects, datasetType)
        else:   # Update object in frame
            if datasetType == 'poseTrack' and found['type'] != objects['type']:
                result = annotationManager.createFrameObject(dataset, scene, frame, user, objects, datasetType)
            else:
                result = annotationManager.updateFrameObject(dataset, scene, frame, user, objects, datasetType)

        return result

    # Remove annotation for an object for given frame, dataset, video and user
    def removeAnnotationFrameObject(self, req):
        result = annotationManager.removeFrameObject(req['dataset'], req['video'], req['frame'], req['user'], req['uidObject'])
        if result == 'ok':
            return True, result, 200
        else:
            return False, result, 500

    # Interpolate all keypoints between 2 points
    def interpolate(self, numFrames, numKpts, kpDim, kps1, kps2):
        # Structure to store all keypoints ordered by frame (row: frame, column:kpt)
        finalKpts = np.zeros((numFrames, numKpts, 3))

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
                finalKpts[k,i] = interpolatedKps[:,k]

        return finalKpts

    # Interpolate and store the interpolated 3d points
    def interpolateAnnotation(self, dataset, datasetType, scene, user, startFrame, endFrame, uidObject):
        # Search object in respective start and end frames
        obj1 = annotationManager.getFrameObject(dataset, datasetType, scene, startFrame, user, uidObject)
        obj2 = annotationManager.getFrameObject(dataset, datasetType, scene, endFrame, user, uidObject)

        type = obj1['type']
        kps1 = obj1['keypoints']
        kps2 = obj2['keypoints']

        numFrames = endFrame-startFrame+1
        numKpts = len(kps1)
        kpDim = int(datasetManager.getDataset(dataset)['keypointDim'])
        finalResult = 'ok'

        # Final keypoints
        finalKpts = self.interpolate(numFrames, numKpts, kpDim, kps1, kps2)

        # Store interpolated keypoints for frames in between (avoid start and end frame)
        for i in range(1, finalKpts.shape[0]-1):
            obj = {'uid': uidObject, 'type': type, 'keypoints': finalKpts[i].tolist()}

            result = self.updateAnnotationFrameObject(dataset, scene, startFrame + i, user, obj, datasetType)
            if result == 'Error':
                finalResult = 'There was some error interpolating the keypoints, please check them'

        if finalResult == 'ok':
            return True, finalResult, 200
        else:
            log.error('Error interpolating keypoints')
            return False, finalResult, 500

