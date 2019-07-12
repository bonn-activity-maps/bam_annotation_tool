from pymongo import MongoClient, errors
import logging

# TaskManager logger
log = logging.getLogger('taskManager')


class TaskManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.task

    # Return info of task by user if exist in DB. Ignore mongo id
    def getTask(self, task, user, dataset):
        try:
            result = self.collection.find_one({"name": task, "assignedUser": user, "dataset": dataset}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding task in db')
            return 'Error'

    # Return list with info of all tasks by user. Empty list if there are no tasks
    # Ignore mongo id
    def getTasks(self, user, dataset):
        try:
            result = self.collection.find({"assignedUser": user, "dataset": dataset}, {"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding tasks in db')
            return 'Error'

    # Return 'ok' if the task has been created
    def createTask(self, task, user, dataset, scene, frameFrom, frameTo, description, pov, lastFrame=0, finished=False):
        try:
            result = self.collection.insert_one({"name": task, "assignedUser": user, "dataset": dataset, "scene": scene,
                                                 "frameFrom": frameFrom, "frameTo": frameTo, "description": description,
                                                 "POV": pov, "finished": finished, "lastFrame": lastFrame})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating task in db')
            return 'Error'

    # Return 'ok' if the task has been removed
    def removeTask(self, task, user, dataset):
        try:
            result = self.collection.delete_one({"name": task, "assignedUser": user, "dataset": dataset})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing task in db')
            return 'Error'

    # Return 'ok' if the task has been updated. if task doesn't exist, it isn't created
    def updateTask(self, task, user, dataset, scene, frameFrom, frameTo, description, pov, lastFrame, finished):
        query = {"name": task, "assignedUser": user, "dataset": dataset, "scene": scene}      # Search by task name, assigned user, scene and dataset
        # Update all values
        newValues = {"$set": {"frameFrom": frameFrom, "frameTo": frameTo,  "description": description,
                              "POV": pov, "finished": finished, "lastFrame": lastFrame}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating task in db')
            return 'Error'

    # Return 'ok' if the finished flag has been updated. if task doesn't exist, it isn't created
    def updateFinished(self, task, user, dataset, scene, finished):
        query = {"name": task, "assignedUser": user, "dataset": dataset, "scene": scene}      # Search by task name, assigned user, scene and dataset
        newValues = {"$set": {"finished": finished}}      # Update finished flag
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating finished flag task in db')
            return 'Error'

    # Return 'ok' if the lastFrame has been updated. if task doesn't exist, it isn't created
    def updateLastFrame(self, task, user, dataset, scene, lastFrame):
        query = {"name": task, "assignedUser": user, "dataset": dataset, "scene": scene}      # Search by task name, assigned user, scene and dataset
        newValues = {"$set": {"lastFrame": lastFrame}}    # Update lastFrame
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating lastFrame task in db')
            return 'Error'
