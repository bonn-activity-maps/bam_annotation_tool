import logging

from python.infrastructure.activity_manager import ActivityManager

from python.objects.activity import Activity

# UserService logger
log = logging.getLogger('activity_service')

activity_manager = ActivityManager()


class ActivityService:

    # Return list of activities
    def get_activities(self):
        result = activity_manager.get_activities()
        if result == 'Error':
            return False, 'Error retrieving activities', 400
        else:
            return True, {"activities": Activity.to_list(result)}, 200

    # Return if activity has been created successfully
    def create_activity(self, activity):
        # Check if task exist for this user
        result = activity_manager.get_activity(activity)
        if result != 'Error':
            return False, 'The activity already exists', 400
        else:
            # Create new activity
            result = activity_manager.create_activity(activity)
            if result == 'Error':
                return False, 'Error creating activity', 400
            else:
                return True, 'Activity created successfully', 200

    # Return if the frame has been removed
    def remove_activity(self, activity):
        result = activity_manager.remove_activity(activity)
        if result == 'Error':
            return False, 'Error deleting activity', 400
        else:
            return True, 'Activity removed successfully', 200