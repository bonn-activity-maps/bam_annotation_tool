import os, json, shutil


def read_data():
    # folder_path = os.path.join(dataset.STORAGE_DIR, folder)
    # annotations_file = os.path.join(folder_path, 'persons2poses.json')

    obj_type = 'poseAIK'             # Type of objects
    final_result = True
    # Read data from file
    try:
        with open('persons2poses.json') as json_file:
            poses = json.load(json_file)
    except OSError:
        log.exception('Could not read from file')
        return False

    # Transform annotation to our format and store in db
    for i, p in enumerate(poses):
        if p['frame'] == 10200:
            print('uid: ',p['pid'])
            print('pose: ',p['pose'])
            print("________________________________________________")
            kps = p['pose']
            # Replace empty keypoints with empty list
            # keypoints = [[] if kp is None else kp for kp in kps]
            # object = [Object(p['pid'], obj_type, keypoints, dataset.type)]
            # annotation = Annotation(dataset, dataset.name, p['frame'], 'root', object)


read_data()
