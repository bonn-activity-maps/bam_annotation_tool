from pymongo import MongoClient, errors

c = MongoClient('172.18.0.2', 27017)
db = c.cvg

datasetName = "posetrack_data"

aik = 'actionInKitchen'
pt = 'poseTrack'

# Get all videos of dataset
dataset = {
    "name": "posetrack_data",
    "type": pt}
videos = list(db.video.find({"dataset": dataset["name"]}, {"_id": 0}).sort("name"))

for v in videos:
    # print("Checking video: ", v["name"])
    if v["name"] != "000048":
        vid_annotations = db.annotation.find({"dataset": dataset["name"], "scene": v["name"], "user": "root"}, {'_id': 0})
        for idx, annotation in enumerate(vid_annotations):
            modified = False
            for nr_obj, obj in enumerate(annotation["objects"]):
                if obj["type"] == "person":
                    if obj["keypoints"]:
                        for nr_kp, kp in enumerate(obj["keypoints"]):
                            if not (len(kp) == 3 and kp[2] in [0, 1] and None not in kp):
                                print("Found incorrect value in Video", v["name"], "track_id", obj["track_id"],
                                      "frame:", obj["uid"]//100 % 10000, "kp nr", nr_kp, "nr obj: ",
                                      nr_obj, "/", len(annotation["objects"]))
                                print(kp)
                                if not kp or len(kp) < 3:
                                    modified = True
                                    annotation["objects"][nr_obj]["keypoints"][nr_kp] = [-1., -1., 0.]
                                    print(annotation["objects"][nr_obj]["keypoints"][nr_kp], "<-- Corrected kp")
                                elif kp[2] is None:
                                    modified = True
                                    annotation["objects"][nr_obj]["keypoints"][nr_kp][2] = 0.
                                    if kp[1] is None:
                                        annotation["objects"][nr_obj]["keypoints"][nr_kp] = [-1., -1., 0.]
                                    print(annotation["objects"][nr_obj]["keypoints"][nr_kp], "<-- Corrected kp")
                                elif kp[2] < 0:
                                    modified = True
                                    annotation["objects"][nr_obj]["keypoints"][nr_kp][2] = 0.
                                    print(annotation["objects"][nr_obj]["keypoints"][nr_kp], "<-- Corrected kp")
                                elif kp[2] > 0:
                                    modified = True
                                    annotation["objects"][nr_obj]["keypoints"][nr_kp][2] = 1.
                                    print(annotation["objects"][nr_obj]["keypoints"][nr_kp], "<-- Corrected kp")
            if modified:
                query = {"dataset": dataset["name"], "scene": v["name"], "frame": annotation["frame"]}
                new_values = {"$set": {"objects": annotation["objects"]}}
                result = db.annotation.update_one(query, new_values, upsert=False)
                print("Result?", bool(result.modified_count))
                # exit()
