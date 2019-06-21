import cv2 as cv

class OpenCVService:

    # Projects the array of 3D points to 2D given the camera parameters 
    def projectPointsTo2D(points3D, rvec, tvec, k, distCoef):
        return cv.projectPoints(points3D, rvec, tvec, k, distCoef)
    

    # Given 2 or more 2D points, reproject them to its corresponding 3D point
    def reprojectPointsTo3D():
        pass


    # Given a 2D point and camera stuff, return the line that may contain that point in the other image
    def getEpipolarLine(point2D):
        pass

    