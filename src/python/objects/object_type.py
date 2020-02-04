
class Object_type:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def __init__(self, type, dataset_type, labels=None, num_keypoints=None, supercategory=None, id=None, skeleton=None, is_polygon=None):
        """
        :param type: str
        :param dataset_type: str  {actionInKitchen, poseTrack}
        :param labels: [1xN] str
        :param num_keypoints: int len(labels)
        :param supercategory: str
        :param id: int
        :param skeleton: [2xN] str
        :param is_polygon: bool
        """
        self.type = type
        self.dataset_type = dataset_type
        self.labels = labels
        if num_keypoints is not None:
            self.num_keypoints = int(num_keypoints)
        elif labels is not None:
            self.num_keypoints = len(labels)
        else:
            self.num_keypoints = 0

        if dataset_type == self.pt:
            self.supercategory = supercategory
            self.id = int(id) if id is not None else None
            self.skeleton = skeleton
            self.is_polygon = is_polygon

    def __repr__(self):
        return self.to_string()

    def to_json(self):
        obj = {
            'type': self.type,
            'datasetType': self.dataset_type,
            'labels': self.labels,
            'numKeypoints': self.num_keypoints,
        }
        # Add optional parameters if they exist for pt
        if self.dataset_type == self.pt:
            if self.supercategory is not None: obj['supercategory'] = self.supercategory
            if self.id is not None: obj['id'] = self.id
            if self.skeleton is not None: obj['skeleton'] = self.skeleton
            if self.is_polygon is not None: obj['is_polygon'] = self.is_polygon
        return obj

    def from_json(obj):
        type = obj['type']
        dataset_type = obj['datasetType']
        labels = obj['labels']
        num_keypoints = obj['numKeypoints'] if 'numKeypoints' in obj else None
        supercategory = obj['supercategory'] if 'supercategory' in obj else None
        id = obj['id'] if 'id' in obj else None
        skeleton = obj['skeleton'] if 'skeleton' in obj else None
        is_polygon = obj['is_polygon'] if 'is_polygon' in obj else None
        return Object_type(type, dataset_type, labels=labels, num_keypoints=num_keypoints, supercategory=supercategory,
                           id=id, skeleton=skeleton, is_polygon=is_polygon)

    def to_string(self):
        return "(type: {0}, dataset_type: {1}, labels: {2}, num_keypoints: {3}, supercategory: {4}, id: {5}, skeleton: {6}, is_polygon: {7})".\
            format(self.type, self.dataset_type, self.labels, self.num_keypoints, self.supercategory, self.id, self.skeleton, self.is_polygon)

