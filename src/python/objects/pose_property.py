from python.objects.dataset import Dataset

class PoseProperty:

    def __init__(self, dataset, scene, type, uid, lower_leg_length, upper_leg_length, lower_arm_length, upper_arm_length):
        """
        :param dataset: Dataset
        :param scene: str
        :param uid: int
        :param type: str
        :param lower_leg_length: float
        :param upper_leg_length: float
        :param lower_arm_length: float
        :param upper_arm_length: float
        """
        self.dataset = dataset
        self.scene = scene
        self.type = type
        self.uid = int(uid)
        self.lower_leg_length = float(lower_leg_length)
        self.upper_leg_length = float(upper_leg_length)
        self.lower_arm_length = float(lower_arm_length)
        self.upper_arm_length = float(upper_arm_length)

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

    # Return True if none of the lengths is 0. False ow
    def check_correct_lengths(self):
        if self.lower_leg_length == 0.0 or self.upper_leg_length == 0.0 or self.lower_arm_length == 0.0 or \
                self.upper_arm_length == 0.0:
            return False
        else:
            return True

    # Return True if none of the lengths is -1 (all limbs are initialized). False ow
    def is_initialized(self):
        if self.lower_leg_length == -1 and self.upper_leg_length == -1 and self.lower_arm_length == -1 and \
                self.upper_arm_length == -1:
            return False
        else:
            return True
