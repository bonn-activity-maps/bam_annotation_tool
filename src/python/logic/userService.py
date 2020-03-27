import logging
import string, random
import bcrypt

from python.infrastructure.userManager import UserManager
from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.annotationManager import AnnotationManager

# UserService logger
log = logging.getLogger('userService')

userManager = UserManager()
datasetManager = DatasetManager()
videoManager = VideoManager()
frameManager = FrameManager()
annotationManager = AnnotationManager()

class UserService:

    # Function to hash passwords, bcrypt is deliverately slow.
    def get_hashed_password(self, plain_text_password):
        # Hash a password for the first time
        #   (Using bcrypt, the salt is saved into the hash itself)
        return bcrypt.hashpw(plain_text_password.encode('utf-8'), bcrypt.gensalt())

    # Check if password is correct
    # Credits: Chris Dutrow, Mark Amery. https://stackoverflow.com/a/23768422/4925895
    def check_password(self, plain_text_password, hashed_password):
        # Check hashed password. Using bcrypt, the salt is saved into the hash itself
        return bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password)

    # Check if user exist and return user info
    def user_login(self, user, pwd):
        result = userManager.get_user_pwd(user)
        if result == 'Error':       # if user does not exist
            return False, 'Wrong credentials', 400

        if self.check_password(pwd, result.password):
            result.password = ''
            return True, result, 200
        else:
            return False, 'Wrong credentials', 400

    # Return user info
    def get_user(self, user):
        result = userManager.get_user(user)
        if result == 'Error':
            return False, 'Incorrect user', 400
        else:
            return True, result, 200

    # Return users info
    def get_users(self):
        result = userManager.get_users()
        if result == 'Error':
            return False, 'Error searching users', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return users info by dataset
    def get_users_by_dataset(self, dataset, role):
        result = userManager.get_users_by_dataset(dataset, role)
        if result == 'Error':
            return False, 'Error searching users by dataset', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return 'ok' if the user has been removed
    def remove_user(self, user):
        result = userManager.remove_user(user)
        if result == 'Error':
            return False, 'Error deleting user', 400
        else:
            return True, result, 200

    # Return 'ok' if the user has been created
    def create_user(self, user):
        # Check if users or email exist
        if userManager.get_user(user.name) != 'Error':
            return False, 'The username already exists', 400
        elif userManager.get_user_by_email(user.email) != 'Error':
            return False, 'The email already exists', 400
        else:
            # Create random password of length 12
            pwd = u"".join(random.choices(string.ascii_uppercase + string.digits, k=12))
            # pwd = u"test"
            user.password = self.get_hashed_password(pwd)

            result = userManager.create_user(user)
            if result == 'Error':
                return False, 'Error creating user', 400
            else:
                result = self.duplicate_annotations(user.assigned_to, user.name)
                if not result:
                    return False, "Error duplicating annotations", 400

                ## TODO: send password to email
                return True, {'name': user.name, 'password': pwd}, 200

    # Check if the the user has annotations of his own for the assignated datasets and create a copy of root's otherwise
    # Deactivated temporarily due to switch to Master annotation. Left here for possible switch back.
    def duplicate_annotations(self, datasets, user):
        # for dataset in datasets:
        #     data = datasetManager.get_dataset(dataset)
        #     if data['type'] == 'poseTrack':     # In the future, probably for aik too
        #         videos = videoManager.get_videos(dataset)
        #         for video in videos:
        #             annotations = annotationManager.get_annotations(dataset, data['type'], video['name'], user, None)
        #             if not annotations:  # Else already exist
        #                 annotations = annotationManager.get_annotations(dataset, data['type'], video['name'], 'root', None)
        #                 for annotation in annotations:
        #                     result = annotationManager.update_annotation(dataset, video['name'], annotation['frame'],
        #                                                                 user, annotation['objects'])
        #                     if result == 'Error':
        #                         return False
        return True

    # Return 'ok' if the user has been updated
    def update_user(self, user):
        result = userManager.update_user(user)
        if result == 'Error':
            return False, 'Error updating user', 400
        else:
            result = self.duplicate_annotations(user.assigned_to, user.name)
            if not result:
                return False, 'Error duplicating annotations', 400
            else:
                return True, result, 200

    # Return 'ok' if the password of 'user' has been updated
    def update_user_password(self, user, pwd):
        result = userManager.update_user_password(user, self.get_hashed_password(pwd))
        if result == 'Error':
            return False, 'Error updating password', 400
        else:
            return True, 'Password successfully updated', 200
