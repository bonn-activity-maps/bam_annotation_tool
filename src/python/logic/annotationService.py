import logging

from python.infrastructure.annotationManager import AnnotationManager

# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()

class AnnotationService:

    # Get annotation info for given frame
    def getAnnotation(this, video, frame):
        return annotationManager.getAnnotation(video, frame)

    # Save annotation info for given frame
    def uploadAnnotation(this, req):
        # TODO: check input data and send to DB
        return True, 'ok', 200
