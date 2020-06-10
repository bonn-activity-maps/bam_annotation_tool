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


# Print info about incorrect poses
def check_poses():
    obj_type = 'poseAIK'             # Type of objects

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
                            print('pose: ', o['keypoints'])
                            print("________________________________________________")
                            error = True
                            break


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

    check_poses()

