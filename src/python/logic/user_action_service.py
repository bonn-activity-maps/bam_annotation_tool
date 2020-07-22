import logging
import numpy as np
from datetime import datetime, timedelta, time

from python.infrastructure.user_action_manager import UserActionManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.userManager import UserManager
from python.objects.user_action import UserAction

from python.objects.dataset import Dataset

# user_action_service logger
log = logging.getLogger('user_action_service')

user_action_manager = UserActionManager()
video_manager = VideoManager()
annotation_manager = AnnotationManager()
user_manager = UserManager()


class UserActionService:

    SESSION_THRESHOLD = timedelta(hours=9)

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
    def get_statistic_actions_per_session(self, user):
        labels = []
        data = []
        # Get all login actions
        log_in_results = user_action_manager.get_user_actions_login(user)

        for i, log_in in enumerate(log_in_results):
            # Get corresponding log out
            log_out_result = user_action_manager.get_user_action_logout_after_login(user, log_in.timestamp)

            if log_out_result:
                # Add time between login-logout only if it's smaller than 9h and it happened before the next login
                # (if not, the logout has not been stored)
                log_out_timestamp = log_out_result.timestamp
                duration = log_out_timestamp - log_in.timestamp
                if i == 0 and duration < self.SESSION_THRESHOLD:
                    num_actions = user_action_manager.get_user_actions_in_range_count(user, log_in.timestamp, log_out_timestamp)
                elif i != 0 and duration < self.SESSION_THRESHOLD and log_out_result.timestamp < log_in_results[i-1].timestamp:
                    num_actions = user_action_manager.get_user_actions_in_range_count(user, log_in.timestamp, log_out_timestamp)
                else:   # Look for last annotation in that session, before next login
                    _, last_timestamp = self.get_duration_last_actions_between_logins(i, user, log_in.timestamp, log_in_results[i-1].timestamp)
                    if last_timestamp is None:
                        num_actions = 0
                    else:
                        num_actions = user_action_manager.get_user_actions_in_range_count(user, log_in.timestamp, last_timestamp)
                        log_out_timestamp = last_timestamp
            else:   # Look for last annotation in that session, before next login
                _, last_timestamp = self.get_duration_last_actions_between_logins(i, user, log_in.timestamp, log_in_results[i-1].timestamp)
                if last_timestamp is None:
                    num_actions = 0
                else:
                    num_actions = user_action_manager.get_user_actions_in_range_count(user, log_in.timestamp, last_timestamp)
                    log_out_timestamp = last_timestamp

            # Append data to labels and data if there has been actions in that session
            if num_actions != 0:
                labels.append(str(log_in.timestamp) + " - " + str(log_out_timestamp))
                data.append(num_actions)

        return True, {"labels": labels, "data": data}, 200

    # Return actions per minute for each user
    def get_statistic_avg_actions_per_minute(self, dataset, user):
        # Get info only for specified user
        if user != 'None':
            users = [user_manager.get_user(user)]
        else:
            users = user_manager.get_users_by_dataset(dataset.name, 'user')
        labels = []
        data = []

        for user in users:
            total_num_actions = 0
            total_logged_in_time = timedelta()

            # Get all login actions
            log_in_results = user_action_manager.get_user_actions_login(user.name)

            # Get time and actions in each session
            for i, log_in in enumerate(log_in_results):
                # Get corresponding log out and actions in between
                log_out_result = user_action_manager.get_user_action_logout_after_login(user.name, log_in.timestamp)

                if log_out_result:
                    # Add time between login-logout only if it's smaller than 9h and it happened before the next login
                    # (if not, the logout has not been stored)
                    duration = log_out_result.timestamp - log_in.timestamp
                    if i == 0 and duration < self.SESSION_THRESHOLD:
                        total_num_actions += user_action_manager.get_user_actions_in_range_count(user.name, log_in.timestamp, log_out_result.timestamp)
                        total_logged_in_time += duration
                    elif i != 0 and duration < self.SESSION_THRESHOLD and log_out_result.timestamp < log_in_results[i-1].timestamp:
                        total_num_actions += user_action_manager.get_user_actions_in_range_count(user.name, log_in.timestamp, log_out_result.timestamp)
                        total_logged_in_time += duration
                    else:   # Look for last annotation in that session, before next login
                        duration, last_timestamp = self.get_duration_last_actions_between_logins(i, user.name, log_in.timestamp, log_in_results[i-1].timestamp)
                        if last_timestamp is not None:
                            total_num_actions += user_action_manager.get_user_actions_in_range_count(user.name, log_in.timestamp, last_timestamp)
                            total_logged_in_time += duration
                else:   # Look for last annotation in that session, before next login
                    duration, last_timestamp = self.get_duration_last_actions_between_logins(i, user.name, log_in.timestamp, log_in_results[i-1].timestamp)
                    if last_timestamp is not None:
                        total_num_actions += user_action_manager.get_user_actions_in_range_count(user.name, log_in.timestamp, last_timestamp)
                        total_logged_in_time += duration

            # Append data to labels and data
            total_logged_in_time_minutes = total_logged_in_time.total_seconds() / 60

            if total_logged_in_time_minutes > 0.0:       # Ignore user if it has 0 minutes
                labels.append(user.name)
                data.append(total_num_actions / total_logged_in_time_minutes)

        return True, {"labels": labels, "data": data}, 200

    # Return time between log_in_timestamp and last action before next_timestamp
    def get_duration_last_actions_between_logins(self, i, user, log_in_timestamp, next_timestamp):
        if i == 0:
            next_timestamp = datetime.now()
        # print('range: ',log_in_timestamp, ' - ', next_timestamp)
        annotation_result = user_action_manager.get_last_user_action_between_logins(user, log_in_timestamp,
                                                                                    next_timestamp)
        if annotation_result:
            duration = annotation_result.timestamp - log_in_timestamp
            # print('last annotation: ', annotation_result.timestamp)
            # print('duration: ', duration)
            return duration, annotation_result.timestamp
        else:
            return timedelta(), None

    # Return number of updates in each interval where the user has been logged in
    def get_statistic_hours_per_week(self, user):
        labels = []
        data = []
        date_format = "%d/%m/%Y"

        index = 0
        step = timedelta(days=7)

        # Get all login actions
        log_in_results = user_action_manager.get_user_actions_login(user)

        # If there are no log ins append 0h
        if not log_in_results:
            next_week = datetime.now() - step
            labels.append(datetime.now().strftime(date_format) + '-' + next_week.strftime(date_format))
            data.append(timedelta())
        else:
            # Initialize new week: Append label and 0h
            next_week = log_in_results[index].date_dd_mm_yy() - step
            labels.append(log_in_results[index].date_dd_mm_yy().strftime(date_format) + '-' + next_week.strftime(date_format))
            data.append(timedelta())

            for i, log_in in enumerate(log_in_results):
                # Change week if it's needed --> Initialize new week: Append label and 0h
                if log_in.timestamp < next_week:
                    labels.append(next_week.strftime(date_format) + '-' + (next_week-step).strftime(date_format))
                    next_week -= step
                    data.append(timedelta())
                    index += 1

                # Get corresponding log out and actions in between
                log_out_result = user_action_manager.get_user_action_logout_after_login(user, log_in.timestamp)
                if log_out_result:
                    # Add time between login-logout only if it's smaller than 9h and it happened before the next login
                    # (if not, the logout has not been stored)
                    duration = log_out_result.timestamp - log_in.timestamp
                    if i == 0 and duration < self.SESSION_THRESHOLD:
                        data[index] += duration
                    elif i != 0 and duration < self.SESSION_THRESHOLD and log_out_result.timestamp < log_in_results[i-1].timestamp:
                        data[index] += duration
                    else:   # Look for last annotation in that session, before next login
                        duration, _ = self.get_duration_last_actions_between_logins(i, user, log_in.timestamp, log_in_results[i-1].timestamp)
                        data[index] += duration
                else:   # Look for last annotation in that session, before next login
                    duration, _ = self.get_duration_last_actions_between_logins(i, user, log_in.timestamp, log_in_results[i-1].timestamp)
                    data[index] += duration

        # Transform timedelta to hours
        data = [x.total_seconds() // 3600 for x in data]
        return True, {"labels": labels, "data": data}, 200

    # Return number of user actions for user by day
    # Filter by dataset if dataset is not None
    def get_statistic_actions_per_day(self, user, dataset, dataset_type):
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

    # Return time between first and last annotation for a scene in posetrack
    def get_user_actions_time_per_scene_pt(self, dataset):
        # Get all scenes
        videos = video_manager.get_videos(dataset)
        if videos == 'Error':
            return 'Error'

        labels = []
        data = []
        for video in videos:
            result = user_action_manager.get_user_actions_for_scene(dataset, video.name)

            # Calculate time between first and last annotation in that scene and append data
            if result and result != 'Error':
                last_time = result[0].timestamp
                first_time = result[-1].timestamp
                time = last_time - first_time

                labels.append(video.name)
                data.append(time)
        return labels, data

    # Return time between first and last annotation for a scene in posetrack
    def get_statistic_time_per_scene(self, dataset):
        labels, data = self.get_user_actions_time_per_scene_pt(dataset)
        if labels == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            return True, {"labels": labels, "data": data}, 200

    # Return max, mix and average time to annotate the scenes in posetrack
    def get_statistic_stats_per_scenes(self, dataset):
        labels, data = self.get_user_actions_time_per_scene_pt(dataset)
        if labels == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:
            data = np.array(data)
            max_index = np.argmax(data)
            min_index = np.argmin(data)
            avg = np.mean(data)

            new_labels = ['max: ' + labels[max_index], 'min: ' + labels[min_index], 'mean']
            new_data = [data[max_index], data[min_index], avg]

            return True, {"labels": new_labels, "data": new_data}, 200

    # Return max, mix and average time divided by the number of persons within a sequence to annotate the scenes in posetrack
    def get_statistic_stats_per_scenes_per_persons(self, dataset):
        labels, data = self.get_user_actions_time_per_scene_pt(dataset)
        if labels == 'Error':
            return False, 'Error retrieving actions of user', 400
        else:

            # Divide each scene between number of persons
            for i, scene in enumerate(labels):
                number_persons = annotation_manager.get_number_persons_pt(dataset, scene)
                data[i] /= number_persons

            data = np.array(data)
            max_index = np.argmax(data)
            min_index = np.argmin(data)
            avg = np.mean(data)

            new_labels = ['max: ' + labels[max_index], 'min: ' + labels[min_index], 'mean']
            new_data = [data[max_index], data[min_index], avg]

            return True, {"labels": new_labels, "data": new_data}, 200

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