import logging
import string, random

from python.infrastructure.userManager import UserManager

# UserService logger
log = logging.getLogger('userService')

userManager = UserManager()

class UserService:

    # Check if user exist and return user info
    def userLogin(this, user, pwd):
        result = userManager.getUserPwd(user, pwd)
        if result == 'Error':
            return False, 'Wrong credentials', 400
        else:
            return True, result, 200

    # Return user info
    def getUser(this, user):
        result = userManager.getUser(user)
        if result == 'Error':
            return False, 'Incorrect user', 400
        else:
            return True, result, 200

    # Return users info
    def getUsers(this):
        result = userManager.getUsers()
        if result == 'Error':
            return False, 'Error searching users', 400
        else:
            return True, result, 200

    # Return users info by dataset
    def getUsersByDataset(this, dataset, role):
        result = userManager.getUsersByDataset(dataset, role)
        if result == 'Error':
            return False, 'Error searching users by dataset', 400
        else:
            return True, result, 200

    # Return 'ok' if the user has been removed
    def removeUser(this, user):
        result = userManager.removeUser(user)
        if result == 'Error':
            return False, 'Error deleting user', 400
        else:
            return True, result, 200

    # Return 'ok' if the user has been created
    def createUser(this, req):
        name = req['name']
        # Check if users or email exist
        if userManager.getUser(name) != 'Error':
            return False, 'The username already exists', 400
        elif userManager.getEmail(req['email']) != 'Error':
            return False, 'The email already exists', 400
        else:
            # Create random password of lenght 12
            pwd = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

            result = userManager.createUser(name, pwd, req['assignedTo'], req['role'], req['email'])
            if result == 'Error':
                return False, 'Error creating user', 400
            else:
                ## TODO: send password to email
                return True, {'name':name, 'password':pwd}, 200

    # Return 'ok' if the user has been updated
    def updateUser(this, req):
        result = userManager.updateUser(req['oldName'], req['name'], req['assignedTo'], req['role'], req['email'])
        if result == 'Error':
            return False, 'Error updating user', 400
        else:
            return True, result, 200
