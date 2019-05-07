from pymongo import MongoClient
from pymongo import errors

class VideoManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.video

    # Get annotation info for given frame
    def getAnnotation(this, video, frame):
        # Not return mongo id
        result = this.collection.find_one({"video":video, "frame":frame}, {'_id': 0})
        if result == None:
            return 'Error'
        else:
            return result

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
