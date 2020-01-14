import os, subprocess, json, shutil
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
    aik = 'actionInKitchen'
    pt = 'poseTrack'

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
        if dataset.type == self.pt:
            # integrity = self.check_integrity_PT(dataset.dir)
            integrity = True
        elif dataset.type == self.aik:
            integrity = self.check_integrity_AIK(dataset.dir)
        else:
            integrity = False

        # Remove zip file
        #TODO enable it again once pt fixed
        if dataset.type == self.aik:
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
        if dataset.type == self.aik:
            result = self.add_info_AIK(dataset)
        elif dataset.type == self.pt:
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
        result_annotations = self.readAnnotationsPT(dataset)
        if result_videos == 'Error' or result_annotations == 'Error':
            return False, 'Error saving videos in database', 400
        else:
            return True, 'ok', 200

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if it encounters some problem
    def readAnnotationsPT(self, dataset):
        # print("annotationsPT")
        # type = 'personPT'  # Type of objects
        finalResult = True
        types = ["test", "train", "val"]
        for type in types:
            try:
                dirpath = os.path.join(dataset.dir, "annotations/" + type)
                listdir = os.listdir(dirpath)
                for file in listdir:
                    filename, filextension = os.path.splitext(file)
                    if filextension == '.json':
                        tempResult = self.processAnnotationFilePT(dataset.name, file, dirpath)
                    finalResult = finalResult   # and tempResult # TODO check in the future
            except FileNotFoundError:
                # TODO Check if this is still the case in the future...
                log.exception("Folder called " + str(type) + " not found")
        return 'ok' if finalResult else 'Error'

    # Process one file entirely from JSON to our DB, including images, categories and anotations info.
    def processAnnotationFilePT(self, dataset, file, dir):
        print("Processing annotation file ", file, " from ", dir)
        # Read data from file
        fileRoute = os.path.join(dir, file)
        try:
            with open(fileRoute) as jsonFile:
                annotation = json.load(jsonFile)
        except OSError:
            log.exception('Could not read from file')
            return False

        # Transform annotation to our format and store in db
        frames = ptService.safely_read_dictionary(annotation, "images")
        categories = ptService.safely_read_dictionary(annotation, "categories")
        annotations = ptService.safely_read_dictionary(annotation, "annotations")

        try:
            resultCategories = self.add_categories_PT(categories) if categories is not None else True
        except:
            log.exception("Error while processing Categories")
            resultCategories = True
        try:
            resultFrames = frameService.add_frames_PT(dataset, frames) if frames is not None else True
        except:
            log.exception("Error while processing Frames")
            resultFrames = True
        try:
            resultAnnotations = self.addAnnotationsPT(dataset, annotations) if annotations is not None else True
        except:
            log.exception("Error while processing Annotations")
            resultAnnotations = True

        return resultFrames and resultAnnotations and resultCategories

    def addAnnotationsPT(self, dataset, annotations):

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
                object_bbox_head = {
                    "uid": id,
                    "type": "bbox_head",
                    "keypoints": ptService.transform_to_XYXY(bbox_head_keypoints),
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_bbox_head)     # Append new object
            except:
                log.exception("Error reading bbox_head")
            try:
                bbox = ptService.safely_read_dictionary(annotation, "bbox")
                bbox_keypoints = [[bbox[0], bbox[1]],
                                  [bbox[2], bbox[3]]]
                object_bbox = {
                    "uid": id,
                    "type": "bbox",
                    "keypoints": ptService.transform_to_XYXY(bbox_keypoints),
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_bbox)          # Append new object
            except:
                log.exception("Error reading bbox")
            keypoints = ptService.safely_read_dictionary(annotation, "keypoints")
            person_keypoints = []   # Keypoints of the skeleton, ordered
            # Create array of 3d keypoints (z = visibility)
            try:
                for i in range(0, len(keypoints), 3):
                    person_keypoints.append([keypoints[i], keypoints[i+1], keypoints[i+2]])
                object_person = {
                    "uid": id,
                    "type": "person",
                    "keypoints": person_keypoints,
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_person)        # Append new object
            except:
                log.exception("Error reading person")

            # Update annotation with the resulting objects
            result = annotationService.update_annotation(dataset, self.pt, og_frame["video"], og_frame["number"], "root",
                                                        og_objects)
            if result == 'error':
                return False
        return True

    def add_categories_PT(self, categories):
        # Categories
        for cat in categories:
            type = ptService.safely_read_dictionary(cat, "name")
            labels = ptService.safely_read_dictionary(cat, "keypoints")
            supercategory = ptService.safely_read_dictionary(cat, "supercategory")
            id = ptService.safely_read_dictionary(cat, "id")
            skeleton = ptService.safely_read_dictionary(cat, "skeleton")
            object_type = Object_type(type, self.pt, labels=labels, supercategory=supercategory, id=id, skeleton=skeleton)
            result = objectTypeService.create_object_type(object_type)
            if result == 'error':
                return False

        # Ignore Regions
        object_type = Object_type("ignore_region", self.pt, is_polygon=True)
        result = objectTypeService.create_object_type(object_type)
        if result == 'error':
            return False

        # Bbox
        labels = ["Top Left", "Bottom Right"]
        object_type = Object_type("bbox", self.pt, labels=labels, is_polygon=False)
        result = objectTypeService.create_object_type(object_type)
        if result == 'error':
            return False

        # Bbox head
        labels = ["Top Left", "Bottom Right"]
        object_type = Object_type("bbox_head", self.pt, labels=labels, is_polygon=False)
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
        dir_poses = dir + "/poses"
        file_dataset = dir + "/dataset.json"

        # Check dirs and files
        is_dir = os.path.isdir(dir)
        has_cameras = os.path.isdir(dir_cameras)
        has_videos = os.path.isdir(dir_videos)
        has_poses = os.path.isdir(dir_poses)
        has_dataset = os.path.isfile(file_dataset)

        try:
            has_consistency = self.check_integrity_of_annotations(dir_cameras, dir_videos+"/")

            return is_dir and has_cameras and has_videos and has_poses and has_dataset and has_consistency
        except:
            log.exception('Error checking integrity of zip')
            return False

    # Store info of AIK datasets: videos, annotations and camera params by frame
    def add_info_AIK(self, dataset):
        # Directories for AIK datasets
        videos_dir = os.path.join(dataset.dir, 'videos/')
        annotations_dir = os.path.join(dataset.dir, 'poses/')

        # Store info in DB
        result_videos = videoService.add_videos_AIK(dataset, videos_dir)
        result_cameras = frameService.add_frame_AIK(dataset)
        result_annotations = annotationService.add_annotations_AIK(dataset, annotations_dir)

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
        if dataset.type == self.aik:
            result = self.export_dataset_AIK(dataset)
        elif dataset.type == self.pt:
            result = self.export_dataset_PT(dataset)
        else:
            result = 'Incorrect dataset type'
        return True, result, 200

    def is_track_id_on_list(self, lst, uid, track_id):
        for i in range(0, len(lst)):
            if lst[i]["id"] == uid and lst[i]["track_id"] == track_id:
                return i
        return -1

    # Export annotation file for PT datasets to a file for a given dataset
    def export_dataset_PT(self, dataset):
        videos = videoManager.get_videos(dataset)
        for j in range(0, len(videos)):
            final_annotation = dict()
            # Process frame data
            _, frames, _ = frameService.get_frames(videos[j]["name"], dataset)
            for i in range(0, len(frames)): #TODO ignore regions
                frames[i]["vid_id"] = frames[i]["video"]
                frames[i]["file_name"] = '/'.join((frames[i]["path"]).split("/")[4:-1])
                del(frames[i]["number"])
                del(frames[i]["dataset"])
                del(frames[i]["video"])
                del(frames[i]["path"])
                del(frames[i]["has_ignore_regions"])
            final_annotation["images"] = frames
            # Process annotation data
            _, annotations_db, _ = annotationService.get_annotations(dataset, self.pt, videos[j]["name"], "root")
            annotations_file = list()
            for i in range(0, len(annotations_db)):
                objects = annotations_db[i]["objects"]
                for obj in objects:
                    index = self.is_track_id_on_list(annotations_file, obj["uid"], obj["track_id"])
                    # If not already an annotation
                    if index == -1:
                        if obj["type"] == "bbox":
                            obj["bbox"] = ptService.transform_to_XYWH(obj["keypoints"])
                            del(obj["keypoints"])
                        elif obj["type"] == "bbox_head":
                            obj["bbox_head"] = ptService.transform_to_XYWH(obj["keypoints"])
                            del(obj["keypoints"])
                        else:   # else is person , so flatten keypoints array
                            obj["keypoints"] = np.array(obj["keypoints"]).flatten().tolist()
                        # Always delete type field, as it is unnecessary
                        del(obj["type"])
                        obj["id"] = obj["uid"]
                        del(obj["uid"])
                        obj["image_id"] = int(obj["id"]/100)
                        obj["scores"] = []
                        annotations_file.append(obj)
                    else:   # If already in annotation, just add what we want
                        if obj["type"] == "bbox":
                            annotations_file[index]["bbox"] = ptService.transform_to_XYWH(obj["keypoints"])
                        elif obj["type"] == "bbox_head":
                            annotations_file[index]["bbox_head"] = ptService.transform_to_XYWH(obj["keypoints"])
                        elif obj["type"] == "person":
                            annotations_file[index]["keypoints"] = np.array(obj["keypoints"]).flatten().tolist()
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
            path = os.path.join(dataset.STORAGE_DIR + dataset + "_export", videos[j]["type"])
            # Get file name from original path name
            try:
                file = os.path.join(path, frames[0]["file_name"].split("/")[-1] + '.json')
                if not os.path.exists(path):
                    os.makedirs(path)
                with open(file, 'w') as outfile:
                    json.dump(final_annotation, outfile)
            except:
                print("Empty video")
        return 'ok'

    # Export annotation for AIK datasets to a file for given dataset
    def export_dataset_AIK(self, dataset):
        db_objects = annotationManager.get_objects_by_dataset(dataset)
        actions = actionManager.get_actions_by_dataset_export(dataset)

        if db_objects == 'Error' or actions == 'Error':
            return False, 'Error getting annotations for the dataset', 400
        else:
            # TODO: Create the mean of all annotations
            final_annotation = self.build_annotation_AIK(db_objects, actions)

        # Write to file in same directory of dataset
        file = os.path.join(dataset.STORAGE_DIR, dataset.name + '.json')
        with open(file, 'w') as outfile:
            json.dump(final_annotation, outfile)

        return 'ok'

    # Build correct annotation using recover data from database
    def build_annotation_AIK(self, db_objects, actions):
        persons = []
        objects = []

        for annotation in db_objects:    # Each annotation
            frame_persons = []
            frame_objects = []
            for obj in annotation['objects']:     # Each object in annotation
                if obj['type'] == 'personAIK':
                    p = {"pid": obj['uid'],
                         "location": obj['keypoints']}
                    frame_persons.append(p)
                else:
                    o = {"labels": obj['labels'],
                         "location": obj['keypoints'],
                         "oid": obj['uid']}
                    frame_objects.append(o)

            # Build persons and objects jsons and add to list
            persons_json = {"frame": annotation['frame'],
                           "persons": frame_persons}
            objects_json = {"frame": annotation['frame'],
                           "objects": frame_objects}
            persons.append(persons_json)
            objects.append(objects_json)

        # Build final annotation
        final_annotation = {
            "persons": persons,
            "objects": objects,
            "actions": actions
        }
        return final_annotation

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
