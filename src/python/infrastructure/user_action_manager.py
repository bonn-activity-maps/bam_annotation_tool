from pymongo import MongoClient, errors
import logging

import python.config as cfg

from python.objects.user_action import UserAction

# user_action_manager logger
log = logging.getLogger('user_action_manager')


class UserActionManager:

    c = MongoClient(cfg.mongo["ip"], cfg.mongo["port"])
    db = c.cvg
    collection = db.userAction

    # Return corresponding user actions for 'user' stored in the db
    def get_user_action_by_user(self, dataset, user):
        try:
            result = self.collection.find({"user": user, "dataset": dataset.name}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return corresponding user actions for 'action' stored in the db
    def get_user_action_by_action(self, dataset, action):
        try:
            result = self.collection.find({"action": action, "dataset": dataset.name}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return corresponding user actions for 'user' stored in the db
    def get_user_action_by_user_action(self, dataset, user, action):
        try:
            result = self.collection.find({"user": user, "action": action, "dataset": dataset.name}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'
        
    # Return all user actions stored in the db
    def get_user_actions(self, dataset):
        try:
            result = self.collection.find({"dataset": dataset.name}, {"_id": 0}).sort("name")
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return 'ok' if the user action has been created
    def create_user_action(self, user_action):
        try:
            result = self.collection.insert_one(user_action.to_json())
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating user_action in db')
            return 'Error'

    # Return ok if the user action has been removed
    def remove_user_action(self, user_action):
        try:
            result = self.collection.delete_one(user_action.to_json())
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing user_action in db')
            return 'Error'
