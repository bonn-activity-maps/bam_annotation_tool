from pymongo import MongoClient, errors
import logging

# TaskManager logger
log = logging.getLogger('actionManager')


class ActionManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.action
    collectionActivities = db.activities

    # Return 'ok' if the action has been created
    def createActivity(self, dataset, activity):
        try:
            result = self.collectionActivities.insert_one({"name": activity})
            if result.acknowledged:
                return 'Activity created'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating action in db')
            return 'Error'

    # Return the list of possible human activities stored in the db
    def getActivities(self, dataset):
        try:
            result = self.collectionActivities.find({}, {"_id": 0}).sort("name")
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding task in db')
            return 'Error'

    # Return info of action if exists in DB. Ignore mongo id
    def getAction(self, dataset, objectUID, user, name, startFrame, endFrame):
        try:
            # Ignore user parameter
            result = self.collection.find_one({"dataset": dataset, "startFrame": int(startFrame),
                                               "endFrame": int(endFrame), "objectUID": int(objectUID), "name": name},
                                              {"_id": 0})

            # result = self.collection.find_one({"dataset": dataset, "user": user, "startFrame": int(startFrame),
            #                                    "endFrame": int(endFrame), "objectUID": int(objectUID), "name": name},
            #                                   {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def getActionsByUID(self, dataset, objectUID, user, startFrame, endFrame):
        try:
            # if objectUID and (NOT start >= end and NOT endDB<=start)
            # ignore user parameter
            result = self.collection.find({"dataset": dataset,
                                           "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
                                                    {"endFrame": {"$not": {"$lt": int(startFrame)}}}],
                                           "objectUID": int(objectUID)},
                                          {"_id": 0})

            # result = self.collection.find({"dataset": dataset, "user": user,
            #             "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
            #                      {"endFrame": {"$not": {"$lt": int(startFrame)}}}],
            #             "objectUID": int(objectUID)},
            #             {"_id": 0})

            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def getActions(self, dataset, user, startFrame, endFrame):
        try:
            # Ignore user parameter
            result = self.collection.find({"dataset": dataset, "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
                                                                                      {"endFrame": {"$not": {"$lt": int(startFrame)}}}]},
                                          {"_id": 0})
            # result = self.collection.find({"dataset": dataset, "user": user, "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
            #                                         {"endFrame": {"$not": {"$lt": int(startFrame)}}}]},
            #                               {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action if exists in DB. Ignore mongo id
    # Look for startFrame or startFrame+1
    def getActionByStartFrame(self, dataset, objectUID, name, startFrame):
        try:
            result = self.collection.find_one({"dataset": dataset, "$or": [{"startFrame": startFrame }, {"startFrame": startFrame+1}],
                                               "objectUID": objectUID, "name": name},
                                              {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by dataset
    def getActionsByDataset(self, dataset):
        try:
            result = self.collection.find({"dataset": dataset}).sort([("objectUID", 1), ("name", 1), ("startFrame", 1)])
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by dataset
    def getActionsByDatasetExport(self, dataset):
        try:
            result = self.collection.aggregate([{"$match": {"dataset": dataset}},
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
    def createAction(self, dataset, objectUID, user, name, startFrame, endFrame):
        try:
            result = self.collection.insert_one({"dataset": dataset, "objectUID": objectUID, "user": user,"name": name, "startFrame": startFrame,
                                                 "endFrame": endFrame})

            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating action in db')
            return 'Error'

    # Return 'ok' if the action has been updated.
    # If action doesn't exist, it isn't created
    def updateActionByStartFrame(self, dataset, objectUID, name, startFrame, endFrame):
        query = {"dataset": dataset, "startFrame": startFrame, "objectUID": objectUID, "name": name}                                         # Search by objectType type
        newValues = {"$set": {"endFrame": endFrame}}    # Update endFrame
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object type in db')
            return 'Error'

    # Remove the action specified with the attributes
    def removeAction(self, dataset, objectUID, user, name, startFrame, endFrame):
        try:
            # Ignore user parameter
            result = self.collection.delete_one({"dataset": dataset, "startFrame": int(startFrame),
                                                 "endFrame": int(endFrame), "objectUID": int(objectUID), "name": name})

            # result = self.collection.delete_one({"dataset": dataset, "user": user, "startFrame": int(startFrame),
            #                                      "endFrame": int(endFrame), "objectUID": int(objectUID), "name": name})
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
    #     newValues = {"$set": {"name": newName, "startFrame": newStartFrame, "endFrame": newEndFrame}}
    #     try:
    #         result = self.collection.update_one(query, newValues, upsert=False)
    #         if result.modified_count == 1:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating action in db')
    #         return 'Error'

