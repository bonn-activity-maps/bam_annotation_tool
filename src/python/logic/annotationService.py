import logging

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectManager import ObjectManager

# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectManager = ObjectManager()


class AnnotationService:

    # Get annotation info for given frame, dataset, video and user
    # TODO: pass objects to 2d for AIK
    def getAnnotation(this, dataset, video, frame, user):
        result = annotationManager.getAnnotation(dataset, video, frame, user)
        if result == 'Error':
            return False, 'The frame does not have an annotation', 400
        else:
            return True, result, 200

    # Get annotations  (all frames) for given dataset, video which are validated and ready to export (user = Root)
    def getAnnotations(this, dataset, video):
        result = annotationManager.getAnnotations(dataset, video, "Root", "correct")
        if result == 'Error':
            return False, 'The video in dataset does not have the final annotations', 400
        else:
            return True, result, 200

    # # Return 'ok' if the annotation has been updated
    # def createAnnotation(this, req):
    #     result = annotationManager.updateAnnotation(req['dataset'], req['video'], req['frame'], req['user'],
    #                                                 req['objects'], req['validated'], req['keypointDim'])
    #     if result == 'Error':
    #         return False, 'Error creating annotation', 400
    #     else:
    #         return True, result, 200

    # Return 'ok' if the annotation has been updated
    # TODO: pass objects to 3d for AIK
    def updateAnnotation(this, dataset, video, frame, user, objects):
        # print(objects)
        # Create new objects uid
        # Get max of this dataset

        result = annotationManager.updateAnnotation(dataset, video, frame, user, objects)
        if result == 'Error':
            return False, 'Error updating annotation', 400
        else:
            return True, result, 200

    # Return 'ok' if the annotation has been removed
    def removeAnnotation(this, req):
        result = annotationManager.removeAnnotation(req['dataset'], req['video'], req['frame'], req['user'])
        if result == 'Error':
            return False, 'Error deleting annotation', 400
        else:
            return True, result, 200

    # Return 'ok' if the validated flags have been updated properly in all cases
    def updateValidation(this, req):
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
    def getNewUidObject(this, dataset):
        result = annotationManager.maxUidObjectDataset(dataset)
        if result == 'Error':
            return False, 'Error getting max uid object for dataset in db', 400
        else:
            return True, result+1, 200


##############################

    # Get annotation of object in frame
    def getAnnotationFrameObject(this, dataset, video, frame, user, obj):
        result = annotationManager.getFrameObject(dataset, video, frame, user, obj)
        if result == 'Error':
            return False, 'The object does not exist in frame '+frame, 400
        else:
            return True, result, 200

    # Store annotation for an object for given frame, dataset, video and user
    # If the object does not exist, it's stored in db
    def updateAnnotationFrameObject(this, req):
        # Read uid object  and check if it exists
        uidObj = req['objects'][0]["uid"]
        found = annotationManager.getFrameObject(req['dataset'], req['video'], req['frame'], req['user'], uidObj)

        if found == 'ok':   # Update existing object in frame
            result = annotationManager.updateFrameObject(req['dataset'], req['video'], req['frame'], req['user'], req['objects'])
        else:               # Add new object in frame
            result = annotationManager.createFrameObject(req['dataset'], req['video'], req['frame'], req['user'], req['objects'])

        if result == 'ok':
            return True, result, 200
        else:
            return False, result, 500

    # Remove annotation for an object for given frame, dataset, video and user
    def removeAnnotationFrameObject(this, req):
        result = annotationManager.removeFrameObject(req['dataset'], req['video'], req['frame'], req['user'], req['uidObject'])
        if result == 'ok':
            return True, result, 200
        else:
            return False, result, 500

