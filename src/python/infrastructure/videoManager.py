from pymongo import MongoClient, errors
import logging

# VideoManager logger
log = logging.getLogger('videoManager')


class VideoManager:
    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.video

    # Return info video if exist in DB. Ignore mongo id
    def getVideo(self, video, dataset):
        try:
            result = self.collection.find_one({"name": video, "dataset": dataset}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding video in db')
            return 'Error'

    # Return list with info of all videos. Empty list if there are no videos
    # Ignore mongo id
    def getVideos(self, dataset):
        try:
            if dataset == "root":
                result = self.collection.find({}, {"_id": 0}).sort("name")
            else:
                result = self.collection.find({"dataset": dataset}, {"_id": 0}).sort("name")
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding videos in db')
            return 'Error'

    # Return 'ok' if the video has been created
    def createVideo(self, video, dataset, path, type=None, frames=0):
        try:
            result = self.collection.insert_one({"name": video, "dataset": dataset, "frames": frames, "path": path, "type": type})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating video in db')
            return 'Error'

    # # Return 'ok' if the video has been updated.
    # def updateVideoFrames(self, video, frames, dataset):
    #     query = {"name": video, "dataset": dataset}  # Search by video name and dataset
    #     newValues = {"$set": {"frames": frames}}  # Update frames
    #     try:
    #         result = self.collection.update_one(query, newValues, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating video in db')
    #         return 'Error'
    #
    # def updateVideoName(self, video, newName, dataset):
    #     query = {"name": video, "dataset": dataset}  # Search by video name and dataset
    #     newValues = {"$set": {"name": newName}}  # Update name
    #     try:
    #         result = self.collection.update_one(query, newValues, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating video in db')
    #         return 'Error'

    # Return 'ok' if the video has been removed
    def removeVideo(self, video, dataset):
        try:
            result = self.collection.delete_one({"name": video, "dataset": dataset})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing video in db')
            return 'Error'

    # Return 'ok' if the video has been updated.
    def updateVideoFrames(self, video, frames, dataset):
        query = {"name": video, "dataset": dataset}  # Search by video name and dataset
        newValues = {"$set": {"frames": frames}}  # Update frames
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating video in db')
            return 'Error'

    # Remove all videos associated to dataset
    # Return 'ok' if the videos have been removed
    def removeVideosByDataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing video in db')
            return 'Error'