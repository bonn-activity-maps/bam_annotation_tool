from pymongo import MongoClient, errors
import logging

# AnnotationManager logger
log = logging.getLogger('annotationManager')


class AnnotationManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.annotation

    # Get annotation info for given frame, dataset, scene and user. Not return mongo id
    def getAnnotation(self, dataset, scene, frame, user):
        try:
            result = self.collection.find_one({"dataset": dataset, "scene": scene, "frame": int(frame), "user": user}, {'_id': 0})
            if result == None:
                return {}
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get all annotations for given dataset, scene, user and val. Not return mongo id
    def getAnnotations(self, dataset, scene, user, val):
        try:
            # result = self.collection.find({"dataset": dataset, "scene": scene, "user": user, "validated": val}, {'_id': 0})
            result = self.collection.find({"dataset": dataset, "scene": scene, "user": user}, {'_id': 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get all annotations for given dataset. Not return mongo id
    def getAnnotationsByDataset(self, dataset):
        try:
            result = self.collection.aggregate([{"$match": {"dataset": dataset}},
                 {"$project": {"frame": 1, "persons.pid": "$objects.uid", "persons.location": "$objects.keypoints", '_id': 0}}])
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Return 'ok' if the annotation has been updated.
    # The annotation is created if it doesn't exist and return 'ok
    # Validated flag is set to unchecked if is not received in params
    def updateAnnotation(self, dataset, scene, frame, user, objects, val='unchecked'):
        query = {"dataset": dataset, "scene": scene, "frame": int(frame), "user": user}   # Search by dataset, scene, frame, user
        # Update all objects of the frame and validated flag.
        newValues = {"$set": {"objects": objects, "validated": val}}

        try:
            result = self.collection.update_one(query, newValues, upsert=True)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating annotation in db')
            return 'Error'

    # Return 'ok' if the annotation has been removed
    def removeAnnotation(self, dataset, scene, frame, user):
        try:
            result = self.collection.delete_one({"dataset": dataset, "scene": scene, "frame": int(frame), "user": user})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotation in db')
            return 'Error'

    # Return 'ok' if the annotations of dataset has been removed
    def removeAnnotationsByDataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # Return 'ok' if the validated flag has been updated in all frames. if annotation doesn't exist, it isn't created
    def updateValidation(self, dataset, scene, frames, user, val):
        query = {"dataset": dataset, "scene": scene, "user": user, "frame": {"$in": frames}}   # Search by dataset, video, user, and all frames in array
        # Update validated flag
        newValues = {"$set": {"validated": val}}
        try:
            result = self.collection.update_many(query, newValues, upsert=False)
            if result.modified_count == len(frames):
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating validated annotation in db')
            return 'Error'

    # Return max uid of objects in dataset
    def maxUidObjectDataset(self, dataset):
        try:
            result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": dataset}},
                                                {"$group": {"_id": None, "max": {"$max": "$objects.uid"}}},
                                                {"$project": {"_id": 0, "max": 1}}])       # Avoid return mongo id
            # Read max value returned
            result = list(result)
            if result == []:    # If there are no objects -> max uid is 0
                return 0
            else:               # Return max
                return result[0]['max'][0]
        except errors.PyMongoError as e:
            log.exception('Error finding maximum id in annotation in db')
            return 'Error'


    ###########################

    # TODO: change methods for adapting them to new scene attribute
    # Get annotation for object in frame, without mongo id
    def getFrameObject(self, dataset, video, frame, user, obj):
        try:
            result = self.collection.find_one({"dataset": dataset, "video": video, "frame": frame, "user": user,
                                               "objects": {"$elemMatch": {"uid": obj}}}, {'_id': 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been created.
    def createFrameObject(self, dataset, scene, frame, user, objects):
        uidObj = objects["uid"]
        type = objects["type"]
        keypoints = objects["keypoints"]

        query = {"dataset": dataset, "scene": scene, "frame": frame, "user": user}
        # Add object (uid, type, kps) and labels only if it's in objects
        if "labels" in objects:
            labels = objects["labels"]
            newValues = {"$push": {"objects": [{"uid": uidObj, "type": type, "keypoints": keypoints, "labels": labels}]}}
        else:
            newValues = {"$push": {"objects": [{"uid": uidObj, "type": type, "keypoints": keypoints}]}}

        try:
            result = self.collection.update_one(query, newValues, upsert=True)
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
    def updateFrameObject(self, dataset, video, frame, user, objects):
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
            result = self.collection.update_one(query, newValues, upsert=False, array_filters=arrayFilter)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been removed.
    def removeFrameObject(self, dataset, video, frame, user, uidObject):
        query = {"dataset": dataset, "video": video, "frame": frame, "user": user}
        # Remove object where object.uid == uidObject
        newValues = {"$pull": {"objects": {"uid": uidObject}}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'