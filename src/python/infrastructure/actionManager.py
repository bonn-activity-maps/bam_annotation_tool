from pymongo import MongoClient, errors
import logging

# TaskManager logger
log = logging.getLogger('actionManager')


class ActionManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.action
    collectionActivities = db.activities

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
            result = self.collection.find_one({"dataset": dataset, "objectUID": int(objectUID), "user": user, "name": name,
                                               "startFrame": int(startFrame), "endFrame": int(endFrame)}, {"_id": 0})
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
            result = self.collection.find({"dataset": dataset, "objectUID": int(objectUID), "user": user,
                        "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
                                 {"endFrame": {"$not": {"$lt": int(startFrame)}}}]},
                        {"_id": 0})

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
            result = self.collection.find({"dataset": dataset, "user": user, "$and": [{"startFrame": {"$not": {"$gt": int(endFrame)}}},
                                                    {"endFrame": {"$not": {"$lt": int(startFrame)}}}]},
                                          {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by dataset
    def getActionsByDataset(self, dataset):
        try:
            result = self.collection.aggregate([{"$match": {"dataset": dataset}},
                      {"$project": {"_id": 0, "pid": "$objectUID", "label": "$name", "start_frame": "$startFrame", "end_frame": "$endFrame"}}])
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

    # Remove the action specified with the attributes
    def removeAction(self, dataset, objectUID, user, name, startFrame, endFrame):
        try:
            result = self.collection.delete_one({"dataset": dataset, "objectUID": int(objectUID), "name": name, "user": user,
                                                 "startFrame": int(startFrame), "endFrame": int(endFrame)})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing action in db')
            return 'Error'

    # Update an action identified by old attributes with the new attributes
    def updateAction(self, dataset, objectUID, user, oldName, oldStartFrame, oldEndFrame, newName, newStartFrame, newEndFrame):
        query = {"dataset": dataset, "objectUID": int(objectUID), "name": oldName, "user": user,
                 "startFrame": int(oldStartFrame), "endFrame": int(oldEndFrame)}  # Search by old attributes
        # Update all values
        newValues = {"$set": {"name": newName, "startFrame": newStartFrame, "endFrame": newEndFrame}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating action in db')
            return 'Error'

