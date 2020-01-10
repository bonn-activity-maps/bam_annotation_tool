from pymongo import MongoClient, errors
import logging

from python.objects.user import User

# UserService logger
log = logging.getLogger('userManager')


class UserManager:
    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.user

    # Return info user if exist user-pwd in DB. Ignore mongo id
    def get_user_pwd(self, user):
        try:
            result = self.collection.find_one({"name": user}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return User.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding login user in db')
            return 'Error'

    # Return info user if exist in DB. Ignore mongo id and pwd
    def get_user(self, user):
        try:
            result = self.collection.find_one({"name": user}, {"_id": 0, "password": 0})
            if result is None:
                return 'Error'
            else:
                return User.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding user in db')
            return 'Error'

    # Return list with info of all users. Empty list if there are no users
    # Ignore mongo id and pwd
    def get_users(self):
        try:
            result = self.collection.find({}, {"_id": 0, "password": 0})
            return [User.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding users in db')
            return 'Error'

    # Return list with info of all users for dataset. Empty list if there are no users
    # Ignore mongo id and pwd
    def get_users_by_dataset(self, dataset, role):
        try:
            result = self.collection.find({"assignedTo": dataset, "role": role}, {"_id": 0, "password": 0})
            return [User.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding users in db')
            return 'Error'

    # Return info user if exist in DB. Ignore mongo id and pwd
    def get_user_by_email(self, email):
        try:
            result = self.collection.find_one({"email": email}, {"_id": 0, "password": 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding email in db')
            return 'Error'

    # Return 'ok' if the user has been created
    def create_user(self, user):
        try:
            result = self.collection.insert_one(user.to_json())
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating user in db')
            return 'Error'

    # Return 'ok' if the user has been updated. if user doesn't exist, it isn't created
    def update_user(self, user):
        query = {"name": user.name}  # Search by user name
        # Update values (name, assignedTo, role, email)
        new_values = {"$set": {"assignedTo": user.assigned_to, "role": user.role, "email": user.email}}
        try:
            result = self.collection.update_one(query, new_values, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating user in db')
            return 'Error'

    # Return 'ok' if the password has been updated. if user doesn't exist, it isn't created
    def update_user_password(self, user, pwd):
        query = {"name": user}  # Search by user name
        # Update password
        new_values = {"$set": {"password": pwd}}
        try:
            result = self.collection.update_one(query, new_values, upsert=False)
            if result.modified_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating password of user in db')
            return 'Error'

    # Return 'ok' if the user has been removed
    def remove_user(self, user):
        try:
            result = self.collection.delete_one({"name": user})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing user in db')
            return 'Error'
