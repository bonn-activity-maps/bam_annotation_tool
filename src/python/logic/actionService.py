import logging

from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager

# UserService logger
log = logging.getLogger('actionService')

actionManager = ActionManager()
datasetManager = DatasetManager()


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

    # Merge all possible actions with same start and end frames
    def mergeActions(self):
        datasets = datasetManager.get_datasets()
        for d in datasets:
            actions = actionManager.getActionsByDataset(d['name'])

            # Check all actions of all datasets
            if actions != 'Error':
                for a in actions:

                    # Take into account actions divided in more than 1 range -> update until no more nested actions found
                    nested = True
                    while nested:

                        # Search if there is an action with startFrame = endFrame of actual action (or endFrame+1) = overlapping actions
                        actionResult = actionManager.getActionByStartFrame(a['dataset'], a['objectUID'], a['name'], a['endFrame'])

                        if actionResult != 'Error':
                            # Update action with greater endFrame
                            result = actionManager.updateActionByStartFrame(a['dataset'], a['objectUID'], a['name'], a['startFrame'], actionResult['endFrame'])
                            if result == 'ok':
                                a['endFrame'] = actionResult['endFrame']  # Update endFrame in actual action
                                # Remove action included in new range
                                result = actionManager.removeAction(actionResult['dataset'], actionResult['objectUID'], actionResult['user'], actionResult['name'], actionResult['startFrame'], actionResult['endFrame'])
                                if result == 'Error': nested = False
                            else:
                                nested = False      # End loop if error occurs
                        else:   # There are no nested actions
                            nested = False
        return True, 'ok', 200