from pymongo import MongoClient

class UserManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.user

    # Return info user if exist in DB. Ignore mongo id and pwd
    def getUser(this, user, pwd):
        result = this.collection.find_one({"name": user, "password": pwd}, {"_id": 0, "password": 0 })
        if result == None:
            return 'Error'
        else:
            return result
