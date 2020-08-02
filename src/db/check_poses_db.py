from pymongo import MongoClient, errors
import json, sys, getopt

ip = ''
port = ''
dataset = ''
frame_from = ''
frame_to = ''

# Get all annotations for given dataset and scene
def get_annotations():
    try:
        result = collection.find({"dataset": dataset, "frame": {"$gte": frame_from, "$lte": frame_to}}, {'_id': 0}).sort("frame", 1)
        return list(result)
    except errors.PyMongoError as e:
        print('Error finding annotation in db')
        sys.exit()


# Remove incorrect pose --> Update with empty pose
def update_annotation(uid, obj_type, frame, keypoints):
    query = {"dataset": dataset, "scene": dataset, "objects.uid": uid, "objects.type": obj_type, "frame": frame}
    array_filter = [{"elem.uid": {"$eq": uid}, "elem.type": {"$eq": obj_type}}]     # Filter by object uid and type

    new_values = {"$set": {"objects.$[elem].keypoints": keypoints}}

    try:
        result = collection.update_one(query, new_values, upsert=False, array_filters=array_filter)

        # ok if no error (it doesn't matter if the keypoints have not been modified)
        if result.acknowledged == 1:
            return 'ok'
        else:
            print('ERROR updating object in annotation in db')
            return 'Error'
    except errors.PyMongoError as e:
        print('ERROR updating object in annotation in db')
        sys.exit()

# Print info about incorrect poses
def check_poses():
    obj_type = 'poseAIK'             # Type of objects
    error_frames = []

    # Read annotations from dataset from db
    annotations = get_annotations()

    # Search for wrong poses
    for a in annotations:
        for o in a['objects']:
            if o['type'] == obj_type:
                error = False
                for label in o['keypoints']:
                    if error:
                        break
                    for kp in label:
                        if not isinstance(kp, float):
                            print('frame: ', a['frame'], ' - uid: ', o['uid'])
                            # print('pose: ', o['keypoints'])
                            # print("________________________________________________")
                            error = True
                            # result = update_annotation(o['uid'], obj_type, a['frame'], [])
                            # # Append frame to list of errors if there were an error when updating pose
                            # if result == 'Error':
                            #     error_frames.append(a['frame'])
                            break

    print('Error in frames: ', error_frames)


def help_info():
    print('check_poses_db.py --ip <db_ip> --port <db_port> --dataset <dataset> --frame_from <frame_from> --frame_to <frame_to>')


if __name__ == "__main__":
    argv = sys.argv[1:]
    try:
        opts, args = getopt.getopt(argv,"hi:o:",["ip=","port=","dataset=", "frame_from=", "frame_to="])
    except getopt.GetoptError:
        help_info()
        sys.exit()

    for opt, arg in opts:
        if opt == '-h':
            help_info()
            sys.exit()
        elif opt in ("--ip"):
            ip = arg
        elif opt in ("--port"):
            port = int(arg)
        elif opt in ("--dataset"):
            dataset = arg
        elif opt in ("--frame_from"):
            frame_from = int(arg)
        elif opt in ("--frame_to"):
            frame_to = int(arg)

    if not ip or not port or not dataset or not frame_from or not frame_to:
        help_info()
        sys.exit()

    c = MongoClient(ip, port)
    db = c.cvg
    collection = db.annotation

    print('ip: ', ip)
    print('port: ', port)
    print('dataset: ', dataset)
    print('frame_from: ', frame_from)
    print('frame_to: ', frame_to)
    print("________________________________________________")

    check_poses()

