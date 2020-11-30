import numpy as np
import cv2
import random, json, base64
import logging
import math

from aik.dataset import AIK
from aik.camera import Camera
import aik.geometry as gm
import numpy.linalg as la

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.frameManager import FrameManager

from python.objects.frame import Frame
from python.objects.annotation import Annotation
from python.objects.object import Object

# aikService logger
log = logging.getLogger('aikService')

annotationManager = AnnotationManager()
frameManager = FrameManager()

class AIKService:

    # Method to read a dictionary key that may not exist.
    def safely_read_dictionary(self, dict, key):
        try:
            return dict[key]
        except KeyError:
            return None

    # Project points to camera
    def project_to_camera(self, start_frame, end_frame, camera_name, dataset, object_type, points_array):
        # Convert the points json to Python list
        points_array = json.loads(points_array)
        final_points = []
        for i, f in enumerate(range(start_frame, end_frame+1)):
            if points_array[i]:
                # Get camera parameters for the frame, camera and dataset
                f = Frame(f, camera_name, dataset)
                frame = frameManager.get_frame(f)
                # Project points and add to final list
                final_points.append(self.project_3D_points_to_camera(points_array[i], frame.camera_parameters, object_type))
            else:
                final_points.append([])

        return True, final_points, 200

    # Project points of one object to camera
    def project_to_camera_2(self, camera_name, object_type, start_annotation, end_annotation):
        final_points = []

        # Get annotations for the object in frames between start and end frame
        annotations = annotationManager.get_object_in_frames(start_annotation, end_annotation)
        if annotations == 'Error':
            return False, 'Error projecting points in cameras', 400

        # If type boxAIK is projected, convert to complete box with 8 keypoints
        if start_annotation.dataset.is_aik() and object_type == 'boxAIK':
            for annotation in annotations:
                for obj in annotation.objects:
                    if obj.type == 'boxAIK' and obj.keypoints:
                        a, b, c = obj.keypoints
                        obj.keypoints = self.create_box(np.array(a), np.array(b), np.array(c)).tolist()
                    elif obj.type == 'cylinderAIK' and obj.keypoints:
                        a, b = obj.keypoints
                        obj.keypoints = self.create_cylinder(np.array(a), np.array(b)).tolist()

        # Project points into the camera
        annotation_index = 0
        for f in range(start_annotation.frame, end_annotation.frame+1):
            if annotation_index < len(annotations) and annotations[annotation_index].frame == f:
                a = annotations[annotation_index]
                annotation_index += 1
                try:
                    if a.objects[0].keypoints:
                        # Get camera parameters for the frame, camera and dataset
                        f = Frame(a.frame, camera_name, start_annotation.dataset)
                        frame = frameManager.get_frame(f)
                        # Project points and add to final list
                        final_points.append(self.project_3D_points_to_camera(a.objects[0].keypoints, frame.camera_parameters, object_type))
                    else:
                        final_points.append([])
                except TypeError:      # If annotation has not attribute objects
                    final_points.append([])
            else:       # Add empty points if there are no more points or no annotation for that frame
                final_points.append([])
        return True, final_points, 200

    # Auxiliar function that creates a "AIK camera obejct" from the given camera parameters
    def create_camera(self, camera_params):
        return Camera(camera_params['K'], camera_params['rvec'], camera_params['tvec'], camera_params['dist_coef'], camera_params['w'], camera_params['h'])
    
    # Project 3D points into a camera given the camera parameters
    def project_3D_points_to_camera(self, points_3D, camera_params, object_type):
        # Create the camera given camera parameters
        camera = self.create_camera(camera_params)
        if len(points_3D) == 1 and len(points_3D[0]) == 0:
            return [[]]

        # Only separate empty points if the object type is poseAIK
        if object_type == 'poseAIK':
            # Treatment for empty points
            points_to_interpolate = []
            indexes_of_empty_points = []

            # Add index of empty points to new list and remove the empty elements
            for i, p in enumerate(points_3D):
                if p:
                    points_to_interpolate.append(p)
                else:
                    indexes_of_empty_points.append(i)

            # Project all the points in the camera if points_to_interpolate is not empty
            if points_to_interpolate:
                points_2D = camera.project_points(np.asarray(points_to_interpolate)).tolist()
            else:
                points_2D = []

            # if the list is not empty (if there are some empty array) --> add it again
            if indexes_of_empty_points:
                for index in indexes_of_empty_points:
                    points_2D.insert(index, [])
        else:
            points_2D = camera.project_points(points_3D).tolist()

        # Return the projected points as a list
        return points_2D
    
    # Triangulates the 3D point from two 2D points and their respective cameras
    def triangulate_2D_points(self, points, cam_params):
        # Create the cameras
        cameras = []
        for c in cam_params:
            cameras.append(self.create_camera(c))

        # Triangulate
        point_3D = gm.triangulate_multiple(points, cameras)
        return point_3D

    # Compute the epiline of a point in a camera in another camera
    def compute_epiline(self, point_2D, frame1, frame2):
        point_2D = json.loads(point_2D)

        # Get camera parameters of frames
        frame1 = frameManager.get_frame(frame1)
        frame2 = frameManager.get_frame(frame2)

        # Create the two cameras
        camera1 = self.create_camera(frame1.camera_parameters)
        camera2 = self.create_camera(frame2.camera_parameters)

        # ax + by + c = 0 ==> y = (-c -ax)/b
        y = lambda x, a, b, c: (-c - a * x)/b

        # Calculate epiline
        epiline = gm.compute_epiline(point_2D, camera1, camera2)
        
        # Calculate two points of the epiline
        x0 = 0
        y0 = y(x0, *epiline)

        x1 = 1600
        y1 = y(x1, *epiline)

        # Return the two 2D coordinates of the line
        return [x0,y0] , [x1,y1]

    # Create box for 3 3d points
    def create_box(self, a, b, c):
        """
        :param a: (x, y, z) top-left point
        :param b: (x, y, z) top-right point
        :param c: (x, y, z) bottom-left or bottom-right point
        """
        proj_to_xy = lambda x: x[:2]
        get_angle = lambda x,y: (x @ y) / (la.norm(x) * la.norm(y))

        ab = proj_to_xy(b) - proj_to_xy(a)
        ac = proj_to_xy(c) - proj_to_xy(a)
        bc = proj_to_xy(c) - proj_to_xy(b)

        ab_ac = np.abs(get_angle(ab, ac))
        ab_bc = np.abs(get_angle(ab, bc))

        x1, y1, z1 = a
        x2, y2, z2 = b
        x3, y3, z3 = c

        z = (z1 + z2)/2

        down = np.array([0., 0., z - z3])

        if ab_ac < ab_bc:  # 3. point is bottom-left
            back = np.array([ac[0], ac[1], 0])
        else:  # 3. point is bottom-right
            back = np.array([bc[0], bc[1], 0])

        tfl = np.array([x1, y1, z])
        tfr = np.array([x2, y2, z])

        tbl = tfl + back
        tbr = tfr + back

        bfl = tfl - down
        bfr = tfr - down

        bbl = bfl + back
        bbr = bfr + back

        return np.array([
            tfl, tfr,
            tbl, tbr,
            bfl, bfr,
            bbl, bbr
        ])

    # Create complete cylinder from 2 3d points
    def create_cylinder(self, a, b):
        """
        :param a: (x, y, z) center
        :param b: (x, y, z) radius
        """
        # divide by number of segments we want for the circle
        num_segments = 20
        segments = np.arange(2*math.pi, step=2*math.pi/num_segments)
        r = np.sqrt(np.sum((a-b)**2, axis=0))   # calculate radius

        # calculate coordinates for each point in circle
        x = a[0] + r * np.cos(segments)
        y = a[1] + r * np.sin(segments)

        # combine coords to create 3d points for superior and inferior part of the cylinder
        top_3d_points = np.stack((x, y, np.ones(num_segments) * a[2]), axis=1)
        bottom_3d_points = np.stack((x, y, np.zeros(num_segments)), axis=1)

        # concatenate all points as: center, radius, X top kpts, X bottom kpts
        center_and_radius = np.array([a, b])
        return np.concatenate((center_and_radius, top_3d_points, bottom_3d_points), axis=0)

    # Image to binary
    def img2binary(self, im):
        _, imdata = cv2.imencode('.JPG', im)
        return str(base64.b64encode(imdata.tostring())).replace("\n", "")

    # Return 6 mugshot of person uid from different cameras
    def get_mugshot(self, dataset, scene, user, person_uid):
        # Get 10 annotation of the object uid
        result = annotationManager.get_annnotations_by_object(dataset, scene, user, person_uid)
        images = []     # Final cropped images

        for r in result:
            if 'objects' in r and r['objects'][0]['keypoints'] != []:

                if dataset.is_pt():
                    points = r['objects'][0]['keypoints']

                    f = Frame(r['frame'], scene, dataset)
                    frame_result = frameManager.get_frame(f)
                    if frame_result != 'Error':

                        kpX, kpY = points[0]
                        kpX2, kpY2 = points[1]

                        img = cv2.imread(frame_result.path)
                        crop_img = img[kpY:kpY2, kpX:kpX2]
                        images.append({"image": self.img2binary(crop_img)})
                else:
                    kps3d = r['objects'][0]['keypoints'][0]     # Nose 3d point

                    # Check annotations in all 12 cameras
                    for camera in range(12):
                        # Check camera parameters and frame path
                        f = Frame(r['frame'], camera, dataset)
                        frame_result = frameManager.get_frame(f)

                        if frame_result != 'Error':
                            # Obtain 2d keypoints for corresponding camera
                            kps2d = self.project_3D_points_to_camera(kps3d, frame_result.camera_parameters, 'personAIK')[0]
                            kpX, kpY = int(kps2d[0]), int(kps2d[1])

                            # Read img, make mugshot 200px and add to final images
                            img = cv2.imread(frame_result.path)
                            if kpX >= 0 and kpX <= img.shape[1] and kpY >=0 and kpY <= img.shape[0]:
                                kpY_min, kpY_max = max(kpY-100, 0), min(kpY+100, img.shape[0])
                                kpX_min, kpX_max = max(kpX-100, 0), min(kpX+100, img.shape[1])
                                crop_img = img[kpY_min:kpY_max, kpX_min:kpX_max]
                                images.append({"image": self.img2binary(crop_img)})

        return True, images, 200

