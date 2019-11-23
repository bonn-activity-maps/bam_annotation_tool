import logging

from python.infrastructure.frameManager import FrameManager
from python.infrastructure.videoManager import VideoManager

# FrameService logger
log = logging.getLogger('FrameService')

frameManager = FrameManager()
videoManager = VideoManager()


class FrameService:

    # Return frame info  by video and dataset if exist in DB
    def getFrame(self, frame, video, dataset):
        result = frameManager.getFrame(int(frame), video, dataset)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result, 200

    # Return frame info  by Id if exist in DB
    def getFrameByID(self, frameId, dataset):
        result = frameManager.getFrameById(int(frameId), dataset)
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
    def getFrameInfoOfVideo(self, dataset, video):
        result = frameManager.getFrames(video, dataset)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            if result:
                return True, [result[0], result[-1]], 200
            else:
                return False, 'Error: no frames for video', 400

    # Return frames info of dataset group by video with video type
    def getFramesInfoOfDatasetGroupByVideo(self, dataset, datasetType):
        result = frameManager.getFramesInfoOfDatasetGroupByVideo(dataset)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            # Search video type in video db table
            videos = []
            for videoFrames in result:
                video = videoManager.getVideo(dataset, datasetType, videoFrames['video'])
                if video != 'Error':
                    videoFrames['type'] = video['type']
                    videos.append(videoFrames)
            return True, videos, 200

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
