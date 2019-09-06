from pymongo import MongoClient, errors
import logging

# ObjectTypeManager logger
log = logging.getLogger('objectTypeManager')


class ObjectTypeManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.objectType

    # Get annotation objectType by type and datasetType. Ignore mongo id
    def getObjectType(self, type, datasetType):
        try:
            result = self.collection.find_one({"datasetType": datasetType, "type": type}, {'_id': 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding object type in db')
            return 'Error'

    # Return list with info of all objectTypes of self datasetType. Empty list if there are no objectTypes
    # Ignore mongo id
    def getObjectTypes(self, datasetType):
        try:
            result = self.collection.find({"datasetType": datasetType}, {"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding object types in db')
            return 'Error'

    # Create new objectType for annotations with type, datasetType, nKeypoints and labels for each kp
    def createObjectType(self, type, datasetType, nkp, labels, supercategory=None, id=None, skeleton=None,
                         is_polygon=False):
        try:
            result = self.collection.insert_one({"type": type, "datasetType": datasetType, "numKeypoints": nkp,
                                                 "labels": labels, "supercategory": supercategory,
                                                 "id": id, "skeleton": skeleton, "is_polygon": is_polygon})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            return 'Error '

    # Return 'ok' if the objectType has been removed
    def removeObjectType(self, type, datasetType):
        try:
            result = self.collection.delete_one({"type": type, "datasetType": datasetType})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing object type in db')
            return 'Error'

    # Return 'ok' if the objectType has been updated. if objectType doesn't exist, it isn't created
    def updateObjectType(self, type, datasetType, nkp, labels):
        query = {"type": type, "datasetType": datasetType}                                         # Search by objectType type
        newValues = {"$set": {"numKeypoints": nkp, "labels": labels}}    # Update values (numKeypoints and labels)
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object type in db')
            return 'Error'
