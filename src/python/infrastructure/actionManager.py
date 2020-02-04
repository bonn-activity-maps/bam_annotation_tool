from pymongo import MongoClient, errors
import logging

from python.objects.action import Action
from python.objects.activity import Activity

# TaskManager logger
log = logging.getLogger('actionManager')


class ActionManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.action

    # Return info of action if exists in DB. Ignore mongo id
    def get_action(self, action):
        try:
            # Ignore user parameter
            result = self.collection.find_one({"dataset": action.dataset.name, "startFrame": action.start_frame,
                                               "endFrame": action.end_frame, "objectUID": action.object_uid, "name": action.name},
                                              {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return Action.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def get_actions_by_UID(self, dataset, object_uid, user, start_frame, end_frame):
        try:
            # if objectUID and (NOT start >= end and NOT endDB<=start)
            # ignore user parameter
            result = self.collection.find({"dataset": dataset.name,
                                           "$and": [{"startFrame": {"$not": {"$gt": int(end_frame)}}},
                                                    {"endFrame": {"$not": {"$lt": int(start_frame)}}}],
                                           "objectUID": int(object_uid)},
                                          {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return [Action.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def get_actions(self, dataset, user, start_frame, end_frame):
        try:
            # Ignore user parameter
            result = self.collection.find({"dataset": dataset.name, "$and": [{"startFrame": {"$not": {"$gt": int(end_frame)}}},
                                                                                      {"endFrame": {"$not": {"$lt": int(start_frame)}}}]},
                                          {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return [Action.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action if exists in DB. Ignore mongo id
    # Look for startFrame or startFrame+1
    def get_action_by_start_frame(self, action):
        try:
            result = self.collection.find_one({"dataset": action.dataset.name, "$or": [{"startFrame": action.end_frame }, {"startFrame": action.end_frame+1}],
                                               "objectUID": action.object_uid, "name": action.name},
                                              {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return Action.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by dataset
    def get_actions_by_dataset(self, dataset):
        try:
            result = self.collection.find({"dataset": dataset.name}).sort([("objectUID", 1), ("name", 1), ("startFrame", 1)])
            if result is None:
                return 'Error'
            else:
                return [Action.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by dataset in json for export
    def get_actions_by_dataset_export(self, dataset):
        try:
            result = self.collection.aggregate([{"$match": {"dataset": dataset.name}},
                      {"$project": {"_id": 0, "pid": "$objectUID", "label": "$name", "start_frame": "$startFrame", "end_frame": "$endFrame"}},
                      # {"$sort": {"pid":1, "label":1}}
                                                ])
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return 'ok' if the action has been created
    def create_action(self, action):
        try:
            result = self.collection.insert_one({"dataset": action.dataset.name, "objectUID": action.object_uid,
                                                 "user": action.user, "name": action.name,
                                                 "startFrame": action.start_frame, "endFrame": action.end_frame})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating action in db')
            return 'Error'

    # Return 'ok' if the action has been updated.
    # If action doesn't exist, it isn't created
    def update_action_by_start_frame(self,action):
        query = {"dataset": action.dataset.name, "startFrame": action.start_frame, "objectUID": action.object_uid, "name": action.name}                                         # Search by objectType type
        new_values = {"$set": {"endFrame": action.end_frame}}    # Update endFrame
        try:
            result = self.collection.update_one(query, new_values, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object type in db')
            return 'Error'

    # Remove the action specified with the attributes
    def remove_action(self, action):
        try:
            # Ignore user parameter
            result = self.collection.delete_one({"dataset": action.dataset.name, "startFrame": action.start_frame,
                                                 "endFrame": action.end_frame, "objectUID": action.object_uid, "name": action.name})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing action in db')
            return 'Error'

    # # Update an action identified by old attributes with the new attributes
    # def updateAction(self, dataset, objectUID, user, oldName, oldStartFrame, oldEndFrame, newName, newStartFrame, newEndFrame):
    #
    #     # Ignore user param
    #     query = {"dataset": dataset, "startFrame": int(oldStartFrame), "endFrame": int(oldEndFrame),
    #              "objectUID": int(objectUID), "name": oldName}  # Search by old attributes
    #
    #
    #     query = {"dataset": dataset, "user": user, "startFrame": int(oldStartFrame), "endFrame": int(oldEndFrame),
    #              "objectUID": int(objectUID), "name": oldName}  # Search by old attributes
    #     # Update all values
    #     new_values = {"$set": {"name": newName, "startFrame": newStartFrame, "endFrame": newEndFrame}}
    #     try:
    #         result = self.collection.update_one(query, new_values, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating action in db')
    #         return 'Error'

