from pymongo import MongoClient, errors
import logging

import python.config as cfg

from python.objects.video import Video

# VideoManager logger
log = logging.getLogger('videoManager')


class VideoManager:
    c = MongoClient(cfg.mongo["ip"], cfg.mongo["port"])
    db = c.cvg
    collection = db.video

    # Return video if exist in DB. Ignore mongo id
    def get_video(self, video):
        try:
            result = self.collection.find_one({"dataset": video.dataset.name, "name": video.name}, {"_id": 0})

            if result is None:
                return 'Error'
            else:
                return Video.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding video in db')
            return 'Error'

    # Return list with all videos filter by dataset. Empty list if there are no videos
    # Ignore mongo id
    def get_videos(self, dataset):
        try:
            if dataset.name == "root":
                result = self.collection.find({}, {"_id": 0}).sort("name")
            else:
                result = self.collection.find({"dataset": dataset.name}, {"_id": 0}).sort("name")
            return [Video.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding videos in db')
            return 'Error'

    # Return 'ok' if the video has been created
    def create_video(self, video):
        try:
            result = self.collection.insert_one(video.to_json())
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
    #     new_values = {"$set": {"frames": frames}}  # Update frames
    #     try:
    #         result = self.collection.update_one(query, new_values, upsert=False)
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
    #     new_values = {"$set": {"name": newName}}  # Update name
    #     try:
    #         result = self.collection.update_one(query, new_values, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating video in db')
    #         return 'Error'

    # # Return 'ok' if the video has been removed
    # def removeVideo(self, video, dataset):
    #     try:
    #         result = self.collection.delete_one({"dataset": dataset, "name": video})
    #         if result.deleted_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error removing video in db')
    #         return 'Error'

    # # Return 'ok' if the video has been updated.
    # def updateVideoFrames(self, video, frames, dataset):
    #     query = {"dataset": dataset, "name": video}  # Search by video name and dataset
    #     new_values = {"$set": {"frames": frames}}  # Update frames
    #     try:
    #         result = self.collection.update_one(query, new_values, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating video in db')
    #         return 'Error'

    # Remove all videos associated to dataset
    # Return 'ok' if the videos have been removed
    def remove_videos_by_dataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset.name})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing video in db')
            return 'Error'