from python.objects.object import Object
from python.objects.dataset import Dataset

class Annotation:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def __init__(self, dataset, scene, frame=None, user=None, objects=[], validated=None):
        """
        :param dataset: Dataset
        :param dataset_type: str    {actionInKitchen, poseTrack}
        :param scene: str
        :param frame: int
        :param user: str
        :param objects: [] Object
        :param validated: str   {unchecked, correct, incorrect}
        """
        self.dataset = dataset
        self.scene = scene
        self.frame = int(frame) if frame is not None else None
        self.user = user
        self.objects = objects
        self.validated = validated

    def to_json(self):
        obj = {
            'scene': self.scene,
            'dataset': self.dataset.name,
            'frame': self.frame,
            'user': self.user,
            'objects': self.objects.to_json()
        }
        # Add optional parameters if they exist
        if self.validated is not None: obj['validated'] = self.validated

        return obj

    def from_json(obj, dataset_type):
        scene = obj['scene']
        frame = obj['frame']
        dataset = Dataset(obj['dataset'])
        user = obj['user'] if 'user' in obj else None
        print(obj['objects'][0])
        objects = Object.from_json(obj['objects'][0], dataset_type) if 'objects' in obj else None
        validated = obj['validated'] if 'validated' in obj else None

        return Annotation(scene, frame, dataset, user, objects, validated)

    def to_string(self):
        return "(scene: {0}, dataset: {1}, frame: {2}, user: {3}, objects: {4}, validated: {5})".\
            format(self.scene, self.dataset, self.frame, self.user, self.objects, self.validated)

