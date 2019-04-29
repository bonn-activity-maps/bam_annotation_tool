import logging

from python.infrastructure.userManager import UserManager

# UserService logger
log = logging.getLogger('userService')

userManager = UserManager()

class UserService:

    # Check admin password
    def loginAdmin(this, pwd):
        return userManager.loginAdmin(pwd)

    # Check if user is correct
    def loginUser(this, user):
        return userManager.loginUser(user)
