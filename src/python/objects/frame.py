from python.objects.dataset import Dataset


class Frame:

    def __init__(self, number, video, dataset, path=None, camera_parameters=None, has_ignore_regions=None,
                 has_no_densepose=None, is_labeled=None, nframes=None, frame_id=None, id=None):
        """
        :param number: int
        :param video: str
        :param dataset: Dataset
        :param path: str
        :param camera_parameters: str    {k: , rvec: , tvec: , w: , h: }
        :param has_ignore_regions: bool
        :param has_no_densepose: bool
        :param is_labeled: bool
        :param nframes: int
        :param frame_id: int
        :param id: int
        """
        self.number = int(number)
        self.dataset = dataset
        if dataset.is_aik():
            self.video = int(video)
        else:
            self.video = video
        self.path = path

        self.camera_parameters = camera_parameters
        self.has_ignore_regions = has_ignore_regions
        self.has_no_densepose = has_no_densepose
        self.is_labeled = is_labeled
        self.nframes = int(nframes) if nframes is not None else None
        self.frame_id = int(frame_id) if frame_id is not None else None
        self.id = int(id) if id is not None else None

    def __repr__(self):
        return self.to_string()

    def to_json(self):
        obj = {
            'number': self.number,
            'video': self.video,
            'dataset': self.dataset.name,
            'path': self.path,
        }
        # Add optional parameters if they exist
        if self.camera_parameters is not None: obj['cameraParameters'] = self.camera_parameters
        if self.has_ignore_regions is not None: obj['has_ignore_regions'] = self.has_ignore_regions
        if self.has_no_densepose is not None: obj['has_no_densepose'] = self.has_no_densepose
        if self.is_labeled is not None: obj['is_labeled'] = self.is_labeled
        if self.nframes is not None: obj['nframes'] = self.nframes
        if self.frame_id is not None: obj['frame_id'] = self.frame_id
        if self.id is not None: obj['id'] = self.id
        return obj

    def from_json(obj):
        number = obj['number']
        video = obj['video']
        dataset = Dataset(obj['dataset'], obj['datasetType']) if 'datasetType' in obj else Dataset(obj['dataset'])
        path = obj['path'] #if 'path' in obj else 0
        camera_parameters = obj['cameraParameters'] if 'cameraParameters' in obj else None
        has_ignore_regions = obj['has_ignore_regions'] if 'has_ignore_regions' in obj else None
        has_no_densepose = obj['has_no_densepose'] if 'has_no_densepose' in obj else None
        is_labeled = obj['is_labeled'] if 'is_labeled' in obj else None
        nframes = obj['nframes'] if 'nframes' in obj else None
        frame_id = obj['frame_id'] if 'frame_id' in obj else None
        id = obj['id'] if 'id' in obj else None
        return Frame(number, video, dataset, path, camera_parameters, has_ignore_regions, has_no_densepose, is_labeled,
                     nframes, frame_id, id)

    def to_string(self):
        return "(number: {0}, video: {1}, dataset: {2}, path: {3}, camera_parameters: {4}, has_ignore_regions: {5}," \
               "has_no_densepose: {6}, is_labeled: {7}, nframes: {8}, frame_id: {9}, id: {10})".\
            format(self.number, self.video, self.dataset.to_json(), self.path, self.camera_parameters, self.has_ignore_regions,
                   self.has_no_densepose, self.is_labeled, self.nframes, self.frame_id, self.id)

