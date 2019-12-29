
class Video:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def __init__(self, name, dataset, path=None, frames=0, type=None, dataset_type=None):

        """
        :param name: int for aik -- str for pt
        :param dataset: str
        :param dataset_type: str   {actionInKitchen, poseTrack}
        :param path: str
        :param frames: int
        :param type: str    {train, test, val, aik}
        """
        if dataset_type == self.aik:
            self.name = int(name)
        else:
            self.name = name
        self.dataset = dataset
        self.path = path
        self.frames = int(frames)
        self.type = type
        self.dataset_type = dataset_type


    def to_json(self):
        obj = {
            'name': self.name,
            'dataset': self.dataset,
            'path': self.path,
            'frames': self.frames,
            'type': self.type
        }
        return obj

    def from_json(obj):
        name = obj['name']
        dataset = obj['dataset']
        path = obj['path'] if 'path' in obj else None
        frames = int(obj['frames']) if 'frames' in obj else 0
        type = obj['type'] if 'type' in obj else None
        return Video(name, dataset, path, frames, type)

    def to_string(self):
        return "(name: {0}, dataset: {1}, path: {2}, frames: {3}, type: {4})".\
            format(self.name, self.dataset, self.path, self.frames, self.type)

