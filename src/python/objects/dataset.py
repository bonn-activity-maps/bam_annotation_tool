import os

class Dataset:

    STORAGE_DIR = '/usr/storage/'  # Path to store the datasets

    def __init__(self, name, type=None, file_name=None):
        """
        :param name: str
        :param type: str        {actionInKitchen, poseTrack}
        :param keypoint_dim: int   {3, 2}
        :param dir: str         (dataset directory without extension)
        :param file_name: str   (name with zip extension)
        """
        self.name = name
        self.type = type
        self.dir = os.path.join(self.STORAGE_DIR, name)
        if type == 'actionInKitchen':
            self.keypoint_dim = 3
        elif type == 'poseTrack':
            self.keypoint_dim = 2
        else:
            self.keypoint_dim = 0
        self.file_name = file_name

    def to_json(self):
        obj = {
            'name': self.name,
            'type': self.type,
            'keypointDim': self.keypoint_dim
        }
        return obj

    def from_json(obj):
        name = obj['name']
        type = obj['type'] if 'type' in obj else None
        return Dataset(name, type)

    def to_string(self):
        return "(name: {0}, type: {1}, keypoint_dim: {2})".format(self.name, self.type, self.keypoint_dim)

