from python.objects.dataset import Dataset
from datetime import datetime


class UserAction:

    def __init__(self, user, action, scene, dataset, timestamp=None):
        """
        :param user: str
        :param action: str
        :param scene: int
        :param dataset: Dataset
        :param timestamp: datetime
        """
        self.user = user
        self.action = action
        self.scene = scene
        self.dataset = dataset
        if timestamp is None:
            self.timestamp = datetime.now()
        elif isinstance(timestamp, str):
            self.timestamp = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S.%f')
        else:
            self.timestamp = timestamp

    def __repr__(self):
        return self.to_string()

    def to_json(self):
        obj = {
            'user': self.user,
            'action': self.action,
            'scene': self.scene,
            'dataset': self.dataset.name,
            'timestamp': self.timestamp,
        }
        return obj

    def from_json(obj):
        user = obj['user']
        action = obj['action']
        scene = obj['scene']
        dataset = Dataset(obj['dataset'], obj['datasetType']) if 'datasetType' in obj else Dataset(obj['dataset'])
        timestamp = obj['timestamp']
        return UserAction(user, action, scene, dataset, timestamp)

    def to_string(self):
        return "(user: {0}, action: {1}, scene: {2}, dataset: {3}, timestamp: {4})".\
            format(self.user, self.action, self.scene, self.dataset.to_json(), self.timestamp)

