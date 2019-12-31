from pymongo import MongoClient, errors
import logging

from python.objects.activity import Activity

# TaskManager logger
log = logging.getLogger('activity_manager')


class ActivityManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.activities

    # Return corresponding activity stored in the db
    def get_activity(self, activity):
        try:
            result = self.collection.find_one({"name": activity.name}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return Activity.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding activity in db')
            return 'Error'
        
    # Return the list of possible human activities stored in the db
    def get_activities(self):
        try:
            result = self.collection.find({}, {"_id": 0}).sort("name")
            if result is None:
                return 'Error'
            else:
                return [Activity.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding activities in db')
            return 'Error'

    # Return 'ok' if the action has been created
    def create_activity(self, activity):
        try:
            result = self.collection.insert_one({"name": activity.name})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating activity in db')
            return 'Error'

    # Return ok if the activity has been removed
    def remove_activity(self, activity):
        try:
            result = self.collection.delete_one({"name": activity.name})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing activity in db')
            return 'Error'
