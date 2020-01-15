import logging
import numpy as np
import os, json

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.objectTypeManager import ObjectTypeManager
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.datasetManager import DatasetManager
from python.logic.aikService import AIKService

from python.objects.frame import Frame
from python.objects.annotation import Annotation
from python.objects.object import Object


# AnnotationService logger
log = logging.getLogger('annotationService')

annotationManager = AnnotationManager()
objectTypeManager = ObjectTypeManager()
frameManager = FrameManager()
actionManager = ActionManager()
datasetManager = DatasetManager()
aikService = AIKService()


class AnnotationService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the annotations
    aik = 'actionInKitchen'
    pt = 'poseTrack'

    def pad(self, num, size):
        s = str(num)
        while len(s) < size:
            s = "0" + s
        return s

    def generate_new_original_uid(self, track_id, video, frame):
        frame = self.pad(frame, 4)
        track_id = self.pad(track_id, 2)
        return int("1" + video + frame + track_id)

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

    # Triangulate points from 2D points to 3D
    # Always a single object in "objects" so always objects[0] !!
    def obtain_3d_points_AIK(self, annotation):
        keypoints2d = annotation.objects[0].keypoints
        keypoints3d = []  # New 3d kps
        # Triangulate all keypoints of object
        for kp in keypoints2d:
            # Keypoints and camera parameters to triangulate
            keypoints_triangulate = []
            camera_params_triangulate = []

            # Add existing points to triangulate (max 4 points)
            if kp["cam1"] != "":
                f = Frame(annotation.frame, kp["cam1"], annotation.dataset)
                frame1 = frameManager.get_frame(f)
                keypoints_triangulate.append(kp["p1"])
                camera_params_triangulate.append(frame1.camera_parameters)

            if kp["cam2"] != "":
                f = Frame(annotation.frame, kp["cam2"], annotation.dataset)
                frame2 = frameManager.get_frame(f)
                keypoints_triangulate.append(kp["p2"])
                camera_params_triangulate.append(frame2.camera_parameters)

            if kp["cam3"] != "":
                f = Frame(annotation.frame, kp["cam3"], annotation.dataset)
                frame3 = frameManager.get_frame(f)
                keypoints_triangulate.append(kp["p3"])
                camera_params_triangulate.append(frame3.camera_parameters)

            if kp["cam4"] != "":
                f = Frame(annotation.frame, kp["cam4"], annotation.dataset)
                frame4 = frameManager.get_frame(f)
                keypoints_triangulate.append(kp["p4"])
                camera_params_triangulate.append(frame4.camera_parameters)

            if len(keypoints_triangulate) == 0:  # If 0 points, let the keypoint empty
                keypoints_triangulate.append([])
                camera_params_triangulate.append([])
            elif len(keypoints_triangulate) < 2:  # Error if only 1 points
                return annotation.objects, True
            else:  # Triangulate using all available points
                point3d = aikService.triangulate_2D_points(keypoints_triangulate, camera_params_triangulate)
                keypoints3d.append(point3d.tolist())  # Store 3d point

        # Modify original objects which contains info of object with calculated 3d keypoints
        annotation.objects[0].keypoints = keypoints3d
        return annotation.objects, False

    # Return the object with the 3d points for AIK datasets
    # Always a single object in "objects" so always objects[0] !!
    def update_annotation_AIK(self, annotation):

        # Triangulate points from 2D points to 3D if dataset is AIK
        objects, error_flag = self.obtain_3d_points_AIK(annotation)

        # If the object is not a person -> we have to calculate 8 points for the box of object
        if annotation.objects[0].type != 'personAIK' and not error_flag:
            kp1, kp2, kp3 = np.asarray(annotation.objects[0].keypoints)
            annotation.objects[0].keypoints = aikService.create_box(kp1, kp2, kp3).tolist()
        return objects, error_flag

    # Return 'ok' if the annotation has been updated
    def update_annotation(self, annotation):

        # Triangulate points from 2D points to 3D if dataset is AIK
        if annotation.dataset.is_aik():
            objects, error_flag = self.update_annotation_AIK(annotation)

            if error_flag:
                return False, 'Error incorrect keypoints', 400

            # Update only one object in the annotation for concrete frame
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                return False, 'Error updating annotation', 400
            else:
                return True, result, 200
        elif annotation.dataset.is_pt():
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                return False, 'Error updating annotation', 400
        return True, 'Ok', 200

    # Return 'ok' if the annotation has been updated
    # Same as above but for PoseTrack
    def update_annotation_PT(self, annotation):
        # keypoints = []
        # for point in points:
        #     keypoints.append(point["points"][0])
        # object["keypoints"] = keypoints
        # object["category_id"] = 1
        result = self.update_annotation_frame_object(annotation)
        if result == 'Error':
            return False, 'Error updating annotation', 400
        return True, 'Ok', 200

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

    # Return new uid for an object in annotations for a dataset to avoid duplicated uid objects
    def create_new_uid_object(self, annotation, object_type):
        max_uid = annotationManager.max_uid_object_dataset(annotation.dataset)

        if max_uid == 'Error':
            return False, 'Error getting max uid object for dataset in db', 400
        else:
            # Create new object with max_uid+1
            new_uid = max_uid + 1
            annotation.objects = Object(new_uid, object_type, [], annotation.dataset.type)
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
            return True, result, 200

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
            if annotation.dataset.is_pt() and found.type != annotation.objects[0].type:
                result = annotationManager.create_frame_object(annotation)
            else:
                result = annotationManager.update_frame_object(annotation)

        return result

    # Remove annotation for an object for given frame, dataset, video and user
    # Always a single object in "objects" so always objects[0] !!
    def remove_annotation_frame_object(self, start_annotation, end_annotation):
        # PT: the uidObject change for each frame, iterate for all frames with the corresponding id
        if start_annotation.dataset.is_pt():
            result = 'ok'
            start_frame = start_annotation.frame
            end_frame = end_annotation.frame+1
            for f in range(start_frame, end_frame):
                start_annotation.objects[0].uid = self.generate_new_original_uid(start_annotation.frame, start_annotation.scene, f)
                # modify only 1 frame
                start_annotation.frame = f
                end_annotation.frame = f
                r = annotationManager.remove_frame_object(start_annotation, end_annotation)
                if r == 'Error': result = 'Error'
        else:
            result = annotationManager.remove_frame_object(start_annotation, end_annotation)

        if result == 'ok':
            return True, result, 200
        else:
            return False, 'Error deleting annotation', 500

    # Interpolate all keypoints between 2 points
    def interpolate(self, num_frames, num_kpts, kp_dim, kps1, kps2):
        # Structure to store all keypoints ordered by frame (row: frame, column:kpt)
        final_kpts = np.zeros((num_frames, num_kpts, 3)) if kp_dim == 3 else np.zeros((num_frames, num_kpts, 2))

        # Interpolate for all keypoints in all frames in between
        for i in range(num_kpts):
            interpolated_kps = []

            # Interpolate each coordinate of keypoint
            for j in range(kp_dim):
                interpolated_coords = np.linspace(kps1[i][j], kps2[i][j], num=num_frames)
                interpolated_kps.append(interpolated_coords)

            interpolated_kps = np.asarray(interpolated_kps)

            # Build interpolated keypoints for each frame
            for k in range(len(interpolated_kps[0])):
                final_kpts[k, i] = interpolated_kps[:, k]

        return final_kpts

    # Interpolate and store the interpolated 3d points
    # Always a single object in "objects" so always objects[0] !!
    def interpolate_annotation(self, dataset, start_annotation, end_annotation, object2):
        # Search object in respective start and end frames
        if dataset.is_pt():
            start_annotation.objects = [object2]
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

        # Store interpolated keypoints for frames in between (avoid start and end frame)
        for i in range(1, final_kpts.shape[0] - 1):
            if dataset.is_pt():
                new_uid = self.generate_new_original_uid(abs(start_annotation.objects[0].uid) % 100, start_annotation.scene, start_annotation.frame + i)
                obj = Object(new_uid, type, final_kpts[i].tolist(), dataset_type=dataset.type, track_id=new_uid % 100)
                annotation = Annotation(dataset, start_annotation.scene, start_annotation.frame + i, start_annotation.user, [obj])
            else:
                obj = Object(start_annotation.objects[0].uid, type, final_kpts[i].tolist(), dataset_type=dataset.type)
                annotation = Annotation(dataset, start_annotation.scene, start_annotation.frame + i, start_annotation.user, [obj])
            result = self.update_annotation_frame_object(annotation)
            if result == 'Error':
                final_result = 'There was some error interpolating the keypoints, please check them'

        if final_result == 'ok':
            return True, final_result, 200
        else:
            log.error('Error interpolating keypoints')
            return False, final_result, 500

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if has been some problem
    def add_annotations_AIK(self, dataset, dir):
        list_dir = os.listdir(dir)   # List of all objects/persons
        type = 'personAIK'          # Type of objects
        final_result = True

        for f in list_dir:
            track_file = os.path.join(dir, f)

            # Read uid/number of object
            uid = int(os.path.splitext(f)[0].split('track')[1])

            # Read data from file
            try:
                with open(track_file) as json_file:
                    tracks = json.load(json_file)
            except OSError:
                log.exception('Could not read from file')
                return False

            # Transform annotation to our format and store in db
            frames = tracks['frames']
            poses = tracks['poses']
            for i, frame in enumerate(frames):
                keypoints = poses[i]
                object = Object(uid, type, keypoints, dataset.type)
                annotation = Annotation(dataset, dataset.name, frame, 'root', object)
                result = self.update_annotation_frame_object(annotation)
                if result == 'Error':
                    final_result = False   # finalResult False if there is some problem

        return final_result