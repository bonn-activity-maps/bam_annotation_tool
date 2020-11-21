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


# Set a character 'new_value' in position 'pos' of 'string'
def change_char(string, pos, new_value):
    slist = list(string)
    slist[pos] = str(new_value)
    return "".join(slist)


# Return info of frame by frame ID if it exists in the DB. Ignore mongo id
def get_frame_by_ID( frame_id):
    try:
        result = db.frame.find_one({"dataset": dataset["name"], "frame_id": frame_id}, {"_id": 0})
        if result is None:
            return False
        else:
            return True
    except errors.PyMongoError as e:
        print('Error finding frame in db')
        return 'Error'


# Return list with info of all frames by video and dataset. Empty list if there are no frames
# Ignore mongo id
def get_frames(video):
    try:
        result = db.frame.find({"dataset": dataset["name"], "video": video["name"]}, {"_id": 0})
        return list(result)
    except errors.PyMongoError as e:
        print("Error retrieving frames for video", video["name"])
        return 'Error'


# Check if the ids generated already exist
def check_existence(new_image_id, new_id):
    exists_image_id = get_frame_by_ID(new_image_id)
    exists_id = get_frame_by_ID(new_id)
    return exists_id or exists_id


video_ignore_list = ["000048", "014054", "017121"]

for v in videos:
    print("Checking video: ", v["name"])
    frames = get_frames(v)
    if frames and v["name"] not in video_ignore_list:
        frame_id = str(frames[0]["frame_id"])
        id = str(frames[0]["id"])
        if frame_id[0] == "2" or id[0] == "2":
            print("Detected incorrect id: ", frame_id)
            for f in frames:
                try:
                    old_frame_id = str(f["frame_id"])
                    old_id = str(f["id"])
                    new_image_id = int(change_char(old_frame_id, 0, "1"))
                    new_id = int(change_char(old_id, 0, "1"))
                    exists = check_existence(new_image_id, new_id)
                    if exists:
                        print("ALERT: id ", new_image_id, "or", new_id, "already exist!!")
                    query = {"dataset": dataset["name"], "video": v["name"], "frame_id": int(old_frame_id),
                             "id": int(old_id)}
                    new_values = {"$set": {"frame_id": new_image_id, "id": new_id}}
                    result = db.frame.update_one(query, new_values, upsert=False)
                except KeyError as e:
                    print(e)
                    print(f)
