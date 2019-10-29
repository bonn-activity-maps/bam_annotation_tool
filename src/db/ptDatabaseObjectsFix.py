from pymongo import MongoClient, errors
import logging
from bson.son import SON

# AnnotationManager logger
log = logging.getLogger('annotationManager')

c = MongoClient('172.18.0.2', 27017)
db_new = c.cvg  # The one in production
db_old = c.cvg_old  # The one with the correct root objects

aik = 'actionInKitchen'
pt = 'poseTrack'


# self.collection.find_one({"dataset": dataset, "scene": scene, "user": "root", "frame": int(frame)},
#                          {'_id': 0})


# Find an item with a key that has a value "value"
def find(list, key, value):
    for item in list:
        if item[key] == value:
            return item
    return 0


# Get all videos of dataset
videos = db_new.video.find({"dataset": "posetrack_data"})
for video in videos:
    print(video["name"])
    annotations_old = list(db_old.annotation.find({"dataset": "posetrack_data", "scene": video["name"], "user": "root"},
                                                  {"_id": 0}).sort("frame", 1))
    annotations_new = list(db_new.annotation.find({"dataset": "posetrack_data", "scene": video["name"], "user": "root"},
                                                  {"_id": 0}).sort("frame", 1))
    # If there are no annotations, nothing to do
    if annotations_new != [] and annotations_old != []:
        lowest_frame = min(annotations_new[0]["frame"], annotations_old[0]["frame"])
        for i in range(lowest_frame, video["frames"] + lowest_frame):
            annotation_new = find(annotations_new, "frame", i)
            annotation_old = find(annotations_old, "frame", i)
            # Create new annotation to fill with the correct data
            annotation_fixed = {
                "dataset": "posetrack_data",
                "frame": i,
                "scene": video["name"],
                "user": "root"
            }
            objects_fixed = []
            # If there is an annotation in the current version, fix it
            if annotation_new != 0:
                # Clean duplicates from the new database's objects
                objects_new = annotation_new["objects"]
                # https://stackoverflow.com/a/9428041
                objects_fixed = [i for n, i in enumerate(objects_new) if i not in objects_new[n + 1:]]

            # If there is an old annotation from which to get the data
            if annotation_old != 0:
                # Grab the old bbox_head and person annotations
                objects_old = annotation_old["objects"]
                for obj in objects_old:
                    # If it was annotated, prioritize newer annotations
                    if annotations_new != 0:
                        if obj["type"] != "bbox":
                            objects_fixed.append(obj)
                    # If it was not annotated, preserve default annotations
                    else:
                        objects_fixed.append(obj)
                # Add the fixed objects to the annotation
            annotation_fixed["objects"] = objects_fixed

            if annotation_old != 0 or annotation_new != 0:
                db_new.annotation.replace_one({"dataset": "posetrack_data", "scene": video["name"], "user": "root",
                                               "frame": annotation_new["frame"]}, annotation_fixed, upsert=False)

            # if annotation_new != 0 and (i == 50 and annotation_new["scene"] == "000036"):
            #     print(annotation_fixed)
            #     exit()
