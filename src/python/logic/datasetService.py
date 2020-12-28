import os, json, shutil
import logging
from werkzeug.utils import secure_filename
import zipfile
import numpy as np

from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.frameManager import FrameManager
from python.logic.videoService import VideoService
from python.logic.frameService import FrameService
from python.logic.annotationService import AnnotationService
from python.logic.objectTypeService import ObjectTypeService
from python.logic.ptService import PTService

from python.objects.object_type import Object_type
from python.objects.object import Object
from python.objects.annotation import Annotation
from python.objects.video import Video

# DatasetService logger
log = logging.getLogger('datasetService')

datasetManager = DatasetManager()
videoManager = VideoManager()
annotationManager = AnnotationManager()
actionManager = ActionManager()
frameManager = FrameManager()
videoService = VideoService()
frameService = FrameService()
annotationService = AnnotationService()
objectTypeService = ObjectTypeService()
ptService = PTService()


class DatasetService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the videos

    # Convert bytes to MB, GB, etc
    def convert_bytes(self, num):
        """
        self function will convert bytes to MB.... GB... etc
        """
        for x in ['bytes', 'KB', 'MB', 'GB', 'TB']:
            if num < 1024.0:
                return "%3.1f %s" % (num, x)
            num /= 1024.0

    # Process dataset from zip file
    # Extract zip, check integrity and create dataset
    def process_dataset(self, dataset):
        # Extract zip
        save_path = os.path.join(dataset.STORAGE_DIR, secure_filename(dataset.file_name))
        zip = zipfile.ZipFile(save_path, 'r')
        zip.extractall(dataset.STORAGE_DIR)

        # Check integrity depending on the dataset type
        if dataset.is_pt():
            # integrity = self.check_integrity_PT(dataset.dir)
            integrity = True
        elif dataset.is_aik():
            integrity = self.check_integrity_AIK(dataset.dir)
        else:
            integrity = False

        # Remove zip file
        #TODO enable it again once pt fixed
        if dataset.is_aik():
            os.remove(dataset.STORAGE_DIR + dataset.file_name)

        if integrity:
            result = datasetManager.create_dataset(dataset)
            if result == 'Error':
                return False, 'Error creating dataset in database', 500
            else:
                return True, result, 200
        else:
            shutil.rmtree(dataset.dir)
            return False, 'Error on folder subsystem, check your file and try again', 400

    # Return a list of zip files in the root file system
    def get_zip_files(self):
        list_dir = os.listdir(self.STORAGE_DIR)
        zip_files = []
        for file in list_dir:
            if file.endswith(".zip"):
                size = os.stat(os.path.join(self.STORAGE_DIR, file)).st_size
                zip_files.append({
                    "name": file,
                    "size": self.convert_bytes(size)
                })
        return True, zip_files, 200

    # PT: Check integrity of annotations
    # AIK: Check integrity of cameras and videos (for aik)
    def check_integrity_of_annotations(self, dir_annotations, dir_images):
        has_consistency = True
        for f in os.listdir(dir_annotations):
            filename, filextension = os.path.splitext(f)
            if not os.path.isdir(dir_images + filename):
                has_consistency = False
                break
        return has_consistency

    # Return the result of storing info wrt different types of datasets
    def add_info(self, dataset):
        if dataset.is_aik():
            result = self.add_info_AIK(dataset)
        elif dataset.is_pt():
            result = self.add_info_PT(dataset)
        else:
            result = False, 'Incorrect dataset type', 500
        return result

    ###########################################################################
    ####                           PT INFO METHODS                        ####
    ###########################################################################

    # Check integrity for posetrack datasets
    def check_integrity_PT(self, dir):
        is_dir = os.path.isdir(dir)
        dir_annotations = dir + "/annotations"
        dir_images = dir + "/images"
        has_annotations = os.path.isdir(dir_annotations)
        has_images = os.path.isdir(dir_images)
        has_test = os.path.isdir(dir_images + "/test") and os.path.isdir(dir_annotations + "/test")
        has_train = os.path.isdir(dir_images + "/train") and os.path.isdir(dir_annotations + "/train")
        has_val = os.path.isdir(dir_images + "/val") and os.path.isdir(dir_annotations + "/val")

        try:
            has_consistency = self.check_integrity_of_annotations(dir_annotations + "/test/", dir_images + "/test/")
            has_consistency *= self.check_integrity_of_annotations(dir_annotations + "/train/", dir_images + "/train/")
            has_consistency *= self.check_integrity_of_annotations(dir_annotations + "/val/", dir_images + "/val/")

            return is_dir and has_annotations and has_images and has_test and has_train and has_val and has_consistency
        except:
            log.exception('Error checking integrity of zip')
            return False

    # Store info of posetrack datasets: videos ....
    def add_info_PT(self, dataset):
        # Store info in DB
        result_videos = videoService.add_videos_PT(dataset)
        result_annotations = self.read_annotations_PT(dataset)
        if result_videos == 'Error' or result_annotations == 'Error':
            return False, 'Error saving videos in database', 400
        else:
            return True, 'ok', 200

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if it encounters some problem
    def read_annotations_PT(self, dataset):
        final_result = True
        types = ["test", "train", "val"]
        for type in types:
            try:
                dirpath = os.path.join(dataset.dir, "annotations/" + type)
                listdir = os.listdir(dirpath)
                for file in listdir:
                    filename, filextension = os.path.splitext(file)
                    if filextension == '.json':
                        temp_result = self.process_annotation_file_PT(dataset, file, dirpath)
                    final_result = final_result   # and temp_result # TODO check in the future
            except FileNotFoundError:
                # TODO Check if this is still the case in the future...
                log.exception("Folder called " + str(type) + " not found")
        return 'ok' if final_result else 'Error'

    # Process one file entirely from JSON to our DB, including images, categories and anotations info.
    def process_annotation_file_PT(self, dataset, file, dir):
        print("Processing annotation file ", file, " from ", dir)
        # Read data from file
        file_route = os.path.join(dir, file)
        try:
            with open(file_route) as json_file:
                annotation = json.load(json_file)
        except OSError:
            log.exception('Could not read from file')
            return False

        # Transform annotation to our format and store in db
        frames = ptService.safely_read_dictionary(annotation, "images")
        categories = ptService.safely_read_dictionary(annotation, "categories")
        annotations = ptService.safely_read_dictionary(annotation, "annotations")

        try:
            result_categories = self.add_categories_PT(dataset, categories) if categories is not None else True
        except:
            log.exception("Error while processing Categories")
            result_categories = True
        try:
            result_frames = frameService.add_frames_PT(dataset, frames) if frames is not None else True
        except:
            log.exception("Error while processing Frames")
            result_frames = True
        try:
            result_annotations = self.add_annotations_PT(dataset, annotations) if annotations is not None else True
        except:
            log.exception("Error while processing Annotations")
            result_annotations = True

        return result_frames and result_annotations and result_categories

    def add_annotations_PT(self, dataset, annotations):
        for annotation in annotations:
            image_id = ptService.safely_read_dictionary(annotation, "image_id")
            # Read invariable data
            track_id = ptService.safely_read_dictionary(annotation, "track_id")
            category_id = 1
            id = ptService.safely_read_dictionary(annotation, "id")
            result, og_frame, _ = frameService.get_frame_by_ID(image_id, dataset)
            og_objects = []
            # Read variable data (Data that may or may not be
            try:
                bbox_head = ptService.safely_read_dictionary(annotation, "bbox_head")
                bbox_head_keypoints = [[bbox_head[0], bbox_head[1]],
                                  [bbox_head[2], bbox_head[3]]]
                # Create object for bbox_head and add it to the objects list
                object_bbox_head = Object(id, "bbox_head", ptService.transform_to_XYXY(bbox_head_keypoints),
                                          dataset.type, category_id=category_id, track_id=track_id)
                og_objects.append(object_bbox_head)     # Append new object
            except:
                log.exception("Error reading bbox_head")
            try:
                bbox = ptService.safely_read_dictionary(annotation, "bbox")
                bbox_keypoints = [[bbox[0], bbox[1]],
                                  [bbox[2], bbox[3]]]
                object_bbox = Object(id, "bbox", ptService.transform_to_XYXY(bbox_keypoints), dataset.type,
                                     category_id=category_id, track_id=track_id)
                og_objects.append(object_bbox)          # Append new object
            except:
                log.exception("Error reading bbox")
            keypoints = ptService.safely_read_dictionary(annotation, "keypoints")
            person_keypoints = []   # Keypoints of the skeleton, ordered
            # Create array of 3d keypoints (z = visibility)
            try:
                for i in range(0, len(keypoints), 3):
                    person_keypoints.append([keypoints[i], keypoints[i+1], keypoints[i+2]])
                object_person = Object(id, "person", person_keypoints, dataset.type, category_id=category_id, track_id=track_id)
                og_objects.append(object_person)        # Append new object
            except:
                log.exception("Error reading person")

            # Update annotation with the resulting objects
            annotation = Annotation(dataset, og_frame.video, og_frame.number, "root", og_objects)
            result = annotationManager.update_annotation_insert_objects(annotation)
            if result == 'error':
                return False
        return True

    def add_categories_PT(self, dataset, categories):
        # Categories
        for cat in categories:
            type = ptService.safely_read_dictionary(cat, "name")
            labels = ptService.safely_read_dictionary(cat, "keypoints")
            supercategory = ptService.safely_read_dictionary(cat, "supercategory")
            id = ptService.safely_read_dictionary(cat, "id")
            skeleton = ptService.safely_read_dictionary(cat, "skeleton")
            object_type = Object_type(type, dataset.type, labels=labels, supercategory=supercategory, id=id, skeleton=skeleton)
            result = objectTypeService.create_object_type(object_type)
            if result == 'error':
                return False

        # Ignore Regions
        object_type = Object_type("ignore_region", dataset.type, is_polygon=True)
        result = objectTypeService.create_object_type(object_type)
        if result == 'error':
            return False

        # Bbox
        labels = ["Top Left", "Bottom Right"]
        object_type = Object_type("bbox", dataset.pt, labels=labels, is_polygon=False)
        result = objectTypeService.create_object_type(object_type)
        if result == 'error':
            return False

        # Bbox head
        labels = ["Top Left", "Bottom Right"]
        object_type = Object_type("bbox_head", dataset.pt, labels=labels, is_polygon=False)
        result = objectTypeService.create_object_type(object_type)
        if result == 'error':
            return False

        return True

    ###########################################################################
    ####                           AIK INFO METHODS                        ####
    ###########################################################################

    # Check integrity for aik datasets
    def check_integrity_AIK(self, dir):
        # Directories and files
        dir_cameras = dir + "/cameras"
        dir_videos = dir + "/videos"
        file_dataset = dir + "/dataset.json"

        # Check dirs and files
        is_dir = os.path.isdir(dir)
        has_cameras = os.path.isdir(dir_cameras)
        has_videos = os.path.isdir(dir_videos)
        has_dataset = os.path.isfile(file_dataset)

        try:
            has_consistency = self.check_integrity_of_annotations(dir_cameras, dir_videos+"/")

            return is_dir and has_cameras and has_videos and has_dataset and has_consistency
        except:
            log.exception('Error checking integrity of zip')
            return False

    # Store info of AIK datasets: videos, annotations and camera params by frame
    def add_info_AIK(self, dataset):
        # Directories for AIK datasets
        videos_dir = os.path.join(dataset.dir, 'videos/')
        annotations_file = os.path.join(dataset.dir, 'persons2poses.json')

        # Store info in DB
        result_videos = videoService.add_videos_AIK(dataset, videos_dir)
        result_cameras = frameService.add_frame_AIK(dataset)
        # Store annotations in DB only if file exists
        if os.path.isfile(annotations_file):
            result_annotations = annotationService.add_annotations_AIK(dataset, annotations_file)
        else:
            result_annotations = True

        if result_videos == 'Error' or result_cameras == 'Error' or result_annotations == 'Error':
            self.remove_dataset(dataset)
            log.error('Error storing dataset. The dataset ' + dataset + ' has been removed')
            return False, 'Error storing dataset. Please upload the zip again', 400
        else:
            return True, 'ok', 200

    ###########################################################################
    ####                           EXPORT                                  ####
    ###########################################################################

    # Export annotation to a file for given dataset depending on dataset type
    def export_dataset(self, dataset):
        if dataset.is_aik():
            result = self.export_dataset_AIK(dataset)
        elif dataset.is_pt():
            result = self.export_dataset_PT(dataset)
        else:
            result = 'Incorrect dataset type'
        return True, result, 200

    def is_track_id_on_list(self, lst, uid, track_id):
        for i in range(0, len(lst)):
            if lst[i]["id"] == uid and lst[i]["track_id"] == track_id:
                return i
        return -1

    # Process ignore regions to export for one frame
    def export_ignore_regions(self, annotation):
        ignore_regions_y = []
        ignore_regions_x = []
        # Get all annotations for 1 frame
        annotation_result = annotationManager.get_annotations_by_frame_range(annotation, annotation)

        if annotation_result:
            for a in annotation_result:
                for o in a['objects']:
                    if o['type'] == 'ignore_region' and o['keypoints']:
                        kps_without_empty_arrays = [kp for kp in o['keypoints'] if kp]
                        if kps_without_empty_arrays:
                            kp = np.array(kps_without_empty_arrays)
                            if kp.shape[1] == 2:
                                ignore_regions_y.append(kp[:, 1].tolist())
                                ignore_regions_x.append(kp[:, 0].tolist())

        # If there is only 1 ignore region -> only 1 array with all coordinates
        if len(ignore_regions_y) == 1:
            ignore_regions_y = ignore_regions_y[0]
            ignore_regions_x = ignore_regions_x[0]

        return ignore_regions_y, ignore_regions_x

    # Process keypoints of a person to ensure everything's right
    def process_keypoints_person(self, keypoints):
        for idx, kp in enumerate(keypoints):
            if not kp:
                keypoints[idx] = [0, 0, 0]
        final_kps = np.array(keypoints).flatten().tolist()
        is_correct = True
        reason = ""
        if len(final_kps) != 51:
            is_correct = False
            reason = reason + " Incorrect length of " + str(len(final_kps)) + ";"
        for kp in final_kps:
            if kp is None:
                is_correct = False
                reason = reason + " Incorrect value of keypoint " + str(kp) + ";"
        #  TODO what to do with is_correct
        if final_kps != [] and not is_correct:
            try:
                print("Error in keypoints formatting")
                print(reason)
                print("-----------------")
                print(keypoints)
                print(len(keypoints))
                print(type(keypoints))
                print(type(keypoints[3]))
                print(type(keypoints[3][0]))
                print("-----------------")
                print(final_kps)
                print(len(final_kps))
                print(type(final_kps))
                print(type(final_kps[3]))
                print(type(final_kps[3][0]))
                print("-----------------")
            except:
                print("")
        return final_kps

    def check_annotations_file(self, annotations_file, videoname):
        is_correct = True
        reason = ""
        for idx, annotation in enumerate(annotations_file):
            try:
                # Assert that points are in the correct format
                reason = "Incorrect bbox"
                # If there's no bbox add an empty list
                if "bbox" not in annotation:
                    annotations_file[idx]["bbox"] = []
                    annotation = annotations_file[idx]
                assert len(annotation["bbox"]) == 4 \
                    if annotation["bbox"] != [] else len(annotation["bbox"]) == 0
                reason = "Incorrect bbox_head"
                if "bbox_head" not in annotation:
                    annotations_file[idx]["bbox_head"] = []
                    annotation = annotations_file[idx]
                assert len(annotation["bbox_head"]) == 4 \
                    if annotation["bbox_head"] != [] else len(annotation["bbox_head"]) == 0
                reason = "Incorrect keypoints"
                assert len(annotation["keypoints"]) == 51 \
                    if annotation["keypoints"] != [] else len(annotation["keypoints"]) == 0
                # Assert the rest of the parameters
                reason = "Incorrect category_id"
                assert annotation["category_id"] == 1
                reason = "Incorrect track_id"
                assert 0 <= annotation["track_id"] < 100
                reason = "Incorrect person_id"
                assert 0 <= annotation["person_id"]
                reason = "Incorrect id"
                assert len(str(annotation["id"])) == 13
                reason = "Incorrect image_id"
                assert len(str(annotation["image_id"])) == 11
                # TODO check whether image_id is correct. Probably correct image_id that start with 2.
            except AssertionError:
                print(videoname, "ERROR: Annotation incorrect: " + reason)
                print("-----------------")
                print(annotation)
                print("-----------------")
                return False
            except KeyError:
                print(videoname, "ERROR: Annotation incorrect: Missing keyword: " + reason)
                print("-----------------")
                print(annotation)
                print("-----------------")
                return False
        return is_correct

    def create_missing_params_pt(self, obj):
        if "bbox" not in obj:
            obj["bbox"] = []
        if "bbox_head" not in obj:
            obj["bbox_head"] = []
        if "keypoints" not in obj:
            obj["keypoints"] = []
        return obj

    # Export annotation file for PT datasets to a file for a given dataset
    def export_dataset_PT(self, dataset):
        videos = videoManager.get_videos(dataset)
        for j in range(0, len(videos)):
            # Ignore buggy videos
            if videos[j].name not in ptService.video_ignore_list:
                final_annotation = dict()

                annotation = Annotation(dataset, videos[j].name)
                # _, annotations_db, _ = annotationService.get_annotations(dataset, dataset.pt, videos[j].name, "root")
                _, annotations_db, _ = annotationService.get_annotations(annotation)

                # Process frame data
                _, frames, _ = frameService.get_frames(videos[j])
                for i in range(0, len(frames)):
                    frames[i]["vid_id"] = frames[i]["video"]
                    frames[i]["file_name"] = '/'.join((frames[i]["path"]).split("/")[-4:])
                    frames[i]["has_no_densepose"] = True
                    frames[i]["nframes"] = len(frames)
                    frames[i]["is_labeled"] = True if annotations_db[i]["objects"] != [] else False
                    # True if the pose has been modified. Meaning it has to be in the frames to annotate array.
                    _, list_of_frames_to_annotate, _ = ptService.get_frames_to_annotate_per_video(frames[i]["video"])
                    frames[i]["has_labeled_pose"] = True \
                        if frames[i]["number"] in list_of_frames_to_annotate \
                        else False
                    # Add ignore regions
                    annotation = Annotation(dataset, videos[j].name, frame=i)
                    frames[i]["ignore_regions_y"], frames[i]["ignore_regions_x"] = self.export_ignore_regions(annotation)
                    del(frames[i]["number"])
                    del(frames[i]["dataset"])
                    del(frames[i]["video"])
                    del(frames[i]["path"])
                    del(frames[i]["has_ignore_regions"])
                final_annotation["images"] = frames

                # Process annotation data

                # Export data only in the original range of annotations
                video = Video(videos[j].name, dataset)
                result, frames_info = frameService.get_frame_info_of_video(video)
                if result:
                    min_frame, max_frame = frames_info[0].number, frames_info[1].number

                    annotations_file = list()
                    for i in range(0, len(annotations_db)):
                        # Export only annotations in the original frame range
                        if min_frame <= annotations_db[i]["frame"] <= max_frame:
                            objects = annotations_db[i]["objects"]
                            for obj in objects:
                                if obj["type"] != 'ignore_region':      # Ignore 'ignore_regions' --> already exported
                                    index = self.is_track_id_on_list(annotations_file, obj["uid"], obj["track_id"])
                                    if index == -1:
                                        if obj["type"] == "bbox":
                                            kps = ptService.transform_to_XYWH(obj["keypoints"])
                                            # Set negative numbers to 0
                                            kps = [0 if i < 0 else i for i in kps]
                                            obj["bbox"] = kps
                                            del(obj["keypoints"])
                                        elif obj["type"] == "bbox_head":
                                            kps = ptService.transform_to_XYWH(obj["keypoints"])
                                            # Set negative numbers to 0
                                            kps = [0 if i < 0 else i for i in kps]
                                            obj["bbox_head"] = kps
                                            del(obj["keypoints"])
                                        elif obj["type"] == "person":   # flatten keypoints array
                                            kps = list(obj["keypoints"])
                                            del(obj["keypoints"])
                                            kps = [0 if i < 0 else i for i in kps]
                                            obj["keypoints"] = self.process_keypoints_person(kps)
                                        # Always delete type field, as it is unnecessary
                                        del(obj["type"])
                                        obj["id"] = obj["uid"]
                                        del(obj["uid"])
                                        obj["image_id"] = int(obj["id"]/100)
                                        obj["scores"] = []
                                        obj = self.create_missing_params_pt(obj)
                                        annotations_file.append(obj)
                                    else:   # If already in annotation, just add what we want
                                        if obj["type"] == "bbox":
                                            annotations_file[index]["person_id"] = obj["person_id"]
                                            kps = ptService.transform_to_XYWH(obj["keypoints"])
                                            # Set negative numbers to 0
                                            kps = [0 if i < 0 else i for i in kps]
                                            annotations_file[index]["bbox"] = kps
                                        elif obj["type"] == "bbox_head":
                                            kps = ptService.transform_to_XYWH(obj["keypoints"])
                                            # Set negative numbers to 0
                                            kps = [0 if i < 0 else i for i in kps]
                                            annotations_file[index]["bbox_head"] = kps
                                        elif obj["type"] == "person":
                                            # annotations_file[index]["keypoints"] = np.array(obj["keypoints"]).flatten().tolist()
                                            kps = list(obj["keypoints"])
                                            del(obj["keypoints"])
                                            kps = [0 if i < 0 else i for i in kps]
                                            annotations_file[index]["keypoints"] = self.process_keypoints_person(kps)
                    # annotations_correct = self.check_annotations_file(annotations_file, videos[j].name)
                    final_annotation["annotations"] = annotations_file

                # Hardcoded categories because they don't change and are a very special case...
                categories = [{
                    "supercategory": "person",
                    "id": 1,
                    "name": "person",
                    "keypoints": [
                        "nose",
                        "head_bottom",
                        "head_top",
                        "left_ear",
                        "right_ear",
                        "left_shoulder",
                        "right_shoulder",
                        "left_elbow",
                        "right_elbow",
                        "left_wrist",
                        "right_wrist",
                        "left_hip",
                        "right_hip",
                        "left_knee",
                        "right_knee",
                        "left_ankle",
                        "right_ankle"
                    ],
                    "skeleton": [
                        [
                            16,
                            14
                        ],
                        [
                            14,
                            12
                        ],
                        [
                            17,
                            15
                        ],
                        [
                            15,
                            13
                        ],
                        [
                            12,
                            13
                        ],
                        [
                            6,
                            12
                        ],
                        [
                            7,
                            13
                        ],
                        [
                            6,
                            7
                        ],
                        [
                            6,
                            8
                        ],
                        [
                            7,
                            9
                        ],
                        [
                            8,
                            10
                        ],
                        [
                            9,
                            11
                        ],
                        [
                            2,
                            3
                        ],
                        [
                            1,
                            2
                        ],
                        [
                            1,
                            3
                        ],
                        [
                            2,
                            4
                        ],
                        [
                            3,
                            5
                        ],
                        [
                            4,
                            6
                        ],
                        [
                            5,
                            7
                        ]
                    ]
                }]
                final_annotation["categories"] = categories
                # Write to file
                path = os.path.join(dataset.STORAGE_DIR + dataset.name + "_export", videos[j].type)
                # Get file name from original path name
                try:
                    file = os.path.join(path, frames[0]["file_name"].split("/")[-2] + '.json')
                    if not os.path.exists(path):
                        os.makedirs(path)
                    with open(file, 'w') as outfile:
                        json.dump(final_annotation, outfile)
                except:
                    print("Empty video ", videos[j].name)
        return 'ok'

    # Export annotation for AIK datasets to a file for given dataset
    def export_dataset_AIK(self, dataset):
        file = os.path.join(dataset.STORAGE_DIR, dataset.name + '.json')

        # Remove file before export if it exists
        if os.path.exists(file):
            os.remove(file)

        result_persons = self.export_objects_AIK(dataset, file, ['personAIK', 'poseAIK'], 'persons')
        result_objects = self.export_objects_AIK(dataset, file, ['boxAIK', 'cylinderAIK'], 'objects')
        result_actions = self.export_actions_AIK(dataset, file)

        if result_persons == 'Error' or result_objects == 'Error' or result_actions == 'Error':
            return False, 'Error getting annotations for the dataset', 400
        return 'ok'

    # Add all objects from dataset to file with object type in the obj_type array
    def export_objects_AIK(self, dataset, file, obj_types, final_obj_name):
        # Divide frames in ranges to query only one range each time
        result_ok, frames_info = frameService.get_frame_info_of_video(Video(0, dataset))
        if not result_ok:
            return False

        max_frame = frames_info[1].number
        num_intervals = 10
        frames = np.arange(0, max_frame, max_frame/num_intervals, dtype=np.int)
        if frames[-1] < max_frame:
            frames = np.append(frames, max_frame)

        objects = []
        for i in range(len(frames)-1):
            db_objects = annotationManager.get_objects_by_dataset(dataset, frames[i], frames[i+1])
            if db_objects == 'Error':
                return False

            for annotation in db_objects:    # Each annotation
                frame_objects = []
                for obj in annotation['objects']:     # Each object in annotation
                    if obj['keypoints'] and obj['type'] in obj_types:          # Export only not empty keypoints
                        if obj['type'] == 'personAIK' or obj['type'] == 'poseAIK':
                            o = {"pid": obj['uid'],
                                 "location": obj['keypoints'],
                                 "type": obj['type']}
                        else:
                            o = {"oid": obj['uid'],
                                 "location": obj['keypoints'],
                                 "labels": obj['labels'],
                                 "type": obj['type']}
                        frame_objects.append(o)

                # Build persons and objects jsons and add to list
                objects_json = {"frame": annotation['frame'],
                                final_obj_name: frame_objects}
                objects.append(objects_json)

        # Build and write final annotation
        objs_json = {
            final_obj_name: objects
        }
        self.append_json_to_file(file, objs_json)
        return True

    # Add all actions from dataset to file
    def export_actions_AIK(self, dataset, file):
        actions = actionManager.get_actions_by_dataset_export(dataset)
        if actions == 'Error':
            return False

        # Build and write final annotation
        actions_json = {
            "actions": actions
        }
        self.append_json_to_file(file, actions_json)
        return True

    # Append json_data to file
    def append_json_to_file(self, file, json_data):
        with open(file, 'a') as f:
            json.dump(json_data, f)
            f.write(os.linesep)

    ###########################################################################
    ####                           DATABASE                                ####
    ###########################################################################

    # Return dataset
    def get_dataset(self, dataset):
        result = datasetManager.get_dataset(dataset)
        if result == 'Error':
            return False, 'Incorrect dataset', 400
        else:
            return True, result.to_json(), 200

    # Return list with all datasets. Empty list if there are no datasets
    def get_datasets(self):
        result = datasetManager.get_datasets()
        if result == 'Error':
            return False, 'Error searching datasets', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return ok if it has been created
    def create_dataset(self, dataset):
        # Check if datasets exists
        if datasetManager.get_dataset(dataset) != 'Error':
            return False, 'The dataset ' + dataset.name + ' already exists', 400
        else:
            result = datasetManager.create_dataset(dataset)
            if result == 'Error':
                return False, 'Error creating dataset', 400
            else:
                return True, result, 200
                # return self.add_videos_AIK(dataset.name) if dataset.type == self.aik else self.add_videos_PT(dataset.name)

    # Remove dataset, videos and frames in DB and folder corresponding to dataset
    # Remove corresponding annotations
    # Return 'ok' if everything has been removed
    def remove_dataset(self, dataset):
        try:
            # Remove folder
            shutil.rmtree(dataset.dir)
            log.info('Removed ', dataset.name, ' successfully.')

            # Remove videos and dataset in DB
            result_videos = videoManager.remove_videos_by_dataset(dataset)
            result_dataset = datasetManager.remove_dataset(dataset)
            result_annotations = annotationManager.remove_annotations_by_dataset(dataset)
            result_frames = frameService.remove_frames_by_dataset(dataset)

            if result_videos == 'Error':
                return False, 'Error deleting videos in dataset', 400
            elif result_dataset == 'Error':
                return False, 'Error deleting dataset', 400
            elif result_annotations == 'Error':
                return False, 'Error deleting annotations', 400
            elif result_frames == 'Error':
                return False, 'Error deleting frames', 400
            else:
                return True, 'ok', 200
        except OSError:
            log.exception('Error deleting the dataset in file system')
            return False, 'Server error deleting the dataset', 500

    def create_ignore_region(self, id_nr, track_id, ir, dataset, frame_nr):
        ignore_region_obj = Object(id_nr * 100 + track_id, "ignore_region",
                                   keypoints=ir.tolist(),
                                   dataset_type=dataset.type,
                                   track_id=track_id)
        # Update existing annotation with new object
        scene_nr = (id_nr % 10000000000) / 10000
        scene = ptService.pad(str(int(scene_nr)), 6)    # Ignore this warning, it works
        annotation = Annotation(dataset, scene, frame=frame_nr, user="root",
                                objects=[ignore_region_obj])
        return annotationManager.create_frame_object(annotation)

    # Read Ignore Region information from annotations and load it into the db
    def load_ignore_regions(self, dataset):
        final_result = True
        types = ["test", "train", "val"]
        ir_obj_type = Object_type("ignore_region", "poseTrack", num_keypoints=0, is_polygon=True)
        for data_type in types:
            try:
                dirpath = os.path.join(dataset.dir, "annotations/" + data_type)
                listdir = os.listdir(dirpath)
                for file in listdir:
                    filename, filextension = os.path.splitext(file)
                    if filextension == '.json':
                        # Read annotation file and create the ignore regions
                        print("Processing annotation file ", file)
                        # Read data from file
                        file_route = os.path.join(dirpath, file)
                        try:
                            with open(file_route) as json_file:
                                annotation = json.load(json_file)
                        except OSError:
                            log.exception('Could not read from file')
                            return False
                        # Load ignore regions into db
                        frames = ptService.safely_read_dictionary(annotation, "images")
                        for frame in frames:
                            id_nr = int(ptService.safely_read_dictionary(frame, "id"))
                            frame_nr = id_nr % 10000
                            # print("Processing frame: ", frame_nr)
                            ignore_regions_x = ptService.safely_read_dictionary(frame, "ignore_regions_x")
                            ignore_regions_x = np.array(ignore_regions_x) if ignore_regions_x is not None else np.array([])
                            ignore_regions_y = ptService.safely_read_dictionary(frame, "ignore_regions_y")
                            ignore_regions_y = np.array(ignore_regions_y) if ignore_regions_y is not None else np.array([])
                            is_multiple = False

                            # If only one Ignore Region, do normal dstack
                            if len(ignore_regions_y.shape) > 1:
                                ignore_regions = np.dstack((ignore_regions_x, ignore_regions_y))[0] if \
                                    ignore_regions_y is not None else np.array([])
                            # If multiple Ignore Regions, dstack each pair separately
                            elif len(ignore_regions_y.shape) <= 1 and ignore_regions_y != []:
                                is_multiple = True
                                ir_temp = []
                                for i in range(ignore_regions_y.shape[0]):
                                    ir_temp.append(np.dstack((ignore_regions_x[i], ignore_regions_y[i]))[0] if
                                                   ignore_regions_y[i] is not None else np.array([]))

                                ignore_regions = np.array(ir_temp)
                            # If no Ignore Regions, just create an empty array and ignore the rest
                            else:
                                ignore_regions = np.array([])

                            # Initialise track_id as biggest possible and go downwards up to 40 ignore regions
                            track_id = 99   # TODO maybe this is not the best solution, increase to 3 digits?
                            # Do nothing if ignore regions is empty
                            # If only one Ignore Region, create it in the database
                            if not is_multiple and ignore_regions != []:
                                result = self.create_ignore_region(id_nr, track_id, ignore_regions, dataset, frame_nr)
                                if result == 'Error':
                                    return False, 'Error creating Ignore Region', 400
                                track_id -= 1
                            # If there are multiple Ignore Regions, go through them and create them all
                            elif is_multiple and ignore_regions != []:
                                for ir in ignore_regions:
                                    if len(ir) > 0:
                                        # Allow only up to 40 ignore regions
                                        if track_id < 60:
                                            print("Max number of IR reached")
                                            break
                                        result = self.create_ignore_region(id_nr, track_id, ir, dataset, frame_nr)
                                        if result == 'Error':
                                            return False, 'Error creating Ignore Region', 400
                                        track_id -= 1
                    final_result = final_result
            except FileNotFoundError:
                log.exception("Folder called " + str(data_type) + " not found")
        if final_result:
            return True, 'ok', 200
        else:
            return False, 'Error loading Ignore Regions', 400

    # Read Posetrack Pose information from annotations and load it into the db
    def load_pt_poses(self, dataset):
        final_result = True
        types = ["test", "train", "val"]
        for data_type in types:
            try:
                dirpath = os.path.join(dataset.dir + "_poses", data_type)
                print("Looking for ", dirpath)
                listdir = os.listdir(dirpath)
                for file in listdir:
                    filename, filextension = os.path.splitext(file)
                    if filextension == '.json':
                        # Read annotation file and create the ignore regions
                        print("Processing annotation file ", file)
                        # Read data from file
                        file_route = os.path.join(dirpath, file)
                        try:
                            with open(file_route) as json_file:
                                annotation = json.load(json_file)
                        except OSError:
                            log.exception('Could not read from file')
                            return False
                        # Load ignore regions into db
                        annotations_from_file = ptService.safely_read_dictionary(annotation, "annotations")
                        for obj in annotations_from_file:
                            id = int(obj["id"])
                            track_id = obj["track_id"]
                            id = id // 100
                            frame = id % 10000
                            id = id // 10000
                            video = ptService.pad(str(id % 1000000), 6)
                            # Transform array from [XYZXYZ+] to [[XYZ],[XYZ]+]
                            num_kp = len(obj["keypoints"])
                            if num_kp % 3 == 0: # Unformatted array
                                obj_list = np.array(obj["keypoints"]).reshape((num_kp // 3, 3))
                                obj_list = np.round(obj_list, 2).tolist()
                            elif num_kp == 17:  # Already formatted
                                obj_list = obj["keypoints"]
                            else:   # Invalid data
                                obj_list = []
                            update_obj = Object(obj["id"], "person", keypoints=obj_list,
                                                dataset_type="poseTrack", track_id=track_id, person_id=obj["person_id"])
                            update_annotation = Annotation(dataset, video, frame=frame,
                                                           objects=[update_obj])
                            # print(update_annotation)
                            annotationService.update_annotation_frame_object(update_annotation)
                            # exit()
                    final_result = final_result
            except FileNotFoundError:
                log.exception("Folder called " + str(data_type) + " not found")
        if final_result:
            return True, 'ok', 200
        else:
            return False, 'Error loading Ignore Regions', 400

    ## USE ONLY IN CASE OF ERROR UPLOADING FRAMES for AIK
    # Remove and insert new frames for one video and dataset
    def insert_frames(self, dataset, video):
        # Delete frames of selected dataset and camera
        result = frameManager.remove_frames_by_dataset_and_video(dataset, video)
        print('Result of deleting frames of dataset ', dataset.name, ' camera ', video, ': ', result)

        if result == 'Error':
            return False, 'Error deleting existing frames of dataset', 400

        # Add new frames
        result = frameService.add_frame_video_AIK(dataset, video)
        print('Result of adding new frames of dataset ', dataset.name, ' camera ', video, ': ', result)

        if result:
            return True, 'ok', 200
        else:
            return False, 'Error inserting new frames', 400
