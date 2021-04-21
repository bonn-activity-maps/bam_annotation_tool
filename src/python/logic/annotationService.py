import logging
import numpy as np
import os, json, shutil
import copy

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectTypeManager import ObjectTypeManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.user_action_manager import UserActionManager
from python.infrastructure.pose_property_manager import PosePropertyManager

from python.logic.aikService import AIKService
from python.logic.ptService import PTService

from python.objects.frame import Frame
from python.objects.video import Video
from python.objects.annotation import Annotation
from python.objects.object import Object
from python.objects.user_action import UserAction
from python.objects.object_type import Object_type
from python.objects.pose_property import PoseProperty

import numbers

# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectTypeManager = ObjectTypeManager()
frameManager = FrameManager()
actionManager = ActionManager()
videoManager = VideoManager()
datasetManager = DatasetManager()
aikService = AIKService()
ptService = PTService()
user_action_manager = UserActionManager()
video_manager = VideoManager()
pose_property_manager = PosePropertyManager()


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
            if start_annotation.dataset.is_aik():
                for annotation in result:
                    for obj in annotation['objects']:
                        if obj['type'] == 'boxAIK' and obj['keypoints']:
                            a, b, c = obj['keypoints']
                            obj['keypoints'] = aikService.create_box(np.array(a), np.array(b), np.array(c)).tolist()
                        elif obj['type'] == 'cylinderAIK' and obj['keypoints']:
                            a, b = obj['keypoints']
                            obj['keypoints'] = aikService.create_cylinder(np.array(a), np.array(b)).tolist()

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
        return keypoints_3d, error_flag

    # Calculate mean in z (heigth) between 0 and 1
    def calculate_boxes_axis_aligned(self, keypoints_3d):
        kp0, kp1, kp2 = keypoints_3d
        z = (kp0[2] + kp1[2]) / 2
        kp0[2] = z
        kp1[2] = z
        return [kp0, kp1, kp2]

    # Return 'ok' if the annotation has been updated
    def update_annotation(self, annotation):
        # Triangulate points from 2D points to 3D if dataset is AIK
        if annotation.dataset.is_aik():
            keypoints_3d, error_flag = self.update_annotation_AIK(annotation)
            if error_flag:
                return False, 'Error incorrect keypoints', 400

            # Calculate mean if it's a complete box --> Boxes axis-aligned
            if annotation.objects[0].type == 'boxAIK' and len(keypoints_3d) == 3:
                if keypoints_3d[0] and keypoints_3d[1] and keypoints_3d[2]:
                    keypoints_3d = self.calculate_boxes_axis_aligned(keypoints_3d)
                else:
                    return False, 'All labels must be annotated in order to update BoxAIK objects!', 400

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
        user_action = UserAction(annotation.user, 'annotation', annotation.scene, annotation.dataset)
        user_action_manager.create_user_action(user_action)
        return True, 'ok', 200

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

    # Return True if the objects with track id specified for the given video is updated correctly with a new person id
    def update_person_id(self, video, track_id, new_person_id, user):
        # Create user action in db
        user_action = UserAction(user, 'person id', video.name, video.dataset)
        user_action_manager.create_user_action(user_action)

        result = annotationManager.update_person_id(video, track_id, new_person_id)
        if result == 'Error':
            return False, 'Error updating person id', 400
        else:
            return True, result, 200

    # Return True if the object with track id specified for the given frame in the given video is updated correctly
    def update_track_id(self, video, track_id, new_track_id, user, obj_type, frame_start, frame_end):
        # Create user action in db
        user_action = UserAction(user, 'track id', video.name, video.dataset)
        user_action_manager.create_user_action(user_action)
        # Swap track ids TODO swap uid too?
        error = False
        for frame in range(frame_start, frame_end + 1):
            result = annotationManager.update_track_id(video, track_id, 100, frame, obj_type)
            result2 = annotationManager.update_track_id(video, new_track_id, track_id, frame, obj_type)
            result3 = annotationManager.update_track_id(video, 100, new_track_id, frame, obj_type)
            if result == 'Error' or result2 == 'Error' or result3 == 'Error':
                error = True
        if error:
            return False, 'Error updating track id', 400
        else:
            return True, "OK", 200

    # Create a new person in a video for PT, precompute every annotation
    def create_person_pt(self, video):
        annotations = annotationManager.get_annotations(Annotation(video.dataset, video.name))
        max_track_id = 0
        # Find the highest track id in the video
        for obj in annotations[0].objects:
            if obj.type != "ignore_region":
                max_track_id = obj.track_id if obj.track_id > max_track_id else max_track_id
        # Increase it to create the new person
        track_id = max_track_id + 1
        # Find the highest person_id in the dataset and increase it to create the new one.
        person_id = annotationManager.max_person_id(video.dataset) + 1
        for annotation in annotations:
            nr_id = 0
            for obj in annotation.objects:
                if obj.type != "ignore_region":
                    idobj = obj.uid % 100
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

    # Create a new person in a video for PT, precompute every annotation
    def create_ignore_region(self, video, min_ir_track_id):
        annotations = annotationManager.get_annotations(Annotation(video.dataset, video.name))
        # Increase it to create the new person
        track_id = min_ir_track_id - 1
        # Find the highest person_id in the dataset and increase it to create the new one.
        for annotation in annotations:
            annotation.objects = [] # Reset objects to insert only new ones
            uid = "1" + annotation.scene + self.pad(str(annotation.frame), 4) + self.pad(track_id, 2)
            # For each of the types
            new_obj = Object(uid, "ignore_region", keypoints=[], dataset_type=self.pt,
                             track_id=track_id)
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

        # Create new object with max_uid+1
        new_uid = max_uid + 1
        annotation.objects = [Object(new_uid, object_type, [], annotation.dataset.type)]
        result = annotationManager.create_frame_object(annotation)

        if result == 'Error':
            return False, 'Error creating new object in annotation', 400

        # Create new pose property for the new pose
        if object_type == 'poseAIK':
            pose_property = PoseProperty(annotation.dataset, annotation.scene, object_type, new_uid, -1, -1, -1, -1)
            result = pose_property_manager.update_pose_property(pose_property)
            if result == 'Error':
                return False, 'Error creating new pose property', 400

        return True, {'maxUid': new_uid}, 200

    # Get annotation of object in frame
    def get_annotation_frame_object(self, start_annotation, end_annotation):
        result = annotationManager.get_object_in_frames(start_annotation, end_annotation)
        if result == 'Error':
            return False, 'The object does not exist in frames', 400
        else:
            if start_annotation.dataset.is_aik():
                for annotation in result:
                    for obj in annotation.objects:
                        if obj.type == 'boxAIK' and obj.keypoints:
                            a, b, c = obj.keypoints
                            obj.keypoints = aikService.create_box(np.array(a), np.array(b), np.array(c)).tolist()
                        elif obj.type == 'cylinderAIK' and obj.keypoints:
                            a, b = obj.keypoints
                            obj.keypoints = aikService.create_cylinder(np.array(a), np.array(b)).tolist()
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
        if found == 'Error':
            return 'Error'
        elif found == 'No annotation':  # Add new existing object in frame
            annotation.objects[0].keypoints[label] = final_kpts
            result = annotationManager.create_frame_object(annotation)
        else:  # Update object in frame
            if not found.keypoints:     # if array is empty --> keypoints will be empty (as in annotation)
                found.keypoints = annotation.objects[0].keypoints
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

    # Remove label in annotation for an object for given range of frames, dataset, video and user
    # Always a single object in "objects" so always objects[0] !!
    def remove_annotation_frame_object_label(self, annotation, start_frame, end_frame, object_type, label):
        if annotation.dataset.is_pt():
            return False, 'Operation not allowed', 400
        else:
            object_type = objectTypeManager.get_object_type(Object_type(object_type, annotation.dataset.type))
            empty_kpts = [[] for i in range(object_type.num_keypoints)]

            for f in range(start_frame, end_frame+1):
                annotation.frame = f
                annotation.objects[0].keypoints = empty_kpts
                result = self.update_annotation_frame_object_label(annotation, label, [])
                if result == 'Error':
                    return False, 'Error deleting label in annotations', 500
            return True, 'ok', 200

    # Interpolate all keypoints between 2 points
    def interpolate(self, num_frames, num_kpts, kp_dim, kps1, kps2, obj_type):
        kps1, kps2 = np.array(kps1), np.array(kps2)
        # Interpolate for all keypoints in all frames in between
        interpolated_kps = []
        for i in range(num_kpts):
            # If one of the two points is empty -> Do not interpolate
            # If not person, check if point is empty (size = 0).
            if obj_type != 'person' and kps1[i].size != 0 and kps2[i].size != 0:
                interpolated_coords = np.linspace(kps1[i], kps2[i], num=num_frames)
                interpolated_coords = np.round(interpolated_coords, 2).tolist()
                interpolated_kps.append(interpolated_coords)
            # If person, interpolate only if both points are annotated.
            elif obj_type == 'person' and (kps1[i] > 0).all() and (kps2[i] > 0).all():
                interpolated_coords = np.linspace(kps1[i], kps2[i], num=num_frames)
                interpolated_coords = np.round(interpolated_coords, 2).tolist()
                # If it's person, set the third coordinate (visibility) to either 0 or 1
                for frame in range(num_frames):
                    # Round interpolated float to closest integer
                    interpolated_coords[frame][2] = np.rint(interpolated_coords[frame][2])
                interpolated_kps.append(interpolated_coords)
            # If person and one of the points empty, insert [0, 0, 0].
            elif obj_type == 'person' and not ((kps1 > 0).all() and (kps2 > 0).all()):
                empty = []
                for frame in range(num_frames):
                    empty.append([0, 0, 0])
                interpolated_kps.append(empty)
            # If not person and one of the points empty, insert empty array [].
            else:
                empty = []
                for frame in range(num_frames):
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
        final_kpts = self.interpolate(num_frames, num_kpts, dataset.keypoint_dim, kps1, kps2, type)
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
                obj = Object(start_annotation.objects[0].uid, type, final_kpts[i], dataset_type=dataset.type, labels=obj1.labels)
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
        interpolated_empty_obj = Object(uid_object, object_type.type, empty_kpts, dataset_type=dataset.type)

        # Get end/last object
        obj = Object(uid_object, object_type.type, dataset_type=dataset.type)
        end_annotation = Annotation(dataset, scene, end_frame, user, [obj])
        end_obj = annotationManager.get_frame_object(end_annotation)

        # Check num start_frames == num keypoints in object type
        # assert len(start_frames) == object_type.num_keypoints, "Number of start frames should be equal to the number of labels"

        # Interpolate for each label
        final_result = 'ok'
        for label, frame in enumerate(start_frames):
            # NOT interpolate if f=-1 --> no annotation available for that label
            # or the frames are consecutive
            if frame != -1 and (end_frame - frame > 1):
                start_obj = annotationManager.get_frame_object(Annotation(dataset, scene, frame, user, [obj]))
                num_frames = end_frame - frame + 1

                # Interpolate keypoint for label between frame and end_frame
                final_kpts = self.interpolate(num_frames, 1, dataset.keypoint_dim, [start_obj.keypoints[label]], [end_obj.keypoints[label]])

                # Update keypoints in all frames for label
                for i in range(1, len(final_kpts) - 1):
                    annotation = Annotation(dataset, scene, frame+i, user, [interpolated_empty_obj])
                    result = self.update_annotation_frame_object_label(copy.deepcopy(annotation), label, final_kpts[i][0])
                    if result == 'Error':
                        final_result = 'There was some error interpolating the keypoints, please check them'

        if final_result == 'ok':
            return True, final_result, 200
        else:
            log.error('Error interpolating keypoints')
            return False, final_result, 500

    # Autocomplete and store the completed 3d points for each label depending on start frames
    # Always a single object in "objects" so always objects[0] !!
    # startFrame is an array with the frame of each label
    def autocomplete_annotation(self, dataset, scene, user, uid_object, object_type, start_frames, end_frame):
        object_type = objectTypeManager.get_object_type(Object_type(object_type, dataset.type))
        empty_kpts = [[] for i in range(object_type.num_keypoints)]
        empty_obj = Object(uid_object, object_type.type, empty_kpts, dataset_type=dataset.type)
        obj = Object(uid_object, object_type.type, dataset_type=dataset.type)

        # Check num start_frames == num keypoints in object type
        # assert len(start_frames) == object_type.num_keypoints, "Number of start frames should be equal to the number of labels"

        # Copy the annotation for each label
        final_result = 'ok'
        for label, frame in enumerate(start_frames):
            if frame != -1:         # if f=-1 --> no annotation available for that label
                start_obj = annotationManager.get_frame_object(Annotation(dataset, scene, frame, user, [obj]))
                num_frames = end_frame - frame
                kp_to_copy = start_obj.keypoints[label]

                # Update keypoints in all range of frames for label
                for i in range(1, num_frames+1):
                    annotation = Annotation(dataset, scene, frame+i, user, [empty_obj])
                    result = self.update_annotation_frame_object_label(copy.deepcopy(annotation), label, kp_to_copy)
                    if result == 'Error':
                        final_result = 'There was some error filling in the keypoints, please check them'

        if final_result == 'ok':
            return True, final_result, 200
        else:
            log.error('Error filling in keypoints')
            return False, final_result, 500

    # Run a sanity check to check correctness of data within the specified frames for the given video
    def get_sanity_check(self, dataset, scene, user, start_frame, end_frame):
        # Maybe register the action by the user, but at the moment, not necessary
        # Get all annotations for the video for the specified frames
        start_annotation = Annotation(dataset, scene, frame=start_frame)
        end_annotation = Annotation(dataset, scene, frame=end_frame)
        annotations = annotationManager.get_annotations_by_frame_range(start_annotation, end_annotation)
        # Get details from video
        video = videoManager.get_video(Video(scene, dataset))
        # Initialize errors list
        errors_detected = []
        # Run sanity check
        # For every frame, one annotation
        for annotation in annotations:
            # Check if it is an annotable frame
            try:
                annotable_frame = annotation["frame"] in ptService.frames_to_annotate_persons[annotation["scene"]]
            except KeyError as e:
                print("Frame not in list")
                annotable_frame = False
            # Separate into lists
            bbox_list, bbox_head_list, person_list, ir_list = ptService.divide_objects_in_arrays(annotation["objects"])
            # Normal checks
            if not (len(bbox_list) == len(bbox_head_list) == len(person_list)):
                errors_detected.append({
                    "number": "xx",
                    "track_id": "xx",
                    "type": "xx",
                    "reason": "Wrong number of objects. There may be duplicated track_ids in the sequence."
                })
            # Check properties of objects are correct
            for nr_bbox, bbox in enumerate(bbox_list):
                errors_detected = ptService.check_object_correctness(bbox, errors_detected)
                # If bbox is not annotated, then there's nothing to check
                if len(bbox["keypoints"]) > 0:
                    poly_bbox = ptService.transform_to_poly(bbox["keypoints"])
                    if video.type == "val":
                        # --- Every bbox must have a head_bbox inside within a threshold.
                        bbox_head = ptService.find(bbox_head_list, "track_id", bbox["track_id"])
                        head_inside = ptService.is_bbox_head_in_bbox(bbox_head["keypoints"], bbox["keypoints"])
                        # If it is considered to be sufficiently out of the bbox, add error
                        if not head_inside:
                            errors_detected.append({
                                "number": bbox["uid"]//100 % 10000,
                                "track_id": bbox["track_id"],
                                "type": "bbox_head",
                                "reason": "bbox_head outside of corresponding bbox"
                            })
                    # If it's an annotable frame, do further checks. These checks are the same in train and val
                    if annotable_frame:
                        # --- Every bbox must have a pose inside, unless it is inside an ignore region
                        # Search if bbox is inside an ignore region
                        bbox_in_ir = False
                        for ir in ir_list:
                            poly_ir = ptService.transform_to_poly(ir["keypoints"])
                            if ptService.is_A_in_B(poly_bbox, poly_ir):
                                bbox_in_ir = True
                                break
                        # If it's not in an ignore region, check that the pose is inside the bbox
                        if not bbox_in_ir:
                            person = ptService.find(person_list, "track_id", bbox["track_id"])
                            person_inside = ptService.is_person_in_B(person["keypoints"], poly_bbox)
                            if not person_inside:
                                errors_detected.append({
                                    "number": bbox["uid"]//100 % 10000,
                                    "track_id": bbox["track_id"],
                                    "type": "person",
                                    "reason": "At least one person keypoint outside of corresponding bbox"
                                })
            for nr_bbox_head, bbox_head in enumerate(bbox_head_list):
                if video.type == "train" and len(bbox_head["keypoints"]) > 0:
                    # If there is a bbox_head, we must ensure that it is within the bounds of its corresponding bbox
                    bbox = ptService.find(bbox_list, "track_id", bbox_head["track_id"])
                    if len(bbox["keypoints"]) > 0:
                        head_inside = ptService.is_bbox_head_in_bbox(bbox_head["keypoints"], bbox["keypoints"])
                        # If it is considered to be sufficiently out of the bbox, add error
                        if not head_inside:
                            errors_detected.append({
                                "number": bbox["uid"]//100 % 10000,
                                "track_id": bbox["track_id"],
                                "type": "bbox_head",
                                "reason": "bbox_head outside of corresponding bbox"
                            })
                    else:
                        errors_detected.append({
                            "number": bbox["uid"]//100 % 10000,
                            "track_id": bbox["track_id"],
                            "type": bbox["type"],
                            "reason": "bbox_head annotated with no corresponding annotated bbox"
                        })
                errors_detected = ptService.check_object_correctness(bbox_head, errors_detected)
            for nr_person, person in enumerate(person_list):
                errors_detected = ptService.check_object_correctness(person, errors_detected)
            for nr_ir, ir in enumerate(ir_list):
                errors_detected = ptService.check_object_correctness(ir, errors_detected)

        return True, errors_detected, 200

    # Replicate and store the annotation between start and enf frame
    # Always a single object in "objects" so always objects[0] !!
    def replicate_annotation(self, dataset, scene, user, uid_object, object_type, start_frame, end_frame, track_id,
                             forward):
        obj = Object(uid_object, object_type, dataset_type=dataset.type, track_id=track_id)
        if forward:
            obj = annotationManager.get_frame_object(Annotation(dataset, scene, start_frame, user, [obj]))
        else:
            obj = annotationManager.get_frame_object(Annotation(dataset, scene, end_frame, user, [obj]))
        if obj == 'Error':
            return False, 'Error replicating annotation', 400
        annotation = Annotation(dataset, scene, start_frame, user, [obj])
        # Update the annotation for each frame
        frame_range = range(start_frame, end_frame+1) if forward else range(start_frame, end_frame)
        for frame in frame_range:
            # For posetrack, update the object uid
            if dataset.is_pt():
                uid = "1" + scene + self.pad(str(frame), 4) + str(track_id)
                obj.uid = int(uid)
                annotation = Annotation(dataset, scene, start_frame, user, [obj])
            annotation.frame = frame
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                log.error('Error replicating annotation in frame '+frame)
                return False, 'Error replicating annotation in frame '+frame, 400
        return True, 'ok', 200

    # Replicate and store the annotation for an static object between start and end frame
    # and delete frames after end frame if it is different from last dataset frame
    # Always a single object in "objects" so always objects[0] !!
    def replicate_annotation_static_object(self, dataset, scene, user, uid_object, object_type,
                                           start_frame, end_frame, last_dataset_frame):
        success, msg, status = self.replicate_annotation(dataset, scene, user, uid_object, object_type, start_frame, end_frame, 0, True)

        # Delete frames after end frame if it's not the last frame of the dataset
        if end_frame+1 < last_dataset_frame:
            obj = Object(uid_object, object_type, dataset_type=dataset.type)
            start_annotation = Annotation(dataset, scene, end_frame+1, user, [obj])
            end_annotation = Annotation(dataset, scene, last_dataset_frame, user, [obj])
            result = annotationManager.remove_frame_object(start_annotation, end_annotation)
            if result == 'ok' and success:
                return True, result, 200
            else:
                return False, 'Error replicating annotation', 500

        return success, msg, status

    # Force the box object to be in contact with the floor and update existing annotation
    # for given frame, dataset, video and user
    def extend_box(self, annotation):
        if annotation.dataset.is_pt() or annotation.objects[0].type != 'boxAIK':
            return False, 'Method not allowed', 500

        # Get object
        object = annotationManager.get_frame_object(annotation)
        if object == 'Error':
            return False, 'Error extending box', 500
        annotation.objects[0] = object

        # z=0 for bbl point if the box is correct
        if annotation.objects[0].keypoints and len(annotation.objects[0].keypoints) == 3:
            annotation.objects[0].keypoints[2][2] = 0
        else:
            return False, 'Incorrect keypoints extending box', 500

        # Update keypoints
        result = annotationManager.update_frame_object(annotation)
        if result == 'Error':
            return False, 'Error extending box', 500
        return True, 'ok', 200

    # Force the size of the indicated limb and update existing annotation for given frame, dataset, video and user
    def force_limb_length(self, annotation, start_labels, end_labels, limb_length):
        if annotation.dataset.is_pt() or annotation.objects[0].type != 'poseAIK':
            return False, 'Method not allowed', 500

        if limb_length <= 0:
            return False, 'Limb length must be greater than 0!', 500

        # Get object
        object = annotationManager.get_frame_object(annotation)
        if object == 'Error':
            return False, 'Error forcing length of limb', 500

        annotation.objects[0] = object

        # Force length in the correct direction if the limb is complete
        for i, start_label in enumerate(start_labels):
            if object.keypoints[start_labels[i]] and object.keypoints[end_labels[i]]:
                start_joint = np.array(object.keypoints[start_labels[i]])
                end_joint = np.array(object.keypoints[end_labels[i]])

                v = end_joint - start_joint
                v = (v / np.linalg.norm(v)) * limb_length
                end_kp = object.keypoints[start_labels[i]] + v

                annotation.objects[0].keypoints[end_labels[i]] = end_kp.tolist()

        # Update forced keypoints
        result = annotationManager.update_frame_object(annotation)
        if result == 'Error':
            return False, 'Error forcing length of limb', 500

        return True, 'ok', 200

    # Force the size of the limbs and update annotations for range of frames, dataset, video and user
    def force_limbs_length(self, annotation, start_frame, end_frame):
        # Method only allowed for AIK and poseAIK type
        if annotation.dataset.is_pt() or annotation.objects[0].type != 'poseAIK':
            return False, 'Method not allowed', 500

        # Get limbs length
        pose_property = pose_property_manager.get_pose_property_by_uid(annotation.dataset, annotation.scene, annotation.objects[0].type, annotation.objects[0].uid)

        # If all limbs are -1
        if not pose_property.is_initialized():
            return False, 'Limbs are not initialized', 400

        # Get lists of start and end labels if they are not -1
        start_labels, end_labels = self.get_initialized_labels(pose_property)
        # Update for all frames in range
        for frame in range(start_frame, end_frame+1):
            annotation.frame = frame

            # Get object
            object = annotationManager.get_frame_object(annotation)
            if object == 'Error':
                return False, 'Error forcing limb length', 500

            if object != 'No annotation':
                annotation.objects[0] = object

                for i, start_label in enumerate(start_labels):
                    if object.keypoints and object.keypoints[start_labels[i]] and object.keypoints[end_labels[i]]:
                        start_joint = np.array(object.keypoints[start_labels[i]])
                        end_joint = np.array(object.keypoints[end_labels[i]])

                        # Get limb length depending on label
                        limb_length = self.get_limb_length_by_start_label(start_label, pose_property)

                        # Calculate end keypoint
                        v = end_joint - start_joint
                        v = (v / np.linalg.norm(v)) * limb_length
                        end_kp = object.keypoints[start_labels[i]] + v

                        annotation.objects[0].keypoints[end_labels[i]] = end_kp.tolist()

                # Update forced keypoints
                result = annotationManager.update_frame_object(annotation)
                if result == 'Error':
                    return False, 'Error forcing limb length', 500

        return True, 'Limb length forced for the whole range!', 200

    # Return length from pose property depending on the number of the label
    def get_limb_length_by_start_label(self, start_label, pose_property):
        if start_label == 2 or start_label == 5:
            return pose_property.upper_arm_length
        elif start_label == 3 or start_label == 6:
            return pose_property.lower_arm_length
        elif start_label == 8 or start_label == 11:
            return pose_property.upper_leg_length
        elif start_label == 9 or start_label == 12:
            return pose_property.lower_leg_length
        else:
            return 'Error'

    # Return lists of start and end labels if they are not -1
    def get_initialized_labels(self, pose_property):
        start_labels = []
        end_labels = []
        if pose_property.upper_arm_length > 0.0:
            start_labels.append(2)
            start_labels.append(5)
            end_labels.append(3)
            end_labels.append(6)
        if pose_property.lower_arm_length > 0.0:
            start_labels.append(3)
            start_labels.append(6)
            end_labels.append(4)
            end_labels.append(7)
        if pose_property.upper_leg_length > 0.0:
            start_labels.append(8)
            start_labels.append(11)
            end_labels.append(9)
            end_labels.append(12)
        if pose_property.lower_leg_length > 0.0:
            start_labels.append(9)
            start_labels.append(12)
            end_labels.append(10)
            end_labels.append(13)
        return start_labels, end_labels

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
    def transfer_object(self, dataset, old_annotation, new_annotation, start_frame, end_frame):
        if dataset.is_aik():
            for f in range(start_frame, end_frame+1):
                # Update actual frame in both annotations
                old_annotation.frame = f
                new_annotation.frame = f

                # Get annotations for both uids
                old_object = annotationManager.get_frame_object(old_annotation)
                new_object = annotationManager.get_frame_object(new_annotation)

                # There is no object -> ignore that frame and continue with the others
                if old_object == 'No annotation' and new_object == 'No annotation':
                    continue

                # If old uid doesn't have any data --> Remove new annotation and create the new one with old uid
                elif old_object == 'No annotation':
                    remove_result = annotationManager.remove_frame_object(new_annotation, new_annotation)
                    if remove_result == 'Error':
                        return False, 'Error transfering object', 400
                    # Change uid for the old one and insert object in annotation to update/create it
                    new_object.uid = old_annotation.objects[0].uid
                    updated_annotation = copy.deepcopy(new_annotation)
                    updated_annotation.objects[0] = new_object

                    create_result = annotationManager.create_frame_object(updated_annotation)
                    if create_result == 'Error':
                        return False, 'Error transfering object, please check the annotations', 400

                # If new uid doesn't have any data --> Remove old annotation and create the new one with new uid
                elif new_object == 'No annotation':
                    remove_result = annotationManager.remove_frame_object(old_annotation, old_annotation)
                    if remove_result == 'Error':
                        return False, 'Error transfering object', 400
                    # Change uid for the new one and insert object in annotation to update/create it
                    old_object.uid = new_annotation.objects[0].uid
                    updated_annotation = copy.deepcopy(old_annotation)
                    updated_annotation.objects[0] = old_object

                    create_result = annotationManager.create_frame_object(updated_annotation)
                    if create_result == 'Error':
                        return False, 'Error transfering object, please check the annotations', 400

                # Swap annotations for corresponding uids
                else:
                    old_uid = old_object.uid
                    old_object.uid = new_object.uid
                    new_object.uid = old_uid
                    updated_old_annotation = copy.deepcopy(old_annotation)
                    updated_old_annotation.objects[0] = old_object
                    updated_new_annotation = copy.deepcopy(new_annotation)
                    updated_new_annotation.objects[0] = new_object

                    update_old_result = annotationManager.update_frame_object(updated_old_annotation)
                    update_new_result = annotationManager.update_frame_object(updated_new_annotation)
                    if update_old_result == 'Error' or update_new_result == 'Error':
                        return False, 'Error transfering object, please check the annotations', 400
            return True, 'Objects transferred successfully!', 200
        else:
            return False, 'Operation not allowed', 400