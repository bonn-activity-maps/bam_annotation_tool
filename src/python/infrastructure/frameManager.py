from pymongo import MongoClient, errors
import logging
from bson.son import SON

# FrameManager logger
log = logging.getLogger('frameManager')

from python.objects.frame import Frame

class FrameManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.frame

    # Return info of frame by video and dataset if exist in DB. Ignore mongo id
    def get_frame(self, frame):
        try:
            result = self.collection.find_one({"dataset": frame.dataset.name, "video": frame.video, "number": frame.number}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return Frame.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding frame in db')
            return 'Error'

    # Return info of frame by frame ID if it exists in the DB. Ignore mongo id
    def get_frame_by_ID(self, frame_id, dataset):
        try:
            result = self.collection.find_one({"frame_id": frame_id, "dataset": dataset}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding frame in db')
            return 'Error'

    # Return list with info of all frames by video and dataset. Empty list if there are no frames
    # Ignore mongo id
    def get_frames(self, video):
        try:
            result = self.collection.find({"dataset": video.dataset.name, "video": video.name}, {"_id": 0})
            return [Frame.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding frames in db')
            return 'Error'

    # Return 'ok' if the frame has been created
    def create_frame(self, frame):
        try:
            result = self.collection.insert_one(frame.to_json())
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating frame in db')
            return 'Error'

    # Return 'ok' if the frame has been removed
    def remove_frame(self, frame):
        try:
            result = self.collection.delete_one({"dataset": frame.dataset.name, "video": frame.video, "number": frame.number})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing frame in db')
            return 'Error'

    # Return 'ok' if the frames of dataset has been removed
    def remove_frames_by_dataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset.name})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # Return 'ok' if the frames of dataset and camera has been removed
    def remove_frames_by_dataset_and_video(self, dataset, video):
        try:
            result = self.collection.delete_many({"dataset": dataset.name, "video": video})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # Return info of frames (max, min, total frames) for dataset group by video
    def get_frames_info_of_dataset_group_by_video(self, dataset):
        try:
            result = self.collection.aggregate([{"$match": {"dataset": dataset.name}},
                    {"$group": {"_id": {"scene": "$video"}, "minFrame": {"$min": "$number"}, "maxFrame": {"$max": "$number"}}},
                    {"$project": {"_id": 0, "video": "$_id.scene", "minFrame": 1, "maxFrame": 1,
                                  "totalFrames": {"$add": [{"$subtract": ["$maxFrame", "$minFrame"]}, 1]}}},
                    {"$sort": SON([("video", 1)])}])
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding frames in db')
            return 'Error'

