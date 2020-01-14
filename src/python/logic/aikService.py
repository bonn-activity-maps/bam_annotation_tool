import numpy as np
import cv2
import random, json, base64
import logging

from aik.dataset import AIK
from aik.camera import Camera
import aik.geometry as gm
import numpy.linalg as la

from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.frameManager import FrameManager

from python.objects.frame import Frame

# aikService logger
log = logging.getLogger('aikService')

annotationManager = AnnotationManager()
frameManager = FrameManager()

class AIKService:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Method to read a dictionary key that may not exist.
    def safely_read_dictionary(self, dict, key):
        try:
            return dict[key]
        except KeyError:
            return None

    def project_to_camera(self, frame, points_array):
        # Convert the points json to Python list
        points_array = json.loads(points_array)

        # Get camera parameters for the frame, camera and dataset
        frame = frameManager.get_frame(frame)

        # Proyect and return the points into the camera
        return True, self.project_3D_points_to_camera(points_array, frame.camera_parameters), 200


    # Auxiliar function that creates a "AIK camera obejct" from the given camera parameters
    def create_camera(self, camera_params):
        return Camera(camera_params['K'], camera_params['rvec'], camera_params['tvec'], camera_params['dist_coef'], camera_params['w'], camera_params['h'])
    
    # Project 3D points into a camera given the camera parameters
    def project_3D_points_to_camera(self, points_3D, camera_params):
        # Create the camera given camera parameters
        camera = self.create_camera(camera_params)
        
        # Project all the points in the camera
        points_2D = camera.project_points(points_3D)
        
        # Return the projected points as a list
        return points_2D.tolist()
    
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

                if dataset.type == dataset.pt:
                    points = r['objects'][0]['keypoints']

                    f = Frame(r.frame, scene, dataset)
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
                        f = Frame(r.frame, camera, dataset)
                        frame_result = frameManager.get_frame(f)

                        if frame_result != 'Error':
                            # Obtain 2d keypoints for corresponding camera
                            kps2d = self.project_3D_points_to_camera(kps3d, frame_result.camera_parameters)[0]
                            kpX, kpY = int(kps2d[0]), int(kps2d[1])

                            # Read img, make mugshot 200px and add to final images
                            img = cv2.imread(frame_result.path)
                            if kpX >= 0 and kpX <= img.shape[1] and kpY >=0 and kpY <= img.shape[0]:
                                kpY_min, kpY_max = max(kpY-100, 0), min(kpY+100, img.shape[0])
                                kpX_min, kpX_max = max(kpX-100, 0), min(kpX+100, img.shape[1])
                                crop_img = img[kpY_min:kpY_max, kpX_min:kpX_max]
                                images.append({"image": self.img2binary(crop_img)})

        return True, images, 200

