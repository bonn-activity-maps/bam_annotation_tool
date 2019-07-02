import logging

from python.infrastructure.frameManager import FrameManager

# FrameService logger
log = logging.getLogger('FrameService')

frameManager = FrameManager()


class FrameService:

    # Return frame info  by video and dataset if exist in DB
    def getFrame(this, frame, video, dataset):
        result = frameManager.getFrame(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result, 200

    # Return frames info
    def getFrames(this, video, dataset):
        result = frameManager.getFrames(video, dataset)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            return True, result, 200

     # Return 'ok' if the frame has been created
    def createFrame(this, frameDict):
        result = frameManager.createFrame(frameDict)
        if result == 'Error':
            return False, 'Error creating frame ', 400
        else:
            return True, result, 200

    # Return 'ok' if the frame has been removed
    def removeFrame(this, frame, video, dataset):
        result = frameManager.removeFrame(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Return 'ok' if the frames has been removed
    def removeFramesByDataset(this, dataset):
        result = frameManager.removeFramesByDataset(dataset)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Return the path of the frame
    def getFramePath(this, frame, video, dataset):
        result = frameManager.getFramePath(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Error retrieving frame', 400
        else:
            return True, result['path'], 200
