from pymongo import MongoClient, errors
import logging

import python.config as cfg

from python.objects.pose_property import PoseProperty

# pose_property_manager logger
log = logging.getLogger('pose_property_manager')


class PosePropertyManager:

    c = MongoClient(cfg.mongo["ip"], cfg.mongo["port"])
    db = c.cvg
    collection = db.poseProperty

    # Return corresponding pose_properties for 'dataset' stored in the db
    def get_pose_properties_by_dataset(self, dataset, scene):
        try:
            result = self.collection.find({"dataset": dataset.name, "scene": scene}, {"_id": 0}).sort("uid", 1)
            return [PoseProperty.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding pose properties in db')
            return 'Error'

    # Return corresponding pose_properties for 'uid' and 'type' stored in the db
    def get_pose_property_by_uid(self, dataset, scene, type, uid):
        try:
            result = self.collection.find_one({"dataset": dataset.name, "scene": scene, "type": type, "uid": uid}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return PoseProperty.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding pose property in db')
            return 'Error'

    # Update the pose_property. If it does not exist, it is created
    # Return 'ok' if the user action has been created or updated
    def update_pose_property(self, pose_property):
        query = {"dataset": pose_property.dataset.name, "scene": pose_property.scene,
                 "type": pose_property.type, "uid": pose_property.uid}
        # Update values
        new_values = {"$set": {"lowerLegLength": pose_property.lower_leg_length,
                               "upperLegLength": pose_property.upper_leg_length,
                               "lowerArmLength": pose_property.lower_arm_length,
                               "upperArmLength": pose_property.upper_arm_length}}
        try:
            result = self.collection.update_one(query, new_values, upsert=True)
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating pose property in db')
            return 'Error'

    # Return ok if the pose_property has been removed
    def remove_pose_property(self, dataset, scene, type, uid):
        try:
            result = self.collection.delete_one({"dataset": dataset.name, "scene": scene, "type": type, "uid": uid})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing pose_property in db')
            return 'Error'
