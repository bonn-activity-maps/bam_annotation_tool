import logging

from python.infrastructure.user_action_manager import UserActionManager
from python.objects.user_action import UserAction

# user_action_service logger
log = logging.getLogger('user_action_service')

user_action_manager = UserActionManager()


class UserActionService:

    # Return list of user actions for 'user'
    def get_user_action_by_user(self, dataset, user):
        result = user_action_manager.get_user_action_by_user(dataset, user)
        if result == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return list of user actions for 'action'
    def get_user_action_by_action(self, dataset, action):
        result = user_action_manager.get_user_action_by_action(dataset, action)
        if result == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return list of user actions for 'user' and 'action'
    def get_user_action_by_user_action(self, dataset, user, action):
        result = user_action_manager.get_user_action_by_user_action(dataset, user, action)
        if result == 'Error':
            return False, 'Error retrieving user actions for user and action', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return list of user actions
    def get_user_actions(self, dataset):
        result = user_action_manager.get_user_actions(dataset)
        if result == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return if user action has been created successfully
    def create_user_action(self, user_action):
        # user_action = UserAction(user, action, scene, dataset)
        result = user_action_manager.create_user_action(user_action)
        if result == 'Error':
            return False, 'Error creating user action', 400
        else:
            return True, 'User action created successfully', 200

    # Return if the user action has been removed
    def remove_user_action(self, user_action):
        result = user_action_manager.remove_user_action(user_action)
        if result == 'Error':
            return False, 'Error deleting user action', 400
        else:
            return True, 'User action removed successfully', 200