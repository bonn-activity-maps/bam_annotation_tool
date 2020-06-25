import logging
from datetime import datetime, timedelta, time

from python.infrastructure.user_action_manager import UserActionManager
from python.objects.user_action import UserAction

from python.objects.dataset import Dataset

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

    # Return number of updates in each interval where the user has been logged in
    def get_user_actions_by_login(self, user):
        labels = []
        data = []
        # Get all login actions
        log_in_results = user_action_manager.get_user_actions_by_login(user)

        for log_in in log_in_results:
            # Get corresponding log out and actions in between
            log_out_result = user_action_manager.get_user_action_by_logout(user, log_in.timestamp)
            result = user_action_manager.get_user_actions_in_range_count(user, log_in.timestamp, log_out_result.timestamp)

            # Append data to labels and data
            labels.append(str(log_in.timestamp) + " - " + str(log_out_result.timestamp))
            data.append(result)

        return True, {"labels": labels, "data": data}, 200

    # Return number of updates in each interval where the user has been logged in
    def get_user_actions_time_by_week(self, user):
        labels = []
        data = []
        date_format = "%d/%m/%Y"

        index = 0
        step = timedelta(days=7)

        # Get all login actions
        log_in_results = user_action_manager.get_user_actions_by_login(user)

        # If there are no log ins
        if not log_in_results:
            next_week = datetime.now() - step
            labels.append(datetime.now().strftime(date_format) + '-' + next_week.strftime(date_format))
            # data.append(timedelta())
            data.append(0)
        else:
            next_week = log_in_results[index].date_dd_mm_yy() - step

            labels.append(log_in_results[index].date_dd_mm_yy().strftime(date_format) + '-' + next_week.strftime(date_format))
            # data.append(timedelta())
            data.append(0)
            for log_in in log_in_results:
                # Change week if it's needed
                if log_in.timestamp < next_week:
                    labels.append(next_week.strftime(date_format) + '-' + (next_week-step).strftime(date_format))
                    next_week -= step
                    index += 1
                    # data.append(timedelta())
                    data.append(0)

                # Get corresponding log out and actions in between
                log_out_result = user_action_manager.get_user_action_by_logout(user, log_in.timestamp)
                if log_out_result:
                    # Add time between login-logout
                    duration = log_out_result.timestamp - log_in.timestamp
                    seconds = duration.total_seconds()
                    hours = seconds // 3600
                    data[index] += hours
                    # print(data[index])
                    # print(type(data[index]))

        return True, {"labels": labels, "data": data}, 200

    # Return number of user actions for user by day
    # Filter by dataset if dataset is not None
    def get_user_actions_by_day(self, user, dataset, dataset_type):
        if dataset != "None":
            dataset = Dataset(dataset, dataset_type)
            result = user_action_manager.get_user_actions_by_dataset_and_day(user, dataset)
        else:
            result = user_action_manager.get_user_actions_by_day(user)

        if result == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            labels = [r['date'] for r in result]
            data = [r['actions'] for r in result]
            return True, {"labels": labels, "data": data}, 200

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