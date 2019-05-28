from pymongo import MongoClient

class ObjectManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.object

    # Get annotation object by type
    def getObject(this, type):
        # Not return mongo id
        result = this.collection.find_one({"type":type}, {'_id': 0})
        if result == None:
            return 'Error'
        else:
            return result

    # Create new object for annotations with type, nKeypoints and labels for each kp
    def createObject(this, type, nkp, labels):
        try:
            this.collection.insert_one({"type":type, "nkp":nkp, "labels": labels})
            return 'ok', ''
        except pymongo.errors.PyMongoError as e:
            return 'Error creating object', e
