import logging

from python.infrastructure.taskManager import TaskManager

# UserService logger
log = logging.getLogger('taskService')

taskManager = TaskManager()


class TaskService:

    # Return user info
    def getTask(this, name, user, dataset):
        result = taskManager.getTask(name, user, dataset)
        if result == 'Error':
            return False, 'Incorrect task', 400
        else:
            return True, result, 200

    # Return users info
    def getTasks(this, user, dataset):
        result = taskManager.getTasks(user, dataset)
        if result == 'Error':
            return False, 'Error searching tasks', 400
        else:
            return True, result, 200

     # Return 'ok' if the task has been created
    def createTask(this, req):
        name = req['name']
        user = req['user']
        dataset = req['dataset']
        # Check if task exist for this user
        if taskManager.getTask(name, user, dataset) != 'Error':
            return False, 'The task already exists', 400
        else:
            # Create task with lastFrame equal to frameFrom
            result = taskManager.createTask(name, user, dataset, req['frameFrom'], req['frameTo'], req['videos'],
                                            req['POV'], req['frameFrom'])
            if result == 'Error':
                return False, 'Error creating task', 400
            else:
                return True, {'name': name}, 200

    # Return 'ok' if the user has been removed
    def removeTask(this, name, user, dataset):
        result = taskManager.removeTask(name, user, dataset)
        if result == 'Error':
            return False, 'Error deleting task', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been updated
    def updateTask(this, req):
        result = taskManager.updateTask(req['name'], req['user'], req['dataset'],  req['frameFrom'], req['frameTo'], req['videos'],
                                        req['POV'], req['finished'], req['lastFrame'])
        if result == 'Error':
            return False, 'Error updating task', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been updated
    def finishTask(this, req):
        result = taskManager.updateFinished(req['name'], req['user'], req['dataset'], req['finished'])
        if result == 'Error':
            return False, 'Error finishing task', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been updated
    def updateFrameTask(this, req):
        result = taskManager.updateLastFrame(req['name'], req['user'], req['dataset'], req['lastFrame'])
        if result == 'Error':
            return False, 'Error updating task', 400
        else:
            return True, result, 200
