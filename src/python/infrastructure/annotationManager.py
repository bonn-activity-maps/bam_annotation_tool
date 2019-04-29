from pymongo import MongoClient

class AnnotationManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.videos

    # Get annotation info for given frame
    def getAnnotation(this, video, frame):
        collection = this.db.video
        result = collection.find_one({"frame":frame})
        if result == None:
            return False, 'The frame does not have an annotation', 400
        else:
            return True, result, 200

    # Save annotation info for given frame
    def uploadAnnotation(this, video, frameInfo):
        collection = this.db.video
        # TODO: store info replacing the existing one
