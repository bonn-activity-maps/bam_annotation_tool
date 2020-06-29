from pymongo import MongoClient, errors
import logging
from bson.son import SON

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
            result = self.collection.find({"dataset": dataset.name, "user": user}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return corresponding user actions for 'action' stored in the db
    def get_user_action_by_action(self, dataset, action):
        try:
            result = self.collection.find({"dataset": dataset.name, "action": action}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return corresponding user actions for 'user' stored in the db
    def get_user_action_by_user_action(self, dataset, user, action):
        try:
            result = self.collection.find({"dataset": dataset.name, "user": user, "action": action}, {"_id": 0})
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'
        
    # Return all user actions stored in the db
    def get_user_actions(self, dataset):
        try:
            result = self.collection.find({"dataset": dataset.name}, {"_id": 0}).sort("timestamp")
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return all log in actions (more recent first)
    def get_user_actions_by_login(self, user):
        try:
            result = self.collection.find({"user": user, "action": "login"}, {"_id": 0}).sort("timestamp", -1)
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return first log out action after log in timestamp (old ones first)
    def get_user_action_by_logout(self, user, log_in_timestamp):
        try:
            result = self.collection.find({"user": user, "action": "logout", "timestamp": {"$gt": log_in_timestamp}},
                                              {"_id": 0}).sort("timestamp")
            result = list(result)
            if result:
                return [UserAction.from_json(r) for r in result][0]
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return user actions between log in and out timestamps (more recent first)
    def get_user_actions_in_range(self, user, log_in_timestamp, log_out_timestamp):
        try:
            result = self.collection.find({"user": user, "timestamp": {"$gt": log_in_timestamp, "$lt": log_out_timestamp}},
                                              {"_id": 0}).sort("timestamp", -1)
            return [UserAction.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return number of user actions between log in and out timestamps
    def get_user_actions_in_range_count(self, user, log_in_timestamp, log_out_timestamp):
        try:
            result = self.collection.find({"user": user, "timestamp": {"$gt": log_in_timestamp, "$lt": log_out_timestamp}},
                                              {"_id": 0}).sort("timestamp").count()
            return result
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return number of user actions for user by day (more recent first)
    def get_user_actions_by_day(self, user):
        try:
            # Filter by user and exclude login/out actions
            match = {"user": user, "$and": [{"action": {"$ne": "login"}}, {"action": {"$ne": "logout"}}]}
            # Group by day using timestamp and count actions
            group = {"_id": {"$dateToString": {"format": "%d/%m/%Y", "date": "$timestamp"}}, "actions": {"$sum": 1}}
            # Project actions and change name from id to labels
            project = {"_id": 0, "date": "$_id", "actions": 1}
            # Sort by more recent day
            sort = {"$sort": SON([("date", -1)])}

            result = self.collection.aggregate([{"$match": match}, {"$group": group}, {"$project": project}, sort])
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return number of user actions for user by day (more recent first)
    def get_user_actions_by_dataset_and_day(self, user, dataset):
        try:
            # Filter by user and dataset, and exclude login/out actions
            match = {"user": user, "dataset": dataset.name, "$and": [{"action": {"$ne": "login"}}, {"action": {"$ne": "logout"}}]}
            # Group by day using timestamp and count actions
            group = {"_id": {"$dateToString": {"format": "%d/%m/%Y", "date": "$timestamp"}}, "actions": {"$sum": 1}}
            # Project actions and change name from id to labels
            project = {"_id": 0, "date": "$_id", "actions": 1}
            # Sort by more recent day
            sort = {"$sort": SON([("date", -1)])}

            result = self.collection.aggregate([{"$match": match}, {"$group": group}, {"$project": project}, sort])
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding user_action in db')
            return 'Error'

    # Return all user actions for a dataset and scene
    def get_user_actions_for_scene(self, dataset, scene):
        try:
            result = self.collection.find({"dataset": dataset.name, "scene": scene}, {"_id": 0}).sort("timestamp", -1)
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
