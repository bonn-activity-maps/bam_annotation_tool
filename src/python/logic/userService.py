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
    def getHashedPassword(self, plain_text_password):
        # Hash a password for the first time
        #   (Using bcrypt, the salt is saved into the hash itself)
        return bcrypt.hashpw(plain_text_password.encode('utf-8'), bcrypt.gensalt())

    # Check if password is correct
    # Credits: Chris Dutrow, Mark Amery. https://stackoverflow.com/a/23768422/4925895
    def checkPassword(self, plain_text_password, hashed_password):
        # Check hashed password. Using bcrypt, the salt is saved into the hash itself
        return bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password)

    # Check if user exist and return user info
    def userLogin(self, user, pwd):
        result = userManager.getUserPwd(user)
        if self.checkPassword(pwd, result['password']):
            del result['password']
            return True, result, 200
        else:
            return False, 'Wrong credentials', 400

    # Return user info
    def getUser(self, user):
        result = userManager.getUser(user)
        if result == 'Error':
            return False, 'Incorrect user', 400
        else:
            return True, result, 200

    # Return users info
    def getUsers(self):
        result = userManager.getUsers()
        if result == 'Error':
            return False, 'Error searching users', 400
        else:
            return True, result, 200

    # Return users info by dataset
    def getUsersByDataset(self, dataset, role):
        result = userManager.getUsersByDataset(dataset, role)
        if result == 'Error':
            return False, 'Error searching users by dataset', 400
        else:
            return True, result, 200

    # Return 'ok' if the user has been removed
    def removeUser(self, user):
        result = userManager.removeUser(user)
        if result == 'Error':
            return False, 'Error deleting user', 400
        else:
            return True, result, 200

    # Return 'ok' if the user has been created
    def createUser(self, req):
        name = req['name']
        # Check if users or email exist
        if userManager.getUser(name) != 'Error':
            return False, 'The username already exists', 400
        elif userManager.getEmail(req['email']) != 'Error':
            return False, 'The email already exists', 400
        else:
            # Create random password of length 12
            pwd = u"".join(random.choices(string.ascii_uppercase + string.digits, k=12))
            # pwd = u"test"
            hashedPwd = self.getHashedPassword(pwd)
            datasets = req['assignedTo']
            result = userManager.createUser(name, hashedPwd, datasets, req['role'], req['email'])
            if result == 'Error':
                return False, 'Error creating user', 400
            else:
                result = self.duplicateAnnotations(datasets, name)
                if not result:
                    return False, "Error duplicating annotations", 400
                ## TODO: send password to email
                return True, {'name': name, 'password': pwd}, 200

    # Check if the the user has annotations of his own for the assignated datasets and create a copy of root's otherwise
    def duplicateAnnotations(self, datasets, user):
        for dataset in datasets:
            data = datasetManager.getDataset(dataset)
            if data['type'] == 'poseTrack':     # In the future, probably for posetrack too
                videos = videoManager.getVideos(dataset)
                for video in videos:
                    annotations = annotationManager.getAnnotations(dataset, video['name'], user, None)
                    if not annotations:  # Else already exist
                        annotations = annotationManager.getAnnotations(dataset, video['name'], 'root', None)
                        for annotation in annotations:
                            result = annotationManager.updateAnnotation(dataset, video['name'], annotation['frame'],
                                                                        user, annotation['objects'])
                            if result == 'Error':
                                return False
        return True

    # Return 'ok' if the user has been updated
    def updateUser(self, req):
        result = userManager.updateUser(req['oldName'], req['name'], req['assignedTo'], req['role'], req['email'])
        if result == 'Error':
            return False, 'Error updating user', 400
        else:
            result = self.duplicateAnnotations(req['assignedTo'], req['name'])
            if not result:
                return False, 'Error duplicating annotations', 400
            else:
                return True, result, 200
