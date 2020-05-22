from python.objects.dataset import Dataset

class PoseProperty:

    def __init__(self, dataset, scene, type, uid, lower_leg_length, upper_leg_length, lower_arm_length, upper_arm_length):
        """
        :param dataset: Dataset
        :param scene: str
        :param uid: int
        :param type: str
        :param lower_leg_length: int
        :param upper_leg_length: int
        :param lower_arm_length: int
        :param upper_arm_length: int
        """
        self.dataset = dataset
        self.scene = scene
        self.type = type
        self.uid = int(uid)
        self.lower_leg_length = int(lower_leg_length)
        self.upper_leg_length = int(upper_leg_length)
        self.lower_arm_length = int(lower_arm_length)
        self.upper_arm_length = int(upper_arm_length)

    def __repr__(self):
        return self.to_string()

    def to_json(self):
        obj = {
            'dataset': self.dataset.name,
            'scene': self.scene,
            'type': self.type,
            'uid': self.uid,
            'lowerLegLength': self.lower_leg_length,
            'upperLegLength': self.upper_leg_length,
            'lowerArmLength': self.lower_arm_length,
            'upperArmLength': self.upper_arm_length,
        }
        return obj

    def from_json(obj):
        dataset = Dataset(obj['dataset'], obj['datasetType']) if 'datasetType' in obj else Dataset(obj['dataset'])
        scene = obj['scene']
        type = obj['type']
        uid = obj['uid']
        lower_leg_length = obj['lowerLegLength']
        upper_leg_length = obj['upperLegLength']
        lower_arm_length = obj['lowerArmLength']
        upper_arm_length = obj['upperArmLength']
        return PoseProperty(dataset, scene, type, uid, lower_leg_length, upper_leg_length, lower_arm_length, upper_arm_length)

    def to_string(self):
        return "(dataset: {0}, scene: {1}, type: {2}, uid: {3}, lower_leg_length: {4}, upper_leg_length: {5}, lower_arm_length: {6}, upper_arm_length: {7})".\
            format(self.dataset.to_json(), self.scene, self.type, self.uid, self.lower_leg_length,
                   self.upper_leg_length, self.lower_arm_length, self.upper_arm_length)

