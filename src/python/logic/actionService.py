import logging
import copy

from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.user_action_manager import UserActionManager

from python.objects.user_action import UserAction

# actionService logger
log = logging.getLogger('actionService')

actionManager = ActionManager()
datasetManager = DatasetManager()
user_action_manager = UserActionManager()


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
                # Create user action in db
                user_action = UserAction(action.user, 'action', action.dataset.name, action.dataset)
                user_action_manager.create_user_action(user_action)
                return True, 'ok', 200

    # Remove an action
    def remove_action(self,  action):
        result = actionManager.remove_action(action)
        if result == 'Error':
            return False, 'Error deleting action', 400
        else:
            return True, result, 200

    # Merge all possible actions with same start and end frames
    def merge_actions(self):
        datasets = datasetManager.get_datasets()
        for d in datasets:
            actions = actionManager.get_actions_by_dataset(d)

            # Check all actions of all datasets
            if actions != 'Error':
                for a in actions:

                    # Take into account actions divided in more than 1 range -> update until no more nested actions found
                    nested = True
                    while nested:

                        # Search if there is an action with startFrame = endFrame of actual action (or endFrame+1) = overlapping actions
                        action_result = actionManager.get_action_by_start_frame(a)

                        if action_result != 'Error':
                            # Update action with greater endFrame
                            new_action = copy.copy(a)
                            new_action.end_frame = action_result.end_frame

                            result = actionManager.update_action_by_start_frame(new_action)
                            if result == 'ok':
                                a.end_frame = action_result.end_frame  # Update endFrame in actual action
                                # Remove action included in new range
                                result = actionManager.remove_action(action_result)
                                if result == 'Error': nested = False
                            else:
                                nested = False      # End loop if error occurs
                        else:   # There are no nested actions
                            nested = False
        return True, 'ok', 200
