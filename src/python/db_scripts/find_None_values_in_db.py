from pymongo import MongoClient, errors
from math import isclose
import os, json
import numpy as np

# c = MongoClient('172.18.0.2', 27017)
c = MongoClient('127.0.0.1', 27017)
db = c.cvg

datasetName = "posetrack_data"

aik = 'actionInKitchen'
pt = 'poseTrack'

# Get all videos of dataset
dataset = {
    "name": "posetrack_data",
    "type": pt}
videos = list(db.video.find({"dataset": dataset["name"]}, {"_id": 0}).sort("name"))
video_ignore_list = ["000048", "014054", "017121"]

categories = [
    "nose",
    "head_bottom",
    "head_top",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle"
]
'''
    Structure of affected list must be:
    affected_list: [{
            name: XXXXXX
            frames: [{
                number: XX,
                track_id: XX,
                joints: ["XX", ..."XX"]
                }]
            }]
'''
affected_list = []

for v in videos:
    video_affected = {}
    frames_affected = []
    # print("Checking video: ", v["name"])
    if v["name"] not in video_ignore_list:
        vid_annotations = list(db.annotation.find({"dataset": dataset["name"], "scene": v["name"], "user": "root"}, {'_id': 0}))
        for idx, annotation in enumerate(vid_annotations):
            modified = False
            for nr_obj, obj in enumerate(annotation["objects"]):
                if obj["keypoints"]:
                    if len(obj["keypoints"]) != 17:
                        annotation["objects"][nr_obj]["keypoints"].insert(3, [-1., -1., 0.])
                        annotation["objects"][nr_obj]["keypoints"].insert(4, [-1., -1., 0.])
                        modified = True
                    joints = []
                    frame_aff = False
                    for nr_kp, kp in enumerate(obj["keypoints"]):
                        if None in kp:
                            frame_aff = True
                            joints.append(categories[nr_kp])
                            print("Found incorrect value in Video", v["name"], "track_id", obj["track_id"],
                                  "frame:", obj["uid"]//100 % 10000, "kp nr", nr_kp, "nr obj: ",
                                  nr_obj, "/", len(annotation["objects"]))
                            print(kp)
                    frames_affected.append({
                        "number": obj["uid"]//100 % 10000,
                        "track_id": obj["track_id"],
                        "joints": joints
                    }) if frame_aff else None
            if modified:
                video_affected = {
                    "name": v["name"],
                    "frames": frames_affected
                }
                query = {"dataset": dataset["name"], "scene": v["name"], "frame": annotation["frame"]}
                new_values = {"$set": {"objects": annotation["objects"]}}
                # result = db.annotation.update_one(query, new_values, upsert=False)
                # print("Result?", bool(result.modified_count))
                # exit()
    if video_affected != {}:
        affected_list.append(video_affected)

# path = "/usr/storage"
#
# file = os.path.join(path, dataset["name"] + '_modified.json')
# if not os.path.exists(path):
#     os.makedirs(path)
# with open(file, 'w') as outfile:
#     json.dump(affected_list, outfile)

