from pymongo import MongoClient, errors
import logging

# FrameManager logger
log = logging.getLogger('frameManager')


class FrameManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.frame

    # Return info of frame by video and dataset if exist in DB. Ignore mongo id
    def getFrame(self, frame, video, dataset):
        try:
            result = self.collection.find_one({"number": frame, "video": video, "dataset": dataset}, {"_id": 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding frame in db')
            return 'Error'

    # Return info of frame by frame ID if it exists in the DB. Ignore mongo id
    def getFrameById(self, frameId):
        try:
            result = self.collection.find_one({"frame_id": frameId}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding frame in db')
            return 'Error'

    # Return list with info of all frames by video and dataset. Empty list if there are no frames
    # Ignore mongo id
    def getFrames(self, video, dataset):
        try:
            result = self.collection.find({"video": video, "dataset": dataset}, {"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding frames in db')
            return 'Error'

    # Return 'ok' if the frame has been created -> receive the complete dictionary
    def createFrame(self, frameDict):
        try:
            result = self.collection.insert_one(frameDict)
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating frame in db')
            return 'Error'

    # Return 'ok' if the frame has been removed
    def removeFrame(self, frame, video, dataset):
        try:
            result = self.collection.delete_one({"number": frame, "video": video, "dataset": dataset})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing frame in db')
            return 'Error'

    # Return 'ok' if the frames of dataset has been removed
    def removeFramesByDataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # Return path of frame if exist in DB. Ignore mongo id
    def getFramePath(self, frame, video, dataset):
        try:
            result = self.collection.find_one({"number": int(frame), "video": int(video), "dataset": dataset},
                                              {"path": 1, "_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding frame in db')
            return 'Error'
