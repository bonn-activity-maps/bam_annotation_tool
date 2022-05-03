from pymongo import MongoClient, errors

c = MongoClient('172.18.0.2', 27017)
# c = MongoClient('127.0.0.1', 27017)
db = c.cvg

datasetName = "posetrack_data"

aik = 'actionInKitchen'
pt = 'poseTrack'

# Get all videos of dataset
dataset = {
    "name": "posetrack_data",
    "type": pt}
videos = list(db.video.find({"dataset": dataset["name"]}, {"_id": 0}).sort("name"))


def divide_objects_in_arrays(objects):
    bbxx, bbxxhh, prsn = [], [], []
    for nr_obj, obj in enumerate(objects):
        if obj["type"] == "bbox":
            bbxx.append(obj)
        elif obj["type"] == "bbox_head":
            bbxxhh.append(obj)
        elif obj["type"] == "person":
            prsn.append(obj)
        elif obj["type"] == "ignore_region":
            pass
        else:
            raise TypeError
    return bbxx, bbxxhh, prsn


def is_track_id_in_array(trckid, array):
    times = 0
    for obj in array:
        if obj["track_id"] == trckid:
            if obj["keypoints"]:
                times += 1
    return times


video_ignore_list = ["000048", "014054", "017121"]
# try:
for v in videos:
    # print("Checking video: ", v["name"])
    if v["name"] not in video_ignore_list:
        vid_annotations = db.annotation.find({"dataset": dataset["name"], "scene": v["name"], "user": "root"}, {'_id': 0})
        ok = True
        for idx, annotation in enumerate(vid_annotations):
            # Divide objects between bbox, bbox_head and person
            bbox_arr, bbox_head_arr, person_arr = divide_objects_in_arrays(annotation["objects"])
            # print("len of arrays: ", len(bbox_arr), len(bbox_head_arr), len(person_arr))
            if not(len(bbox_arr) == len(bbox_head_arr) == len(person_arr)):
                ok = False
                # raise TypeError
            # For every triple with a track_id, check that the three objects exist and only one triple exists
            for index, bbox in enumerate(bbox_arr):
                track_id = bbox["track_id"]
                times_bbox = is_track_id_in_array(track_id, bbox_arr)
                times_bbox_head = is_track_id_in_array(track_id, bbox_head_arr)
                times_person = is_track_id_in_array(track_id, person_arr)
                # print("times each:", times_bbox, times_bbox_head, times_person)
                if times_bbox != times_bbox_head != times_person > 1:
                    print("Duplicated or unequal number of track_ids in ")
                    print("Video", v["name"], "track_id", bbox["track_id"],
                          "frame:", bbox["uid"]//100 % 10000)
                    ok = False
                if len(bbox["keypoints"]) == 0 and len(person_arr[index]["keypoints"]) != 0:
                    print(bbox["keypoints"])
                    print(person_arr[index]["keypoints"])
                    print("Person annotated with no bbox in")
                    print("Video", v["name"], "track_id", bbox["track_id"],
                          "frame:", bbox["uid"]//100 % 10000)
                    ok = False
                    # raise TypeError
        print("Video ", v["name"], " OK?:", ok)
# except TypeError as e:
#     print("Error in the data", e)
