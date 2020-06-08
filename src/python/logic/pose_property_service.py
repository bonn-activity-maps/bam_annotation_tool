import logging

from python.infrastructure.pose_property_manager import PosePropertyManager
from python.infrastructure.annotationManager import AnnotationManager
from python.objects.pose_property import PoseProperty

# pose_properties_service logger
log = logging.getLogger('pose_property_service')

pose_property_manager = PosePropertyManager()
annotation_manager = AnnotationManager()

class PosePropertyService:

    # Return list of pose properties for dataset and scene
    def get_pose_properties_by_dataset(self, dataset, scene):
        result = pose_property_manager.get_pose_properties_by_dataset(dataset, scene)
        if result == 'Error':
            return False, 'Error retrieving pose properties', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return list of properties for dataset and uid
    def get_pose_property_by_uid(self, dataset, scene, type, uid):
        result = pose_property_manager.get_pose_property_by_uid(dataset, scene, type, uid)
        if result == 'Error':
            return False, 'Error retrieving pose properties by uid', 400
        else:
            return True, result.to_json(), 200

    # Return if pose property has been created/updated successfully
    def update_pose_property(self, pose_property):
        # Check all lengths are distinct of 0
        if pose_property.check_correct_lengths():
            result = pose_property_manager.update_pose_property(pose_property)
            if result == 'Error':
                return False, 'Error creating pose property', 400
            else:
                return True, 'Pose property created successfully', 200
        else:
            return False, 'Error: limb length cannot be 0', 400

    # Return if the pose property has been removed
    def remove_pose_property(self, dataset, scene, type, uid):
        result = pose_property_manager.remove_pose_property(dataset, scene, type, uid)
        if result == 'Error':
            return False, 'Error deleting pose property', 400
        else:
            return True, 'Pose property removed successfully', 200

    # Return if pose properties has been initialized successfully for the dataset
    def initialize_pose_properties(self, dataset, scene, type):
        max_uid = annotation_manager.max_uid_object_dataset(dataset)
        for uid in range(0, max_uid+1):
            pose_property = PoseProperty(dataset, scene, type, uid, -1, -1, -1, -1)
            result = pose_property_manager.update_pose_property(pose_property)
            if result == 'Error':
                return False, 'Error initializing pose properties for dataset ' + dataset.name + \
                       '. Please try to initialize the pose properties again.', 400

        return True, 'Pose properties successfully initialized for dataset ' + dataset.name, 200
