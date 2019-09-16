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

# aikService logger
log = logging.getLogger('aikService')

annotationManager = AnnotationManager()
frameManager = FrameManager()

class AIKService:

    # Auxiliar function that creates a "AIK camera obejct" from the given camera parameters
    def createCamera(self, cameraParams):
        return Camera(cameraParams['K'], cameraParams['rvec'], cameraParams['tvec'], cameraParams['dist_coef'], cameraParams['w'], cameraParams['h'])
    
    # Project 3D points into a camera given the camera parameters
    def project3DPointsToCamera(self, points3D, cameraParams):
        # Create the camera given camera parameters
        camera = self.createCamera(cameraParams)
        
        # Project all the points in the camera
        points2D = camera.project_points(points3D)
        
        # Return the projected points as a list
        return points2D.tolist()
    
    # Triangulates the 3D point from two 2D points and their respective cameras
    def triangulate2DPoints(self, points, camParams):
        # Create the cameras
        cameras = []
        for c in camParams:
            cameras.append(self.createCamera(c))

        # Triangulate
        point3D = gm.triangulate_multiple(points, cameras)
        return point3D

    # Compute the epiline of a point in a camera in another camera
    def computeEpiline(self, point2D, cameraParams1, cameraParams2):
        # Create the two cameras
        camera1 = self.createCamera(cameraParams1)
        camera2 = self.createCamera(cameraParams2)

        # ax + by + c = 0 ==> y = (-c -ax)/b
        y = lambda x, a, b, c: (-c - a * x)/b

        # Calculate epiline
        epiline = gm.compute_epiline(point2D, camera1, camera2)
        
        # Calculate two points of the epiline
        x0 = 0
        y0 = y(x0, *epiline)

        x1 = 1600
        y1 = y(x1, *epiline)

        # Return the two 2D coordinates of the line
        return [x0,y0] , [x1,y1]

    # Create box for 3 3d points
    def createBox(self, a, b, c):
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

    # Image to json
    def im2json(self, im):
        _, imdata = cv2.imencode('.JPG', im)
        # jstr = json.dumps(base64.b64encode(imdata.tostring()))
        jstr = str(base64.b64encode(imdata.tostring())).replace("\n", "")
        return jstr

    # Return 6 mugshot of person uid from different cameras
    def getMugshot(self, dataset, scene, user, personUid):
        # Get 6 annotation of the object uid
        result = annotationManager.getAnnotationsByObject(dataset, scene, user, personUid)

        images = []     # Final cropped images

        for r in result:
            kps3d = r['objects'][0]['keypoints'][0]     # Nose 3d point
            camera = random.randint(0, 11)              # Random camera for random mugshot (always 12 cameras)

            # Check camera parameters and frame path
            frameResult = frameManager.getFrame(r['frame'], camera, dataset)
            if frameResult != 'Error':
                cameraParams = frameResult['cameraParameters']
                path = frameResult['path']

                # Obtain 2d keypoints for corresponding camera
                kps2d = self.project3DPointsToCamera(kps3d, cameraParams)[0]
                kpX, kpY = int(kps2d[0]), int(kps2d[1])

                # Read img, make mugshot 100px and add to final images
                img = cv2.imread(path)
                kpY_min, kpY_max = max(kpY-50, 0), min(kpY+50, img.shape[0])
                kpX_min, kpX_max = max(kpX-50, 0), min(kpX+50, img.shape[1])
                cropImg = img[kpY_min:kpY_max, kpX_min:kpX_max]
                images.append({"image": self.im2json(cropImg)})

        return True, images, 200

