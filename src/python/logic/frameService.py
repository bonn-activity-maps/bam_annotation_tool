import logging
import os, json

from aik.dataset import AIK
from python.infrastructure.frameManager import FrameManager
from python.infrastructure.videoManager import VideoManager
from python.logic.ptService import PTService

from python.objects.video import Video
from python.objects.frame import Frame

# FrameService logger
log = logging.getLogger('FrameService')

frameManager = FrameManager()
videoManager = VideoManager()
ptService = PTService()


class FrameService:

    # Return frame info  by video and dataset if exist in DB
    def get_frame(self, frame):
        result = frameManager.get_frame(frame)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result.to_json(), 200

    # Return frame info  by Id if exist in DB
    def get_frame_by_ID(self, frame_id, dataset):
        result = frameManager.get_frame_by_ID(int(frame_id), dataset)
        if result == 'Error':
            return False, 'Incorrect frame id', 400
        else:
            return True, result, 200

    # Return frames info
    def get_frames(self, video):
        result = frameManager.get_frames(video)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return frames info
    def get_frame_info_of_video(self, video):
        result = frameManager.get_frames(video)
        if result == 'Error':
            return False, 'Error searching frame'
        elif result:
            return True, [result[0], result[-1]]
        else:
            return False, 'Error: no frames for video'

    # Return frames info of dataset group by video with video type
    def get_frames_info_of_dataset_group_by_video(self, dataset):
        result = frameManager.get_frames_info_of_dataset_group_by_video(dataset)
        if result == 'Error':
            return False, 'Error searching frame', 400
        else:
            # Search video type in video db table
            videos = []
            for videoFrames in result:
                video = Video(videoFrames['video'], dataset)
                video = videoManager.get_video(video)
                if video != 'Error':
                    videoFrames['type'] = video.type
                    videos.append(videoFrames)
            return True, videos, 200

    # Return camera parameters
    def get_camera_parameters(self, frame):
        result = frameManager.get_frame(frame)
        if result == 'Error':
            return False, 'Incorrect frame', 400
        else:
            return True, result['cameraParameters'], 200


     # Return 'ok' if the frame has been created
    def create_frame(self, frame):
        result = frameManager.create_frame(frame)
        if result == 'Error':
            return False, 'Error creating frame ', 400
        else:
            return True, result, 200

    # Return 'ok' if the frame has been removed
    def remove_frame(self, frame):
        result = frameManager.remove_frame(frame)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Return 'ok' if the frames has been removed
    def remove_frames_by_dataset(self, dataset):
        result = frameManager.remove_frames_by_dataset(dataset)
        if result == 'Error':
            return False, 'Error deleting frame', 400
        else:
            return True, result, 200

    # Add camera parameters to frames in database from camera directory
    # Return true if all have been updated, False ow
    def add_frame_AIK(self, dataset):
        # Load dataset
        aik = AIK(dataset.dir)
        for frame in aik.valid_frames:
            path, cameras = aik.get_frame(frame, return_paths=True)
            for i, cam in enumerate(cameras):
                # Frame directory, join datasetDir with relative path
                frame_path = os.path.join(dataset.dir, path[i])

                # Create dictionary with frame, video, dataset, path and camera parameters and store it in db
                f = Frame(frame, i, dataset, frame_path, json.loads(cam.to_json()))
                result = frameManager.create_frame(f)

                if result == 'Error': return False
        return True

    # Add camera parameters to frames in database from camera directory (only for 'video')
    # Return true if all have been updated, False ow
    def add_frame_video_AIK(self, dataset, video):
        # Load dataset
        aik = AIK(dataset.dir)
        for frame in aik.valid_frames:
            path, cameras = aik.get_frame(frame, return_paths=True)
            for i, cam in enumerate(cameras):
                if i == video:
                    # Frame directory, join datasetDir with relative path
                    frame_path = os.path.join(dataset.dir, path[i])

                    # Create dictionary with frame, video, dataset, path and camera parameters and store it in db
                    frame = Frame(frame, i, dataset, frame_path, json.loads(cam.to_json()))
                    result = frameManager.create_frame(frame)

                    if result == 'Error': return False
        return True

    # TODO: change!!!
    def add_frames_PT(self, dataset, frames):
        initFrameNumber = int(os.path.splitext(os.path.split(frames[0]["file_name"])[-1])[0])
        nFrames = ptService.safely_read_dictionary(frames[0], "nframes")
        index = 0
        frame = {}
        for frameNumber in range(0, nFrames):     # For every frame in VIDEO (not JSON FILE)
            frameObjectNumber = os.path.splitext(os.path.split(frames[index]["file_name"])[-1])[0]
            # print("NFRAMES: ", nFrames, " FRAMENUMBER: ", frameNumber + initFrameNumber, " FRAMEOBJECTNUMBER: ", int(frameObjectNumber))
            if (frameNumber + initFrameNumber) == int(frameObjectNumber):   # If there is data to add
                index += 1                              # Advance index
                frame = dict(frames[frameNumber])       # Reformat object to insert into db
                # frame["image_id"] = ptService.safely_read_dictionary(frame, "frame_id")
                frame["number"] = frameNumber + initFrameNumber
                frame["dataset"] = dataset
                frame["video"] = ptService.safely_read_dictionary(frame, "vid_id")
                ptService.safely_delete_dictionary_key(frame, "vid_id")
                frame["path"] = os.path.join(dataset.STORAGE_DIR, dataset + "/" +
                                             ptService.safely_read_dictionary(frame, "file_name"))
                ptService.safely_delete_dictionary_key(frame, "file_name")
                frame["has_ignore_regions"] = False if ptService.safely_read_dictionary(frame, "ignore_regions_x") is None \
                    else True                           # If it has no ignore regions, store it so we know later.
                ptService.safely_delete_dictionary_key(frame, "ignore_regions_x")
                ptService.safely_delete_dictionary_key(frame, "ignore_regions_y")
            else:       # If no data, initialize empty
                frame = dict()
                frame["number"] = frameNumber + initFrameNumber
                frame["dataset"] = dataset
                frame["video"] = ptService.safely_read_dictionary(frames[0], "vid_id")
                dirpath = os.path.join(dataset.STORAGE_DIR, dataset + "/" + os.path.split(frames[index]["file_name"])[-2])
                frame["path"] = os.path.join(dirpath, str(frameNumber).zfill(6) + ".jpg")
                frame["has_ignore_regions"] = False
            f = Frame.from_json(frame)
            result = frameManager.createFrame(f)
            if result == 'error':
                return False
        return True
