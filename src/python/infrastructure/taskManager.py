from pymongo import MongoClient, errors
import logging

# VideoService logger
log = logging.getLogger('taskManager')


class TaskManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.task

    # Return info of task by user if exist in DB. Ignore mongo id
    def getTask(this, task, user):
        try:
            result = this.collection.find_one({"name": task, "assignedUser": user}, {"_id": 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding task in db')
            return 'Error'

    # Return list with info of all tasks by user. Empty list if there are no tasks
    # Ignore mongo id
    def getTasks(this, user):
        try:
            result = this.collection.find({"assignedUser": user}, {"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding tasks in db')
            return 'Error'

    # Return 'ok' if the task has been created
    def createTask(this, task, user, frameFrom, frameTo, videos, POV, lastFrame=0, finished=0):
        try:
            result = this.collection.insert_one({"name": task, "assignedUser": user, "frameFrom": frameFrom, "frameTo": frameTo,
                                                 "videos": videos, "POV": POV, "finished": finished, "lastFrame": lastFrame})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating video in db')
            return 'Error'

    # Return 'ok' if the task has been removed
    def removeTask(this, task, user):
        try:
            result = this.collection.delete_one({"name": task, "assignedUser": user})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing video in db')
            return 'Error'

    # Return 'ok' if the task has been updated. if task doesn't exist, it isn't created
    def updateTask(this, task, user, frameFrom, frameTo, videos, POV, finished, lastFrame):
        query = {"name": task, "assignedUser": user}      # Search by task name and assigned user
        # Update all values
        newValues = {"$set": {"frameFrom": frameFrom, "frameTo": frameTo, "videos": videos, "POV": POV,
                              "finished": finished, "lastFrame": lastFrame}}
        try:
            result = this.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating task in db')
            return 'Error'

    # Return 'ok' if the finished flag has been updated. if task doesn't exist, it isn't created
    def updateFinished(this, task, user, finished):
        query = {"name": task, "assignedUser": user}      # Search by task name and assigned user
        newValues = {"$set": {"finished": finished}}      # Update finished flag
        try:
            result = this.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating finished flag task in db')
            return 'Error'

    # Return 'ok' if the lastFrame has been updated. if task doesn't exist, it isn't created
    def updateLastFrame(this, task, user, lastFrame):
        query = {"name": task, "assignedUser": user}      # Search by task name and assigned user
        newValues = {"$set": {"lastFrame": lastFrame}}    # Update lastFrame
        try:
            result = this.collection.update_one(query, newValues, upsert=False)
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating lastFrame task in db')
            return 'Error'
