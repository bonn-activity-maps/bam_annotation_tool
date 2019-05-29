from pymongo import MongoClient, errors
import logging

# ObjectManager logger
log = logging.getLogger('objectManager')


class ObjectManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.object

    # Get annotation object by type. Ignore mongo id
    def getObject(this, type):
        try:
            result = this.collection.find_one({"type": type}, {'_id': 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding object in db')
            return 'Error'

    # Return list with info of all objects. Empty list if there are no objects
    # Ignore mongo id
    def getObjects(this):
        try:
            result = this.collection.find({}, {"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding objects in db')
            return 'Error'

    # Create new object for annotations with type, nKeypoints and labels for each kp
    def createObject(this, type, nkp, labels):
        try:
            result = this.collection.insert_one({"type": type, "numKeypoints": nkp, "labels": labels})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            return 'Error '

    # Return 'ok' if the object has been removed
    def removeObject(this, object):
        try:
            result = this.collection.delete_one({"type": object})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing object in db')
            return 'Error'

    # Return 'ok' if the object has been updated. if object doesn't exist, it isn't created
    def updateObject(this, object, nkp, labels):
        query = {"type": object}                                         # Search by object type
        newValues = {"$set": {"numKeypoints": nkp, "labels": labels}}    # Update values (numKeypoints and labels)
        try:
            result = this.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in db')
            return 'Error'
