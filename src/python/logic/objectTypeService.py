import logging

from python.infrastructure.objectTypeManager import ObjectTypeManager

# ObjectTypeService logger
log = logging.getLogger('ObjectTypeService')

objectTypeManager = ObjectTypeManager()


class ObjectTypeService:

    # Return object info
    def getObjectType(self, type, datasetType):
        result = objectTypeManager.getObjectType(type, datasetType)
        if result == 'Error':
            return False, 'Incorrect object type', 400
        else:
            return True, result, 200

    # Return objects info
    def getObjectTypes(self, datasetType):
        result = objectTypeManager.getObjectTypes(datasetType)
        if result == 'Error':
            return False, 'Error searching object types', 400
        else:
            return True, result, 200

     # Return 'ok' if the object has been created
    def createObjectType(self, type, datasetType, nkp, labels):
        # Check if object exist
        if objectTypeManager.getObjectType(type, datasetType) != 'Error':
            return False, 'The object type already exists', 400
        else:
            # Create object
            result = objectTypeManager.createObjectType(type, datasetType, nkp, labels)
            if result == 'Error':
                return False, 'Error creating object type', 400
            else:
                return True, {'type': type}, 200

    # Return 'ok' if the object has been removed
    def removeObjectType(self, type, datasetType):
        result = objectTypeManager.removeObjectType(type, datasetType)
        if result == 'Error':
            return False, 'Error deleting object type', 400
        else:
            return True, result, 200

    # Return 'ok' if the object has been updated
    def updateObjectType(self, type, datasetType, nkp, labels):
        result = objectTypeManager.updateObjectType(type, datasetType, nkp, labels)
        if result == 'Error':
            return False, 'Error updating object type', 400
        else:
            return True, result, 200
