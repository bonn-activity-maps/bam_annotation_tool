import numpy as np
import cv2

from aik.dataset import AIK
from aik.camera import Camera
import aik.geometry as gm


class AIKService:

    ## Auxiliar function that creates a "AIK camera obejct" from the given camera parameters
    def createCamera(self, cameraParams):
        return Camera(cameraParams['K'], cameraParams['rvec'], cameraParams['tvec'], cameraParams['dist_coef'], cameraParams['w'], cameraParams['h'])
    
    ## Project 3D points into a camera given the camera parameters
    def project3DPointsToCamera(self, points3D, cameraParams):
        # Create the camera given camera parameters
        camera = self.createCamera(cameraParams)
        
        # Project all the points in the camera
        points2D = camera.project_points(points3D)
        
        # Return the projected points as a list
        return points2D.tolist()
    
    ## Triangulates the 3D point from two 2D points and their respective cameras
    def triangulate2DPoints(self, point1, point2, camParams1, camParams2):
        # Create the two cameras
        camera1 = self.createCamera(camParams1)
        camera2 = self.createCamera(camParams2)
        
        # Triangulate
        point3D = gm.triangulate(point1, point2, camera1, camera2)
        return point3D
        

    ## Compute the epiline of a point in a camera in another camera
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
    
