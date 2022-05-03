from pymongo import MongoClient, errors

c = MongoClient('172.18.0.2', 27017)
db = c.cvg

aik = 'actionInKitchen'
pt = 'poseTrack'

'''
    Example of how UIDs are computed:
            1 000002 0000 01
    Decomposition:
        1:          prefix number (don't change)
        000002:     scene number
        0000:       frame number
        01:         track id
'''


def find(lst, key, value):
    for item in lst:
        if item[key] == value:
            return item
    return 0


def pad(string, number):
    while len(string) < number:
        string = "0" + string
    return string


# Get all videos of dataset
dataset = {
    # "name": "posetrack_data",
    "name": "posetrack_intro_4",
    "type": pt}

videos = list(db.video.find({"dataset": dataset["name"]}, {"_id": 0}).sort("name"))
for video in videos:
    print("Recomputing UID for ", video["name"])
    vid_annotations = list(db.annotation.find({"dataset": dataset["name"], "scene": video["name"],
                                               "user": "root"}, {'_id': 0}))
    for annotation in vid_annotations:
        for obj in annotation["objects"]:
            # Compute new UID
            obj["uid"] = int("1" + video["name"] + pad(str(annotation["frame"]), 4) + pad(str(obj["track_id"]), 2))
        db.annotation.replace_one({
            "dataset": dataset["name"],
            "scene": video["name"],
            "user": "root",
            "frame": annotation["frame"]
        }, annotation)
