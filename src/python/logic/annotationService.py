import logging

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectManager import ObjectManager

# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectManager = ObjectManager()


class AnnotationService:

    # Get annotation info for given frame, dataset, video and user
    def getAnnotation(this, dataset, video, frame, user):
        result = annotationManager.getAnnotation(dataset, video, frame, user)
        if result == 'Error':
            return False, 'The frame does not have an annotation', 400
        else:
            return True, result, 200

    # Return 'ok' if the annotation has been updated
    def createAnnotation(this, req):
        result = annotationManager.updateAnnotation(req['dataset'], req['video'], req['frame'], req['user'],
                                                    req['objects'], req['validated'], req['keypointDim'])
        if result == 'Error':
            return False, 'Error creating annotation', 400
        else:
            return True, result, 200

    # Return 'ok' if the annotation has been updated
    def updateAnnotation(this, req):
        result = annotationManager.updateAnnotation(req['dataset'], req['video'], req['frame'], req['user'], req['objects'])
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

    # Return 'ok' if the validated flag of an annotation has been updated
    # def updateValidation(this, req):
    #     result = annotationManager.updateValidation(req['dataset'], req['video'], req['frame'],  req['user'], req['validated'])
    #     if result == 'Error':
    #         return False, 'Error updating validated flag of annotation', 400
    #     else:
    #         return True, result, 200

    # Save annotation info for given frame
    def uploadAnnotation(this, req):
        result, e = annotationManager.uploadAnnotation(req['video'], req['frame'], req['keypointDim'], req['objects'])
        if result == 'ok':
            return True, result, 200
        else:
            log.exception(result, e)
            return False, result, 500

    # Get annotation of object in frame
    def getAnnotationFrameObject(this, video, frame, obj):
        result = annotationManager.getFrameObject(video, frame, obj)
        if result == 'Error':
            return False, 'The object does not exist in frame '+frame, 400
        else:
            return True, result, 200

    # Store annotation for an object in a frame
    def uploadAnnotationFrameObject(this, req):
        result, e = annotationManager.uploadFrameObject(req['video'], req['frame'], req['keypointDim'], req['objects'])
        if result == 'ok':
            return True, result, 200
        else:
            log.exception(result, e)
            return False, result, 500

    # Get annotation object by type
    def getAnnotationObject(this, type):
        result = objectManager.getObject(type)
        if result == 'Error':
            return False, 'The object does not exist', 400
        else:
            return True, result, 200

    # Create annotation object
    def uploadAnnotationObject(this, req):
        result, e = objectManager.createObject(req['type'], req['nkp'], req['labels'])
        if result == 'ok':
            return True, result, 200
        else:
            log.exception(result, e)
            return False, result, 500
