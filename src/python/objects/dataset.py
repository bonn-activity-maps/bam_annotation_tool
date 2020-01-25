import os

class Dataset:

    STORAGE_DIR = '/usr/storage/'  # Path to store the datasets
    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def __init__(self, name, type=None, keypoint_dim=0, file_name=None):
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
        if keypoint_dim == 0 and type == self.aik:
            self.keypoint_dim = 3
        elif keypoint_dim == 0 and type == self.pt:
            self.keypoint_dim = 2
        else:
            self.keypoint_dim = keypoint_dim
        self.file_name = file_name

    def __repr__(self):
        return self.to_string()

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
        keypoint_dim = obj['keypointDim'] if 'keypointDim' in obj else 0
        return Dataset(name, type=type, keypoint_dim=keypoint_dim)

    def to_string(self):
        return "(name: {0}, type: {1}, keypoint_dim: {2})".format(self.name, self.type, self.keypoint_dim)

    def is_pt(self):
        return self.pt == self.type

    def is_aik(self):
        return self.aik == self.type