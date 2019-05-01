from pymongo import MongoClient

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
    def uploadAnnotation(this, video, frame, objects):
        try:
            this.collection.insert_one({"video":video, "frame":frame, "objects": objects})
            return 'ok', ''
        except pymongo.errors.PyMongoError as e:
            return 'Error inserting annotation', e
