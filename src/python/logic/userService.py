import logging

from python.infrastructure.userManager import UserManager

# UserService logger
log = logging.getLogger('userService')

userManager = UserManager()

class UserService:

    # Check if user exist and return user info
    def userLogin(this, user, pwd):
        result = userManager.getUser(user, pwd)
        if result == 'Error':
            return False, 'Incorrect user', 400
        else:
            return True, result, 200
