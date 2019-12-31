import logging

from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager

from python.objects.activity import Activity

# UserService logger
log = logging.getLogger('actionService')

actionManager = ActionManager()
datasetManager = DatasetManager()


class ActionService:

    # Return list of actions in frame range
    def get_action(self, action):
        result = actionManager.get_action(action)
        if result == 'Error':
            return False, 'Error retrieving action', 400
        else:
            return True, result, 200

    # Return list of actions in frame range
    def get_actions(self, dataset, user, start_frame, end_frame):
        result = actionManager.get_actions(dataset, user, start_frame, end_frame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return list of actions by objectUID in frame range
    def get_actions_by_UID(self, dataset, object_uid, user, start_frame, end_frame):
        result = actionManager.get_actions_by_UID(dataset, object_uid, user, start_frame, end_frame)
        if result == 'Error':
            return False, 'Error retrieving actions', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return ok if action created successfully
    def create_action(self, action):
        # Check if task exist for this user
        if actionManager.get_action(action) != 'Error':
            return False, 'The action already exists', 400
        else:
            # Create task with lastFrame equal to frameFrom
            result = actionManager.create_action(action)
            if result == 'Error':
                return False, 'Error creating action', 400
            else:
                return True, 'ok', 200

    # Remove an action
    def remove_action(self,  action):
        result = actionManager.remove_action(action)
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
                                result = actionManager.remove_action(actionResult['dataset'], actionResult['objectUID'], actionResult['user'], actionResult['name'], actionResult['startFrame'], actionResult['endFrame'])
                                if result == 'Error': nested = False
                            else:
                                nested = False      # End loop if error occurs
                        else:   # There are no nested actions
                            nested = False
        return True, 'ok', 200