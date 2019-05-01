from pymongo import MongoClient

class UserManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.user

    # Check in DB if admin password is correct (hash)
    def loginAdmin(this, pwd):
        result = this.collection.find_one({"admin":pwd})
        if result == None:
            return False, 'Incorrect password', 400
        else:
            return True, 'ok', 200

    # Check in DB if user is correct
    def loginUser(this, user):
        result = this.collection.find_one({"user": user})
        if result == None:
            return False, 'Incorrect user', 400
        else:
            return True, 'ok', 200
