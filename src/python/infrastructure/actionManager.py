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
    def getActivities(self):
        try:
            result = self.collectionActivities.find({}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return list(result)[0]["activity"]
        except errors.PyMongoError as e:
            log.exception('Error finding task in db')
            return 'Error'

    # Return info of action if exists in DB. Ignore mongo id
    def getAction(self, objectUID, label, startFrame, endFrame):
        print("get ", objectUID, ", ", label, " ,", startFrame, ", ", endFrame)
        try:
            result = self.collection.find_one({"objectUID": objectUID, "label": label, "startFrame": startFrame,
                                               "endFrame": endFrame}, {"_id": 0})
            print(result)
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def getActionsByUID(self, objectUID, startFrame, endFrame):
        try:
            print(objectUID, " from ", startFrame, " to ", endFrame)
            result = self.collection.find_one({"objectUID": int(objectUID), "startFrame": {'$gt': int(startFrame)},
                                               "endFrame": {'$lt': int(endFrame)}}, {"_id": 0})
            # result = self.collection.find({"objectUID": objectUID, "startFrame": startFrame, "endFrame": endFrame},
            #                               {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return info of action by object id and frame range
    def getActions(self, startFrame, endFrame):
        try:
            print("All from ", startFrame, " to ", endFrame)
            result = self.collection.find({"startFrame": {'$gt': int(startFrame)}, "endFrame": {'$lt': int(endFrame)}},
                                          {"_id": 0})
            print(list(result))
            if result is None:
                return 'Error'
            else:
                return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding action in db')
            return 'Error'

    # Return 'ok' if the action has been created
    def createAction(self, objectUID, label, startFrame, endFrame):
        try:
            result = self.collection.insert_one({"objectUID": objectUID, "label": label, "startFrame": startFrame,
                                                 "endFrame": endFrame})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating action in db')
            return 'Error'

    # Remove the action specified with the attributes
    def removeAction(self, objectUID, label, startFrame, endFrame):
        try:
            result = self.collection.delete_one({"objectUID": int(objectUID), "label": label,
                                                 "startFrame": int(startFrame), "endFrame": int(endFrame)})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing action in db')
            return 'Error'

    # Update an action identified by old attributes with the new attributes
    def updateAction(self, objectUID, oldLabel, oldStartFrame, oldEndFrame, newLabel, newStartFrame, newEndFrame):
        query = {"objectUID": int(objectUID), "label": oldLabel,
                 "startFrame": int(oldStartFrame), "endFrame": int(oldEndFrame)}  # Search by old attributes
        # Update all values
        newValues = {"$set": {"label": newLabel, "startFrame": newStartFrame, "endFrame": newEndFrame}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating action in db')
            return 'Error'

