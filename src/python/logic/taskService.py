import logging

from python.infrastructure.taskManager import TaskManager
from python.infrastructure.annotationManager import AnnotationManager

# UserService logger
log = logging.getLogger('taskService')

taskManager = TaskManager()
annotationManager = AnnotationManager()


class TaskService:

    # Return task info
    def getTask(self, name, user, dataset):
        result = taskManager.getTask(name, user, dataset)
        if result == 'Error':
            return False, 'Incorrect task', 400
        else:
            return True, result, 200

    # Return tasks info
    def getTasks(self, user, dataset):
        result = taskManager.getTasks(user, dataset)
        if result == 'Error':
            return False, 'Error searching tasks', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been created
    # Create new annotation with existing annotation from root user
    def createTask(self, name, user, dataset, scene, frameFrom, frameTo, description, pov):

        # Check if task exist for this user
        if taskManager.getTask(name, user, dataset) != 'Error':
            return False, 'The task already exists', 400
        else:
            # Create task with lastFrame equal to frameFrom
            result = taskManager.createTask(name, user, dataset, scene, frameFrom, frameTo, description, pov,
                                            lastFrame=frameFrom)
            if result == 'Error':
                return False, 'Error creating task', 400
            else:
                # Duplicate existing root annotations for all frames to user (copy the keypoints given in the dataset)
                for frame in range(frameFrom, frameTo+1):
                    annotation = annotationManager.get_annotation(dataset, scene, frame, 'root')

                    # Copy existing annotation only if there exist one for root user with objects
                    if annotation:
                        result = annotationManager.update_annotation(dataset, scene, frame, user, annotation['objects'])
                        # TODO: handle errors
                return True, 'ok', 200
                # return True, {'name': name}, 200

    # Return 'ok' if the task has been removed
    def removeTask(self, name, user, dataset):
        result = taskManager.removeTask(name, user, dataset)
        if result == 'Error':
            return False, 'Error deleting task', 400
        else:
            return True, result, 200

    # TODO: check if we can modify the task and the framesTo and from, then we should check which are new and copy the annotstions
    # Return 'ok' if the task has been updated
    def updateTask(self, name, user, dataset, scene, frameFrom, frameTo, description, pov, lastFrame, finished):
        result = taskManager.updateTask(name, user, dataset, scene, frameFrom, frameTo, description, pov, lastFrame, finished)
        if result == 'Error':
            return False, 'Error updating task', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been updated
    def finishTask(self, name, user, dataset, scene, finished):
        result = taskManager.updateFinished(name, user, dataset, scene, finished)
        if result == 'Error':
            return False, 'Error finishing task', 400
        else:
            return True, result, 200

    # Return 'ok' if the task has been updated
    def updateFrameTask(self, name, user, dataset, scene, lastFrame):
        result = taskManager.updateLastFrame(name, user, dataset, scene, lastFrame)
        if result == 'Error':
            return False, 'Error updating task', 400
        else:
            return True, result, 200
