import logging

from python.infrastructure.objectManager import ObjectManager

# ObjectService logger
log = logging.getLogger('ObjectService')

objectManager = ObjectManager()


class ObjectService:

    # Return object info
    def getObject(this, type):
        result = objectManager.getObject(type)
        if result == 'Error':
            return False, 'Incorrect object', 400
        else:
            return True, result, 200

    # Return objects info
    def getObjects(this):
        result = objectManager.getObjects()
        if result == 'Error':
            return False, 'Error searching objects', 400
        else:
            return True, result, 200

     # Return 'ok' if the object has been created
    def createObject(this, type, nkp, labels):
        # Check if object exist
        if objectManager.getObject(type) != 'Error':
            return False, 'The object already exists', 400
        else:
            # Create object
            result = objectManager.createObject(type, nkp, labels)
            if result == 'Error':
                return False, 'Error creating object', 400
            else:
                return True, {'type': type}, 200

    # Return 'ok' if the object has been removed
    def removeObject(this, type):
        result = objectManager.removeObject(type)
        if result == 'Error':
            return False, 'Error deleting object', 400
        else:
            return True, result, 200

    # Return 'ok' if the object has been updated
    def updateObject(this, type, nkp, labels):
        result = objectManager.updateObject(type, nkp, labels)
        if result == 'Error':
            return False, 'Error updating object', 400
        else:
            return True, result, 200
