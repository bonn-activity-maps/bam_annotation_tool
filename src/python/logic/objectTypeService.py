import logging

from python.infrastructure.objectTypeManager import ObjectTypeManager

# ObjectTypeService logger
log = logging.getLogger('ObjectTypeService')

objectTypeManager = ObjectTypeManager()


class ObjectTypeService:

    # Return object info
    def get_object_type(self, object_type):
        result = objectTypeManager.get_object_type(object_type)
        if result == 'Error':
            return False, 'Incorrect object type', 400
        else:
            return True, result.to_json(), 200

    # Return objects info
    def get_object_types(self, dataset_type):
        result = objectTypeManager.get_object_types(dataset_type)
        if result == 'Error':
            return False, 'Error searching object types', 400
        else:
            return True, [r.to_json() for r in result], 200

     # Return 'ok' if the object has been created
    def create_object_type(self, object_type):
        # Check if object exist
        if objectTypeManager.get_object_type(object_type) != 'Error':
            return False, 'The object type already exists', 400
        else:
            # Create object
            result = objectTypeManager.create_object_type(object_type)
            if result == 'Error':
                return False, 'Error creating object type', 400
            else:
                return True, {'type': object_type.type}, 200

    # Return 'ok' if the object has been removed
    def remove_object_type(self, object_type):
        result = objectTypeManager.remove_object_type(object_type)
        if result == 'Error':
            return False, 'Error deleting object type', 400
        else:
            return True, result, 200

    # Return 'ok' if the object has been updated
    def update_object_type(self, object_type):
        result = objectTypeManager.update_object_type(object_type)
        if result == 'Error':
            return False, 'Error updating object type', 400
        else:
            return True, result, 200
