
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
    bbox_arr, bbox_head_arr, person_arr = [], [], []
    for nr_obj, obj in enumerate(objects):
        if obj["type"] == "bbox":
            bbox_arr.append(obj)
        elif obj["type"] == "bbox_head":
            bbox_head_arr.append(obj)
        elif obj["type"] == "person":
            person_arr.append(obj)
        else:
            raise TypeError
    return bbox_arr, bbox_head_arr, person_arr

def is_track_id_in_array(track_id, array):
    for obj in array:
        if obj["track_id"] == track_id:
            return True
    return False

try:
    for v in videos:
        # print("Checking video: ", v["name"])
        if v["name"] != "000048":
            vid_annotations = db.annotation.find({"dataset": dataset["name"], "scene": v["name"], "user": "root"}, {'_id': 0})
            for idx, annotation in enumerate(vid_annotations):
                modified = False
                # Divide objects between bbox, bbox_head and person
                bbox_arr, bbox_head_arr, person_arr = divide_objects_in_arrays(annotation["objects"])
                if not(len(bbox_arr) == len(bbox_head_arr) == len(person_arr)):
                    raise TypeError
                # For every triple with a track_id, check that the three objects exist and only one triple exists
                for index, bbox in enumerate(bbox_arr):

except TypeError as e:
    print("Error in the data")