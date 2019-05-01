import logging

from python.infrastructure.videoManager import VideoManager
from python.infrastructure.objectManager import ObjectManager

# AnnotationService logger
log = logging.getLogger('annotationService')

videoManager = VideoManager()
objectManager = ObjectManager()

class AnnotationService:

    # Get annotation info for given frame
    def getAnnotation(this, video, frame):
        result = videoManager.getAnnotation(video, frame)
        if result == 'Error':
            return False, 'The frame does not have an annotation', 400
        else:
            return True, result, 200

    # Save annotation info for given frame
    def uploadAnnotation(this, req):
        result, e = videoManager.uploadAnnotation(req['video'], req['frame'], req['objects'])
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
    def createAnnotationObject(this, req):
        result, e = objectManager.createObject(req['type'], req['nkp'], req['labels'])
        if result == 'ok':
            return True, result, 200
        else:
            log.exception(result, e)
            return False, result, 500
