from pymongo import MongoClient, errors
import logging

# AnnotationManager logger
log = logging.getLogger('annotationManager')


class AnnotationManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.annotation

    # Get annotation info for given frame, dataset, video and user. Not return mongo id
    def getAnnotation(this, dataset, video, frame, user):
        try:
            result = this.collection.find_one({"dataset": dataset, "video": video, "frame": frame, "user": user}, {'_id': 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Return 'ok' if the annotation has been updated.
    # The annotation is created if it doesn't exist and return 'ok
    # Validated flag is set to uncheck if is not received in params
    def updateAnnotation(this, dataset, video, frame, user, objects, val='uncheck', kpDim=None):
        query = {"dataset": dataset, "video": video, "frame": frame, "user": user}   # Search by dataset, video, frame, user
        # Update all objects of the frame and validated flag. Update kpDim if it's received in params
        if kpDim is not None:
            newValues = {"$set": {"objects": objects, "validated": val, "keypointDim": kpDim}}
        else:
            newValues = {"$set": {"objects": objects, "validated": val}}

        try:
            result = this.collection.update_one(query, newValues, upsert=True)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating annotation in db')
            return 'Error'

    # Return 'ok' if the annotation has been removed
    def removeAnnotation(this, dataset, video, frame, user):
        try:
            result = this.collection.delete_one({"dataset": dataset, "video": video, "frame": frame, "user": user})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotation in db')
            return 'Error'

    # Return 'ok' if the validated flag has been updated. if annotation doesn't exist, it isn't created
    # def updateValidation(this, dataset, video, frame, user, validated):
    #     query = {"dataset": dataset, "video": video, "frame": frame, "user": user}   # Search by dataset, video, frame, user
    #     # Update validated flag
    #     newValues = {"$set": {"validated": validated}}
    #     try:
    #         result = this.collection.update_one(query, newValues, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating validated annotation in db')
            return 'Error'

    # Save annotation info for given frame
    def uploadAnnotation(this, video, frame, kpdim, objects):
        try:
            this.collection.insert_one({"video":video, "frame":frame, "keypointDim": kpdim, "objects": objects})
            return 'ok', ''
        except errors.PyMongoError as e:
            return 'Error inserting annotation', e

    # Get annotation for object in frame, without mongo id
    def getFrameObject(this, video, frame, obj):
        result = this.collection.find_one({"video":video, "frame":frame, "objects.uid":obj}, {'_id': 0})
        if result == None:
            return 'Error'
        else:
            return result

    # Store annotation for an object in a frame. Insert if not exist
    def uploadFrameObject(this, video, frame, kpdim, objects):
        uidObj = objects[0]["uid"]
        type = objects[0]["type"]
        keypoints = objects[0]["keypoints"]
        labels = objects[0]["labels"]

        query = {"video":video, "frame":frame, "keypointDim": kpdim, "objects.uid":uidObj}
        # Update object (type, kps, labels)
        newValues = {"$set": {"objects.$[elem].type":type, "objects.$[elem].keypoints":keypoints, "objects.$[elem].labels":labels}}
        arrayFilter = [{ "elem.uid": { "$eq":uidObj }}]     # Filter by object uid
        try:
            this.collection.update_one(query, newValues, upsert=True, array_filters=arrayFilter)
            return 'ok', ''
        except errors.PyMongoError as e:
            return 'Error inserting annotation for object in frame', e
