from pymongo import MongoClient, errors
import logging

# UserService logger
log = logging.getLogger('userManager')


class UserManager:
    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.user

    # Return info user if exist user-pwd in DB. Ignore mongo id and pwd
    def getUserPwd(self, user):
        try:
            result = self.collection.find_one({"name": user}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding login user in db')
            return 'Error'

    # Return info user if exist in DB. Ignore mongo id and pwd
    def getUser(self, user):
        try:
            result = self.collection.find_one({"name": user}, {"_id": 0, "password": 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding user in db')
            return 'Error'

    # Return list with info of all users. Empty list if there are no users
    # Ignore mongo id and pwd
    def getUsers(self):
        try:
            result = self.collection.find({}, {"_id": 0, "password": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding users in db')
            return 'Error'

    # Return list with info of all users for dataset. Empty list if there are no users
    # Ignore mongo id and pwd
    def getUsersByDataset(self, dataset, role):
        try:
            result = self.collection.find({"assignedTo": dataset, "role": role}, {"_id": 0, "password": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding users in db')
            return 'Error'

    # Return info user if exist in DB. Ignore mongo id and pwd
    def getEmail(self, email):
        try:
            result = self.collection.find_one({"email": email}, {"_id": 0, "password": 0})
            print(result)
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding email in db')
            return 'Error'

    # Return 'ok' if the user has been created
    def createUser(self, user, pwd, assignedTo, role, email):
        try:
            result = self.collection.insert_one({"name": user, "password": pwd,
                                                 "assignedTo": assignedTo, "role": role, "email": email})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating user in db')
            return 'Error'

    # Return 'ok' if the user has been updated. if user doesn't exist, it isn't created
    def updateUser(self, oldName, user, assignedTo, role, email):
        query = {"name": oldName}  # Search by user name
        # Update values (name, assignedTo, role, email)
        newValues = {"$set": {"name": user, "assignedTo": assignedTo, "role": role, "email": email}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating user in db')
            return 'Error'

    # Return 'ok' if the password has been updated. if user doesn't exist, it isn't created
    def updateUserPassword(self, user, pwd):
        query = {"name": user}  # Search by user name
        # Update password
        newValues = {"$set": {"password": pwd}}
        try:
            result = self.collection.update_one(query, newValues, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating password of user in db')
            return 'Error'

    # Return 'ok' if the user has been removed
    def removeUser(self, user):
        try:
            result = self.collection.delete_one({"name": user})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing user in db')
            return 'Error'
