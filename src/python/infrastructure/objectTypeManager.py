from pymongo import MongoClient, errors
import logging

from python.objects.object_type import Object_type

# ObjectTypeManager logger
log = logging.getLogger('objectTypeManager')


class ObjectTypeManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.objectType

    # Get annotation objectType by type and datasetType. Ignore mongo id
    def get_object_type(self, object_type):
        try:
            result = self.collection.find_one({"datasetType": object_type.dataset_type, "type": object_type.type}, {'_id': 0})
            if result is None:
                return 'Error'
            else:
                return Object_type.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding object type in db')
            return 'Error'

    # Return list with info of all objectTypes of self datasetType. Empty list if there are no objectTypes
    # Ignore mongo id
    def get_object_types(self, dataset_type):
        try:
            result = self.collection.find({"datasetType": dataset_type}, {"_id": 0})
            return [Object_type.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding object types in db')
            return 'Error'

    # Create new objectType for annotations with type, datasetType, nKeypoints and labels for each kp
    def create_object_type(self, object_type):
        try:
            result = self.collection.insert_one(object_type.to_json())
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            return 'Error '

    # Return 'ok' if the objectType has been removed
    def remove_object_type(self, object_type):
        try:
            result = self.collection.delete_one({"datasetType": object_type.dataset_type, "type": object_type.type})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing object type in db')
            return 'Error'

    # Return 'ok' if the objectType has been updated. if objectType doesn't exist, it isn't created
    def update_object_type(self, object_type):
        query = {"datasetType": object_type.dataset_type, "type": object_type.type}     # Search by type and datasetType
        # Update all values except pk (type and datasetType)
        update_values = object_type.to_json()
        del update_values['datasetType']
        del update_values['type']
        newValues = {"$set": update_values}    # Update all values
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object type in db')
            return 'Error'
