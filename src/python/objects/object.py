
class Object:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def __init__(self, uid, type, keypoints=None, dataset_type=None, labels=None, category_id=1, track_id=None, original_id=None):
        """
        :param uid: int
        :param type: str
        :param keypoints: [MxN] int
        :param dataset_type: str  {actionInKitchen, poseTrack}
        :param labels: [1xN] str
        :param category_id: int
        :param track_id: int
        :param original_id: int
        """
        self.uid = int(uid)
        self.type = type
        self.keypoints = keypoints
        self.labels = labels
        self.dataset_type = dataset_type

        if dataset_type == self.pt:
            self.category_id = int(category_id)
            self.track_id = int(track_id) if track_id is not None else abs(uid) % 100
            self.original_id = int(original_id) if original_id is not None else None

    def to_json(self):
        obj = {
            'uid': self.uid,
            'type': self.type,
            'keypoints': self.keypoints,
        }

        # Add optional parameters if they exist
        if self.labels is not None: obj['labels'] = self.labels
        if self.dataset_type == self.pt:
            if self.category_id is not None: obj['category_id'] = self.category_id
            if self.track_id is not None: obj['track_id'] = self.track_id
            if self.original_id is not None: obj['original_id'] = self.original_id

        return obj

    def from_json(obj, dataset_type):
        uid = obj['uid']
        keypoints = obj['keypoints']
        type = obj['type']
        dataset_type = dataset_type
        labels = obj['labels'] if 'labels' in obj else None

        if dataset_type == 'poseTrack':
            category_id = obj['category_id']
            track_id = obj['track_id']
            original_id = obj['original_id'] if 'original_id' in obj else None
        else:
            category_id = None
            track_id = None
            original_id =  None

        return Object(uid, type, keypoints, dataset_type, labels, category_id, track_id, original_id)

    def to_string(self):
        return "(uid: {0}, type: {1}, keypoints: {2}, labels: {3}, category_id: {4}, track_id: {5}, original_id: {6})".\
            format(self.uid, self.type, self.keypoints, self.labels, self.category_id, self.track_id, self.original_id)

