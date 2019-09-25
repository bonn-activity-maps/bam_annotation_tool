import logging

from python.infrastructure.frameManager import FrameManager

# FrameService logger
log = logging.getLogger('FrameService')

frameManager = FrameManager()


class FrameService:

    # Return frame info  by video and dataset if exist in DB
    def getFrame(self, frame, video, dataset):
        result = frameManager.getFrame(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result, 200

    # Return frame info  by Id if exist in DB
    def getFrameByID(self, frameId):
        result = frameManager.getFrameById(int(frameId))
        if result == 'Error':
            return False, 'Incorrect frame id', 400
        else:
            return True, result, 200

    # Return frames info
    def getFrames(self, video, dataset):
        result = frameManager.getFrames(video, dataset)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            return True, result, 200

    # Return frames info
    def getFrameInfoOfVideo(self, video, dataset):
        result = frameManager.getFrames(dataset, video)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            return True, [result[0], result[-1]], 200

    # Return camera parameters
    def getCameraParameters(self, frame, video, dataset):
        result = frameManager.getFrame(int(frame), int(video), dataset)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result['cameraParameters'], 200


     # Return 'ok' if the frame has been created
    def createFrame(self, frameDict):
        result = frameManager.createFrame(frameDict)
        if result == 'Error':
            return False, 'Error creating frame ', 400
        else:
            return True, result, 200

    # Return 'ok' if the frame has been removed
    def removeFrame(self, frame, video, dataset):
        result = frameManager.removeFrame(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Return 'ok' if the frames has been removed
    def removeFramesByDataset(self, dataset):
        result = frameManager.removeFramesByDataset(dataset)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Return the path of the frame
    def getFramePath(self, frame, video, dataset):
        result = frameManager.getFramePath(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Error retrieving frame', 400
        else:
            return True, result['path'], 200
