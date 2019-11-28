import logging

from python.infrastructure.actionManager import ActionManager

# UserService logger
log = logging.getLogger('actionService')

actionManager = ActionManager()


class ActionService:

    # Return ok if activity created successfully
    def createActivity(self, req):
        dataset = req['dataset']
        activity = {"name": req['activity']}

        # Check if task exist for this user
        activities = actionManager.getActivities(dataset)
        if activity in activities:
            return False, 'The activity already exists', 400
        else:
            # Create new activity
            result = actionManager.createActivity(dataset, activity["name"])
            if result == 'Error':
                return False, 'Error creating activity', 400
            else:
                return True, 'Activity created successfully', 200

    # Return list of activities
    def getActivities(self, dataset):
        result = actionManager.getActivities(dataset)
        if result == 'Error':
            return False, 'Error retrieving activities', 400
        else:
            activities = [d['name'] for d in result]
            return True, {"activities": activities}, 200

    # Return ok if action created successfully
    def createAction(self, req):
        dataset = req['dataset']
        objectUID = req['objectUID']
        name = req['name']
        user = req['user']
        startFrame = req['startFrame']
        endFrame = req['endFrame']

        # Check if task exist for this user
        if actionManager.getAction(dataset, objectUID, user, name, startFrame, endFrame) != 'Error':
            return False, 'The action already exists', 400
        else:
            # Create task with lastFrame equal to frameFrom
            result = actionManager.createAction(dataset, objectUID, user, name, startFrame, endFrame)
            if result == 'Error':
                return False, 'Error creating action', 400
            else:
                return True, 'ok', 200

    # Return list of actions by objectUID in frame range
    def getActionsByUID(self, dataset, objectUID, user, startFrame, endFrame):
        result = actionManager.getActionsByUID(dataset, objectUID, user, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, result, 200

    # Return list of actions in frame range
    def getActions(self, dataset, user, startFrame, endFrame):
        result = actionManager.getActions(dataset, user, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, result, 200

    # Return list of actions in frame range
    def getAction(self, dataset, objectUID, user, name, startFrame, endFrame):
        result = actionManager.getAction(dataset, objectUID, user, name, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving action', 400
        else:
            return True, result, 200

    # Remove an action
    def removeAction(self,  req):
        dataset = req['dataset']
        objectUID = req['objectUID']
        name = req['name']
        user = req['user']
        startFrame = req['startFrame']
        endFrame = req['endFrame']

        result = actionManager.removeAction(dataset, objectUID, user, name, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error deleting action', 400
        else:
            return True, result, 200