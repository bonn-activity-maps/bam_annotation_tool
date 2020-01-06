from python.objects.dataset import Dataset

class Action:

    def __init__(self, name, dataset, object_uid=None, user=None, start_frame=None, end_frame=None):
        """
        :param name: str
        :param dataset: Dataset
        :param object_uid: int
        :param user: str
        :param start_frame: int
        :param end_frame: int
        """
        self.name = name
        self.dataset = dataset
        self.object_uid = int(object_uid) if object_uid is not None else None
        self.user = user
        self.start_frame = int(start_frame) if start_frame is not None else None
        self.end_frame = int(end_frame) if end_frame is not None else None


    def to_json(self):
        obj = {
            'name': self.name,
            'dataset': self.dataset.name,
        }
        # Add optional parameters if they exist
        if self.object_uid is not None: obj['objectUID'] = self.object_uid
        if self.user is not None: obj['user'] = self.user
        if self.start_frame is not None: obj['startFrame'] = self.start_frame
        if self.end_frame is not None: obj['endFrame'] = self.end_frame

        return obj

    def from_json(obj):
        name = obj['name']
        dataset = Dataset(obj['dataset'], obj['datasetType']) if 'datasetType' in obj else Dataset(obj['dataset'])
        object_uid = obj['objectUID'] if 'objectUID' in obj else None
        user = obj['user'] if 'user' in obj else None
        start_frame = obj['startFrame'] if 'startFrame' in obj else None
        end_frame = obj['endFrame'] if 'endFrame' in obj else None
        return Action(name, dataset, object_uid, user, start_frame, end_frame)

    def to_string(self):
        return "(name: {0}, dataset: {1}, object_uid: {2}, user: {3}, start_frame: {4}, end_frame: {5})".\
            format(self.name, self.dataset.to_json(), self.object_uid, self.user, self.start_frame, self.end_frame)

