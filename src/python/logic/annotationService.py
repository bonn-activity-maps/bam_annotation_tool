import logging
import numpy as np
import os, json, shutil

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectTypeManager import ObjectTypeManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.user_action_manager import UserActionManager

from python.logic.aikService import AIKService

from python.objects.frame import Frame
from python.objects.annotation import Annotation
from python.objects.object import Object
from python.objects.user_action import UserAction
from python.objects.object_type import Object_type


# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectTypeManager = ObjectTypeManager()
frameManager = FrameManager()
actionManager = ActionManager()
datasetManager = DatasetManager()
aikService = AIKService()
user_action_manager = UserActionManager()
video_manager = VideoManager()


class AnnotationService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the annotations

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

    def pad(self, num, size):
        s = str(num)
        while len(s) < size:
            s = "0" + s
        return s

    # def generate_new_original_uid(self, track_id, video, frame):
    #     frame = self.pad(frame, 4)
    #     track_id = self.pad(track_id, 2)
    #     return int("1" + video + frame + track_id)

    # Return 0 if no object in list
    # Return uid of object with track id and type specified in list obj_list
    def get_object_uid(self, obj_list, track_id, type):
        for obj in obj_list:
            if obj.track_id == track_id and obj.type == type:
                return obj.uid
        return 0

    # Get annotation info for given frame, dataset, video and user
    def get_annotation(self, annotation):
        result = annotationManager.get_annotation(annotation)
        if result == 'Error':
            return False, 'Error retrieving annotation', 400
        elif result == {}:
            return True, result, 200
        else:
            return True, result.to_json(), 200

    # Get annotation info for given frame range, dataset, video and user
    def get_annotations_by_frame_range(self, start_annotation, end_annotation):
        result = annotationManager.get_annotations_by_frame_range(start_annotation, end_annotation)
        if result == 'Error':
            return False, 'Error retrieving annotations', 400
        else:
            return True, result, 200

    # Get annotations (all frames) for given dataset
    def get_annotations(self, annotation):
        result = annotationManager.get_annotations(annotation)
        if result == 'Error':
            return False, 'Error retrieving annotations', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Get all annotated objects for dataset, scene and user
    def get_annotated_objects(self, annotation):
        result = annotationManager.get_annotated_objects(annotation)
        # print(result)
        if result == 'Error':
            return False, 'Error retrieving annotated objects', 400
        else:
            return True, result, 200

    # Return a list of folders (except dataset folders)
    def get_folders(self):
        list_dir = os.listdir(self.STORAGE_DIR)
        folders = []
        # List with dataset names
        dataset_names = [d.name for d in datasetManager.get_datasets()]

        for f in list_dir:
            f_path = os.path.join(self.STORAGE_DIR, f)
            if os.path.isdir(f_path) and f not in dataset_names:
                size = os.stat(f_path).st_size
                folders.append({
                    "name": f,
                    "size": self.convert_bytes(size)
                })
        return True, folders, 200

    # Triangulate points from 2D points to 3D
    # Always a single object in "objects" so always objects[0] !!
    def obtain_3d_points_AIK(self, annotation):
        # print(annotation)
        keypoints2d = annotation.objects[0].keypoints
        keypoints3d = []  # New 3d kps

        # Triangulate all keypoints of object
        for kp in keypoints2d:
            # Keypoints and camera parameters to triangulate
            keypoints_triangulate = []
            camera_params_triangulate = []

            points = kp["points"]
            cameras = kp["cameras"]
            # Add existing points to triangulate
            for i, p in enumerate(points):
                if points[i]:       # only if it's not empty
                    f = Frame(annotation.frame, cameras[i], annotation.dataset)
                    frame = frameManager.get_frame(f)
                    keypoints_triangulate.append(p)
                    camera_params_triangulate.append(frame.camera_parameters)

            if len(keypoints_triangulate) == 0:  # If 0 points, let the keypoint empty
                keypoints_triangulate.append([])
                camera_params_triangulate.append([])
                keypoints3d.append([])
            elif len(keypoints_triangulate) < 2:  # Error if only 1 point
                return annotation.objects, True
            else:  # Triangulate using all available points
                point3d = aikService.triangulate_2D_points(keypoints_triangulate, camera_params_triangulate)
                keypoints3d.append(point3d.tolist())  # Store 3d point

        # Modify original objects which contains info of object with calculated 3d keypoints
        return keypoints3d, False

    # Return the object with the 3d points for AIK datasets
    # Always a single object in "objects" so always objects[0] !!
    def update_annotation_AIK(self, annotation):

        # Triangulate points from 2D points to 3D if dataset is AIK
        keypoints_3d, error_flag = self.obtain_3d_points_AIK(annotation)

        # If the object is not a person -> we have to calculate 8 points for the box of object
        if annotation.objects[0].type != 'personAIK' and annotation.objects[0].type != 'poseAIK' and not error_flag:
            kp1, kp2, kp3 = np.asarray(keypoints_3d)
            keypoints_3d = aikService.create_box(kp1, kp2, kp3).tolist()
        return keypoints_3d, error_flag

    # Return 'ok' if the annotation has been updated
    def update_annotation(self, annotation):
        # Triangulate points from 2D points to 3D if dataset is AIK
        if annotation.dataset.is_aik():
            keypoints_3d, error_flag = self.update_annotation_AIK(annotation)

            if error_flag:
                return False, 'Error incorrect keypoints', 400

            annotation.objects[0].keypoints = keypoints_3d
            # Update only one object (all keypoints) in the annotation for concrete frame
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                return False, 'Error updating annotation', 400
            # else:
            #     return True, result, 200
        elif annotation.dataset.is_pt():
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                return False, 'Error updating annotation', 400

        # Create user action in db
        # user_action = UserAction(annotation.user, 'annotation', annotation.scene, annotation.dataset)
        # user_action_manager.create_user_action(user_action)
        return True, 'ok', 200

    # Return 'ok' if the annotation has been updated
    # Same as above but for PoseTrack

    # def update_annotation_PT(self, annotation):
    #     # keypoints = []
    #     # for point in points:
    #     #     keypoints.append(point["points"][0])
    #     # object["keypoints"] = keypoints
    #     # object["category_id"] = 1
    #     result = self.update_annotation_frame_object(annotation)
    #     if result == 'Error':
    #         return False, 'Error updating annotation', 400
    #     return True, 'Ok', 200

    # Return 'ok' if the annotation has been removed
    def remove_annotation(self, annotation):
        result = annotationManager.remove_annotation(annotation)
        if result == 'Error':
            return False, 'Error deleting annotation', 400
        else:
            return True, result, 200

    # # Return 'ok' if the validated flags have been updated properly in all cases
    # def updateValidation(self, req):
    #     # frames: [[1, 2, ..],[3,..], ...], validated: ["correct", "incorrect", ..]
    #     # Each validated flag corresponds to an array of frames (the same position)
    #     # All frames in an array have to be modified with its correspondent flag
    #     result = []
    #     for i, v in enumerate(req['validated']):
    #         result.append(
    #             annotationManager.updateValidation(req['dataset'], req['video'], req['frames'][i], req['user'], v))
    #
    #     # Return 'ok' only if all results are correct ('ok')
    #     if result.count(result[0]) == len(result) and result[0] == 'ok':
    #         return True, 'ok', 200
    #     else:
    #         return False, 'Error updating validated flag of annotation. Some flags could have not changed', 400

    # Return True if the person id specified is in use
    def is_person_id_in_use(self, dataset, person_id):
        result = annotationManager.is_person_id_in_use(dataset, person_id)
        if result == 'Error':
            return False, 'Error looking up person id', 400
        else:
            return True, result, 200

    # Return True if the objects with track id specified for the given video is updated correctly
    def update_person_id(self, video, track_id, new_person_id):
        result = annotationManager.update_person_id(video, track_id, new_person_id)
        if result == 'Error':
            return False, 'Error updating person id', 400
        else:
            return True, result, 200

    # Create a new person in a video for PT, precompute every annotation
    def create_person_pt(self, video):
        annotations = annotationManager.get_annotations(Annotation(video.dataset, video.name))
        max_track_id = 0
        # Find the highest track id in the video
        for obj in annotations[0].objects:
            max_track_id = obj.track_id if obj.track_id > max_track_id else max_track_id
        # Increase it to create the new person
        track_id = max_track_id + 1
        # Find the highest person_id in the dataset and increase it to create the new one.
        person_id = annotationManager.max_person_id(video.dataset) + 1
        for annotation in annotations:
            nr_id = 0
            for obj in annotation.objects:
                idobj = obj.uid % 100
                # print("idobj: ", idobj, " nr_id: ", nr_id)
                nr_id = idobj if idobj > nr_id else nr_id
            annotation.objects = [] # Reset objects to insert only new ones
            uid = "1" + annotation.scene + self.pad(str(annotation.frame), 4) + self.pad(str(nr_id + 1), 2)
            # For each of the types
            for objectType in ["bbox", "bbox_head", "person"]:
                new_obj = Object(uid, objectType, keypoints=[], dataset_type=self.pt,
                                 track_id=track_id, person_id=person_id)
                annotation.objects.append(new_obj)
            result = annotationManager.update_annotation_insert_objects(annotation)
            if result == 'Error':
                return False, 'Error updating annotation', 400
        return True, 'ok', 200

    # Return new uid for an object in annotations for a dataset to avoid duplicated uid objects
    def create_new_uid_object(self, annotation, object_type):
        max_uid = annotationManager.max_uid_object_dataset(annotation.dataset)

        if max_uid == 'Error':
            return False, 'Error getting max uid object for dataset in db', 400
        else:
            # Create new object with max_uid+1
            new_uid = max_uid + 1
            annotation.objects = [Object(new_uid, object_type, [], annotation.dataset.type)]
            result = annotationManager.create_frame_object(annotation)

            if result == 'Error':
                return False, 'Error creating new object in annotation', 400
            else:
                return True, {'maxUid': new_uid}, 200

    # Get annotation of object in frame
    def get_annotation_frame_object(self, start_annotation, end_annotation):
        result = annotationManager.get_object_in_frames(start_annotation, end_annotation)
        if result == 'Error':
            return False, 'The object does not exist in frames', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Store annotation for an object for given frame, dataset, video and user
    # Always a single object in "objects" so always objects[0] !!
    # If the object does not exist, it's stored in db
    def update_annotation_frame_object(self, annotation):
        # Check if exists object in frame
        found = annotationManager.get_frame_object(annotation)
        if found == 'Error':
            return 'Error'
        elif found == 'No annotation':  # Add new existing object in frame
            result = annotationManager.create_frame_object(annotation)
        else:  # Update object in frame
            # if annotation.dataset.is_pt() and found.type != annotation.objects[0].type:
            if found.type != annotation.objects[0].type:
                result = annotationManager.create_frame_object(annotation)
            else:
                result = annotationManager.update_frame_object(annotation)

        return result

    # Update only one label with final_kpts in annotation for an object for given frame, dataset, video and user,
    # Always a single object in "objects" so always objects[0] !!
    # If the object does not exist, it's stored in db
    # The annotation.objects[0].keypoints should contain a list with empty keypoints
    def update_annotation_frame_object_label(self, annotation, label, final_kpts):
        # Check if exists object in frame
        found = annotationManager.get_frame_object(annotation)
        print("found: ",found)
        if found == 'Error':
            return 'Error'
        elif found == 'No annotation':  # Add new existing object in frame
            annotation.objects[0].keypoints[label] = final_kpts
            result = annotationManager.create_frame_object(annotation)
        else:  # Update object in frame
            found.keypoints[label] = final_kpts
            annotation.objects = [found]
            result = annotationManager.update_frame_object(annotation)
        return result

    # Remove annotation for an object for given frame, dataset, video and user
    # Always a single object in "objects" so always objects[0] !!
    def remove_annotation_frame_object(self, start_annotation, end_annotation):
        result = annotationManager.remove_frame_object(start_annotation, end_annotation)
        if result == 'ok':
            return True, result, 200
        else:
            return False, 'Error deleting annotation', 500

    # Interpolate all keypoints between 2 points
    def interpolate(self, num_frames, num_kpts, kp_dim, kps1, kps2):
        # Interpolate for all keypoints in all frames in between
        interpolated_kps = []
        for i in range(num_kpts):
            if len(kps1[i]) != 0 and len(kps2[i]) != 0: # If one of the two points is empty -> Not interpolate
                interpolated_coords = np.linspace(np.array(kps1[i]), np.array(kps2[i]), num=num_frames).tolist()
                interpolated_kps.append(interpolated_coords)
            else:
                empty = []
                for i in range(num_frames):
                    empty.append([])
                interpolated_kps.append(empty)

        final_kps = []
        for i in range(num_frames):
            frame = []
            for j in range(num_kpts):
                if not interpolated_kps[j][i]:
                    frame.append([])
                else:
                    frame.append(interpolated_kps[j][i])
            final_kps.append(frame)

        return final_kps

    # Interpolate and store the interpolated 3d points
    # Always a single object in "objects" so always objects[0] !!
    def interpolate_annotation(self, dataset, start_annotation, end_annotation, object2):
        annotations_in_range = []
        # Search object in respective start and end frames
        if dataset.is_pt():
            start_annotation.objects = [object2]
            # print("start annotation objects", object2)
            annotations_in_range = annotationManager.get_object_in_frames(start_annotation, end_annotation)

        obj1 = annotationManager.get_frame_object(start_annotation)
        obj2 = annotationManager.get_frame_object(end_annotation)
        type = obj1.type
        kps1 = obj1.keypoints
        kps2 = obj2.keypoints

        num_frames = end_annotation.frame - start_annotation.frame + 1
        num_kpts = len(kps1)
        final_result = 'ok'

        # Final keypoints
        final_kpts = self.interpolate(num_frames, num_kpts, dataset.keypoint_dim, kps1, kps2)
        # print("annotations in range", len(annotations_in_range))
        # print(annotations_in_range)
        # Store interpolated keypoints for frames in between (avoid start and end frame)
        for i in range(1, len(final_kpts) - 1):
            if dataset.is_pt():
                # new_uid = self.generate_new_original_uid(abs(start_annotation.objects[0].uid) % 100, start_annotation.scene, start_annotation.frame + i)
                new_uid = annotations_in_range[i].objects[0].uid
                obj = Object(new_uid, type, final_kpts[i], dataset_type=dataset.type,
                             track_id=annotations_in_range[i].objects[0].track_id)
                annotation = Annotation(dataset, start_annotation.scene, start_annotation.frame + i,
                                        start_annotation.user, [obj])
            else:
                obj = Object(start_annotation.objects[0].uid, type, final_kpts[i], dataset_type=dataset.type)
                annotation = Annotation(dataset, start_annotation.scene, start_annotation.frame + i,
                                        start_annotation.user, [obj])
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                final_result = 'There was some error interpolating the keypoints, please check them'

        if final_result == 'ok':
            return True, final_result, 200
        else:
            log.error('Error interpolating keypoints')
            return False, final_result, 500

    # Interpolate and store the interpolated 3d points
    # Always a single object in "objects" so always objects[0] !!
    # startFrame is an array with the frame of each label
    def interpolate_annotation_labels_aik(self, dataset, scene, user, uid_object, object_type, start_frames, end_frame):
        object_type = objectTypeManager.get_object_type(Object_type(object_type, dataset.type))
        empty_kpts = [[] for i in range(object_type.num_keypoints)]

        # Get end/last object
        obj = Object(uid_object, object_type.type, dataset_type=dataset.type)
        end_annotation = Annotation(dataset, scene, end_frame, user, [obj])
        end_obj = annotationManager.get_frame_object(end_annotation)
        # print("end_obj: ",end_obj)

        # Check num start_frames == num keypoints in object type
        # assert len(start_frames) == object_type.num_keypoints, "Number of start frames should be equal to the number of labels"

        # Interpolate for each label
        final_result = 'ok'
        for label, frame in enumerate(start_frames):
            # print('label: ', label)
            # print('frame: ', frame)
            if frame != -1:         # if f=-1 --> no annotation available for that label
                start_obj = annotationManager.get_frame_object(Annotation(dataset, scene, frame, user, [obj]))
                num_frames = end_frame - frame + 1
                # print('num_frames: ', num_frames)

                # Interpolate keypoint for label between frame and end_frame
                final_kpts = self.interpolate(num_frames, 1, dataset.keypoint_dim, [start_obj.keypoints[label]], [end_obj.keypoints[label]])
                # print('final_kpts: ', final_kpts)

                # Update keypoints in all frames for label
                for i in range(1, len(final_kpts) - 1):
                    interpolated_empty_obj = Object(uid_object, object_type.type, empty_kpts, dataset_type=dataset.type)
                    annotation = Annotation(dataset, scene, frame+i, user, [interpolated_empty_obj])
                    result = self.update_annotation_frame_object_label(annotation, label, final_kpts[i][0])
                    if result == 'Error':
                        final_result = 'There was some error interpolating the keypoints, please check them'

        if final_result == 'ok':
            return True, final_result, 200
        else:
            log.error('Error interpolating keypoints')
            return False, final_result, 500

    # Upload new annotations to an existing dataset
    def upload_annotations(self, dataset, folder):
        if dataset.is_aik():
            result = self.upload_annotations_aik(dataset, folder)
        elif dataset.is_pt():
            result = False
        else:
            result = False

        if not result:
            log.error('Error uploading annotations to dataset.')
            return False, 'Error uploading annotations. Please try to upload the annotations again', 400
        else:
            return True, 'Annotations uploaded successfully', 200

    # Upload new annotations to an existing dataset
    # Replace old annotations if they already exist
    def upload_annotations_aik(self, dataset, folder):
        folder_path = os.path.join(dataset.STORAGE_DIR, folder)
        annotations_file = os.path.join(folder_path, 'persons2poses.json')

        obj_type = 'poseAIK'             # Type of objects
        final_result = True

        # Read data from file
        try:
            with open(annotations_file) as json_file:
                poses = json.load(json_file)
        except OSError:
            log.exception('Could not read from file')
            return False

        # Transform annotation to our format and store in db
        for i, p in enumerate(poses):
            kps = p['pose']
            # Replace empty keypoints with empty list
            keypoints = [[] if kp is None else kp for kp in kps]
            object = [Object(p['pid'], obj_type, keypoints, dataset.type)]
            annotation = Annotation(dataset, dataset.name, p['frame'], 'root', object)
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                final_result = False   # finalResult False if there is some problem

        # Remove folder with annotations
        shutil.rmtree(folder_path)
        return final_result

    # Add annotation of objects to database from annotations_file
    # Return true if all annotation have been updated, False if has been some problem
    def add_annotations_AIK(self, dataset, annotations_file):
        obj_type = 'poseAIK'             # Type of objects
        final_result = True

        # Read data from file
        try:
            with open(annotations_file) as json_file:
                poses = json.load(json_file)
        except OSError:
            log.exception('Could not read from file')
            return False

        # Transform annotation to our format and store in db
        for i, p in enumerate(poses):
            kps = p['pose']
            # Replace empty keypoints with empty list
            keypoints = [[] if kp is None else kp for kp in kps]
            object = [Object(p['pid'], obj_type, keypoints, dataset.type)]
            annotation = Annotation(dataset, dataset.name, p['frame'], 'root', object)
            result = annotationManager.update_annotation_insert_objects(annotation)
            if result == 'Error':
                final_result = False    # finalResult False if there is some problem
        return final_result

    # Transfer pose to another person in one frame.
    # If this person already has a pose they are swapped
    def transfer_object(self, dataset, old_annotation, new_annotation):
        if dataset.is_aik():
            old_object = annotationManager.get_frame_object(old_annotation)     # Get annotation of old uid
            new_object = annotationManager.get_frame_object(new_annotation)     # Get annotation of new uid

            # There is no object
            if old_object == 'No annotation' and new_annotation == 'No annotation':
                return False, 'No object to transfer', 400

            # If new uid doesn't have any data --> Remove old annotation and create the new one with new uid
            elif new_object == 'No annotation':
                remove_result = annotationManager.remove_frame_object(old_annotation, old_annotation)
                if remove_result == 'Error':
                    return False, 'Error transfering object', 400
                else:
                    # Change uid for the new one
                    # old_object.uid = new_annotation.objects[0].uid
                    # new_annotation.objects = [old_object]
                    old_annotation.objects[0].uid = new_annotation.objects[0].uid
                    create_result = annotationManager.update_frame_object(old_annotation)
                    if create_result == 'Error':
                        return False, 'Error transfering object', 400
            # Swap annotations for corresponding uids
            else:
                old_uid = old_object.uid
                old_object.uid = new_object.uid
                new_object.uid = old_uid
                old_annotation.objects = [old_object]
                new_annotation.objects = [new_object]
                update_old_result = annotationManager.update_frame_object(old_annotation)
                if update_old_result == 'Error':
                    return False, 'Error transfering object', 400
                else:
                    update_new_result = annotationManager.update_frame_object(new_annotation)
                    if update_new_result == 'Error':
                        return False, 'Error transfering object', 400
            return True, 'Object transferred successfully', 200
        else:
            return False, 'Operation not allowed', 400