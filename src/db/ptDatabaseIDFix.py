from pymongo import MongoClient, errors
import logging

# AnnotationManager logger
log = logging.getLogger('annotationManager')

c = MongoClient('127.0.0.1', 27017)
db = c.cvg  # The one in production

aik = 'actionInKitchen'
pt = 'poseTrack'


# Find an item with a key that has a value "value"
def find(list, key, value, key2, value2):
    for item in list:
        if item[key] == value and item[key2] == value2:
            return item
    return 0


# Get all annotations with object IDs that don't start with 1
wrong_annotations = db.annotation.find({"dataset": "posetrack_data", "objects.uid": {"$gt": 1999999999999}})

for annotation in wrong_annotations:
    annotation_fixed = annotation
    objects_new = []
    # For every object, check uid and modify if necessary
    for object in annotation_fixed["objects"]:
        old_uid = object["uid"]
        new_uid = old_uid
        while int(str(new_uid)[:1]) != 1:
            new_uid -= 1000000000000
        object["uid"] = new_uid
        object["old_uid"] = old_uid
        # Find if it is a duplicate
        index = find(objects_new, "uid", new_uid, "type", object["type"])
        if index == 0:
            # If it's not in the list, append
            objects_new.append(object)
        else:
            # If it's on the list, keep the newest one
            # Newest will be the one whose old_id starts by 1 already
            if old_uid % 100000000000 == 1:
                objects_new.append(object)
                del (objects_new[index])  # Delete old one
            # Else leave it be, don't append the old one, keep the new one
    annotation_fixed["objects"] = objects_new
    db.annotation.replace_one({"dataset": "posetrack_data", "scene": annotation["scene"], "user": "root",
                               "frame": annotation["frame"]}, annotation_fixed, upsert=False)
    print("fixing ", annotation["scene"])
