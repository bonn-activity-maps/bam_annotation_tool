from pymongo import MongoClient, errors

from python.logic.datasetService import DatasetService
from python.logic.videoService import VideoService
from python.logic.annotationService import AnnotationService


from python.objects.annotation import Annotation
from python.objects.object import Object
from python.objects.dataset import Dataset
from python.objects.video import Video

datasetService = DatasetService()
videoService = VideoService()
annotationService = AnnotationService()


class PrecomputeAnnotations:
    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Find an item with a key that has a value "value"
    @staticmethod
    def find(lst, key, value):
        for item in lst:
            if item[key] == value:
                return item
        return 0

    # Find an item with a key that has a value "value"
    @staticmethod
    def find_pair(lst, key, value, key2, value2):
        for item in lst:
            if item.type == value and item.track_id == value2:
                return item
        return 0

    @staticmethod
    def pad(string, number):
        while len(string) < number:
            string = "0" + string
        return string

    # Generate a new valid poseTrack ID
    def generate_uid(self, annotation, objects, nr_id, track_id):
        for obj in objects:
            if obj.track_id == track_id:
                return obj.uid, nr_id
        uid = "1" + annotation.scene + self.pad(str(annotation.frame), 4) + self.pad(str(nr_id[annotation.frame]), 2)
        nr_id[annotation.frame] += 1
        return uid, nr_id

    @staticmethod
    def add_person_id_to_object(lst, uid, type, person_id):
        for i in range(0, len(lst)):
            if lst[i].uid == uid and lst[i].type == type:
                lst[i].person_id = person_id
                break
        return lst

    def precomputeAnnotations(self):
        # Get all videos of dataset
        dataset = Dataset("posetrack_data", self.pt)
        _, videos, _ = videoService.get_videos(dataset)
        person_id = 0
        for video in videos:
            video = Video.from_json(video)
            print("Precomputing for ", video.name)
            _, min_frame, _ = videoService.get_min_frame(video)
            _, max_frame, _ = videoService.get_max_frame(video)
            _, vid_annotations, _ = annotationService.get_annotations(Annotation(video.dataset, video.name))
            # vid_annotations = [Annotation.from_json(r,  video.dataset.type) for r in list(vid_annotations)]
            track_ids = []          # list of track_id numbers during the video
            nr_id = [0] * max_frame["frames"]   # ordered list of highest nr_id in original ids of a frame. key is
            # frame number
            annotations = []        # list of every annotation
            # Pass 1: Create annotation, track_ids and nr_ids arrays
            for i in range(min_frame["frames"] - 1, max_frame["frames"]):
                annotation = self.find(vid_annotations, "frame", i)
                if annotation == 0:
                    annotations.append(Annotation(video.dataset, video.name, frame=i, user="root"))
                else:
                    annotation = Annotation.from_json(annotation, self.pt)
                    annotations.append(annotation)
                    for obj in annotation.objects:
                        nr_id[i] = obj.uid % 100 if obj.uid % 100 > nr_id[i] else nr_id[i]
                        track_ids.append(obj.track_id) if obj.track_id not in track_ids else None
            # Pass 2: Create empty objects for every track id, type and frame and update the db
            # Create the person_ids for every track_id, key is track_id
            person_ids = [i for i in range(person_id, person_id + len(track_ids))]
            for annotation in annotations:
                objects = list(annotation.objects)
                # For each track_id already in the video
                index = 0
                for track_id in track_ids:
                    # For each of the types
                    for objectType in ["bbox", "bbox_head", "person"]:
                        # print("objectType: ", objectType)
                        obj = self.find_pair(objects, "type", objectType, "track_id", track_id)
                        # If object does not exist, create empty one
                        if obj == 0:
                            uid, nr_id = self.generate_uid(annotation, list(objects), list(nr_id), track_id)
                            new_obj = Object(uid, objectType, keypoints=[], dataset_type=self.pt,
                                             track_id=track_id, person_id=person_ids[index])
                            objects.append(new_obj)
                        else:
                            objects = self.add_person_id_to_object(list(objects), obj.uid, objectType, person_ids[index])
                    index += 1
                annotation.objects = objects
                result = self.db.annotation.replace_one({"dataset": "posetrack_data", "scene": video.name, "user": "root",
                                                         "frame": annotation.frame}, annotation.to_json(), upsert=True)
                if not result:
                    print("ERROR")
                    exit()
            person_id = person_id + len(track_ids)
            # exit()
