import logging

from python.infrastructure.actionManager import ActionManager

# UserService logger
log = logging.getLogger('actionService')

actionManager = ActionManager()


class ActionService:

    # Return list of activities
    def getActivities(self):
        result = actionManager.getActivities()
        if result == 'Error':
            return False, 'Error retrieving activities', 400
        else:
            return True, result, 200

    # Return ok if action created successfully
    def createAction(self, req):
        print(req)
        objectUID = req['objectUID']
        label = req['label']
        startFrame = req['startFrame']
        endFrame = req['endFrame']

        # Check if task exist for this user
        if actionManager.getAction(objectUID, label, startFrame, endFrame) != 'Error':
            return False, 'The action already exists', 400
        else:
            # Create task with lastFrame equal to frameFrom
            result = actionManager.createAction(objectUID, label, startFrame, endFrame)
            if result == 'Error':
                return False, 'Error creating task', 400
            else:
                return True, 'ok', 200

    # Return list of actions by objectUID in frame range
    def getActionsByUID(self, objectUID, startFrame, endFrame):
        result = actionManager.getActionsByUID(objectUID, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, result, 200

    # Return list of actions in frame range
    def getActions(self, startFrame, endFrame):
        result = actionManager.getActions(startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, result, 200

    # Return list of actions in frame range
    def getAction(self, objectUID, label, startFrame, endFrame):
        result = actionManager.getAction(objectUID, label, startFrame, endFrame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, result, 200
