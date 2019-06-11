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

    # Get all annotations for given dataset, video, user and val. Not return mongo id
    def getAnnotations(this, dataset, video, user, val):
        try:
            result = this.collection.find({"dataset": dataset, "video": video, "user": user, "validated": val}, {'_id': 0})
            return list(result)
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

    # Return 'ok' if the camera params of annotation has been updated.
    # The annotation is created if it doesn't exist and return 'ok
    def updateCameraParameters(this, dataset, video, frame, user, k, rvec, tvec, distCoef, w, h):
        query = {"dataset": dataset, "video": video, "frame": frame, "user": user}   # Search by dataset, video, frame, user
        # Update all camera parameters
        newValues = {"$set": {"k": k, "rvec": rvec, "tvec": tvec, "distCoef": distCoef, "w": w, "h": h}}

        try:
            result = this.collection.update_one(query, newValues, upsert=True)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating camera parameters of annotation in db')
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

    # Return 'ok' if the annotations of dataset has been removed
    def removeAnnotationsByDataset(this, dataset):
        try:
            result = this.collection.delete_many({"dataset": dataset})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # Return 'ok' if the validated flag has been updated in all frames. if annotation doesn't exist, it isn't created
    def updateValidation(this, dataset, video, frames, user, val):
        query = {"dataset": dataset, "video": video, "user": user, "frame": {"$in": frames}}   # Search by dataset, video, user, and all frames in array
        # Update validated flag
        newValues = {"$set": {"validated": val}}
        try:
            result = this.collection.update_many(query, newValues, upsert=False)
            if result.modified_count == len(frames):
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating validated annotation in db')
            return 'Error'

###########################

    # Get annotation for object in frame, without mongo id
    def getFrameObject(this, dataset, video, frame, user, obj):
        try:
            result = this.collection.find_one({"dataset": dataset, "video": video, "frame": frame, "user": user,
                                               "objects": {"$elemMatch": {"uid": obj}}}, {'_id': 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been created.
    def createFrameObject(this, dataset, video, frame, user, objects):
        # print(objects)
        uidObj = objects["uid"]
        type = objects["type"]
        keypoints = objects["keypoints"]

        query = {"dataset": dataset, "video": video, "frame": frame, "user": user}
        # Add object (uid, type, kps) and labels only if it's in objects
        if "labels" in objects:
            labels = objects["labels"]
            newValues = {"$push": {"objects": {"uid": uidObj, "type": type, "keypoints": keypoints, "labels": labels}}}
        else:
            newValues = {"$push": {"objects": {"uid": uidObj, "type": type, "keypoints": keypoints}}}

        try:
            result = this.collection.update_one(query, newValues, upsert=True)
            # ok if object has been modified
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been updated.
    # The annotation is not created if it doesn't exist and return Error
    def updateFrameObject(this, dataset, video, frame, user, objects):
        print(objects)
        uidObj = objects["uid"]
        type = objects["type"]
        keypoints = objects["keypoints"]

        query = {"dataset": dataset, "video": video, "frame": frame, "user": user, "objects.uid": uidObj}
        arrayFilter = [{"elem.uid": {"$eq": uidObj}}]     # Filter by object uid

        # Update object (uid, type, kps) and labels only if it's in objects
        if "labels" in objects:
            labels = objects["labels"]
            newValues = {"$set": {"objects.$[elem].type": type, "objects.$[elem].keypoints": keypoints, "objects.$[elem].labels": labels}}
        else:
            newValues = {"$set": {"objects.$[elem].type": type, "objects.$[elem].keypoints": keypoints}}

        try:
            result = this.collection.update_one(query, newValues, upsert=False, array_filters=arrayFilter)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been removed.
    def removeFrameObject(this, dataset, video, frame, user, uidObject):
        query = {"dataset": dataset, "video": video, "frame": frame, "user": user}
        # Remove object where object.uid == uidObject
        newValues = {"$pull": {"objects": {"uid": uidObject}}}
        try:
            result = this.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'