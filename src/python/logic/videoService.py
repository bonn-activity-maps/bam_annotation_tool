import os
import base64
import logging


from python.logic.frameService import FrameService
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.frameManager import FrameManager

from python.objects.frame import Frame
from python.objects.video import Video
from python.objects.dataset import Dataset

frameService = FrameService()
videoManager = VideoManager()
frameManager = FrameManager()

# VideoService logger
log = logging.getLogger('videoService')

class VideoService:

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Return info of video
    def get_video(self, video):
        result = videoManager.get_video(video)
        if result == 'Error':
            return False, 'Error pulling video from database', 400
        else:
            return True, result.to_json(), 200

    # Return all info of videos
    def get_videos(self, dataset):
        result = videoManager.get_videos(dataset)
        if result == 'Error':
            return False, 'Error pulling videos from database', 400
        else:
            return True, [r.to_json() for r in result], 200

    # Return max frame of video
    # PT: total #frames is not the last frame
    def get_max_frame(self, video):
        if video.dataset.is_pt():
            result, frames = frameService.get_frame_info_of_video(video)
            if not result:
                return False, 'Error getting max frame', 400
            else:
                return True, {"frames": frames[1].number}, 200

        else:
            result = videoManager.get_video(video)

            if result == 'Error':
                return False, 'Error getting max frame', 400
            else:
                return True, {"frames": result.frames}, 200

    # Return min frame of video
    # PT: change the 1st frame for each video
    def get_min_frame(self, video):
        if video.dataset.is_pt():
            result, frames = frameService.get_frame_info_of_video(video)

            if not result:
                return False, 'Error getting min frame', 400
            else:
                return True, {"frames": frames[0].number}, 200
        else:
            # AIK: first frame always 1 (info not stored in db)
            return True, {"frames": 1}, 200

    # Return the corresponding range of frames in video
    def get_video_frames(self, video, start_frame, end_frame):
        imgs = []
        for frame in range(start_frame, end_frame + 1):
            # Get path of frame
            f = Frame(frame, video.name, video.dataset)
            f = frameManager.get_frame(f)
            # Read file as binary, encode to base64 and remove newlines
            if os.path.isfile(f.path):
                with open(f.path, "rb") as image_file:
                    encoded_image = base64.b64encode(image_file.read())
                    imgs.append({'image': str(encoded_image).replace("\n", ""), 'filename': video.name, 'frame': f.number})
        return True, imgs, 200

    # Return 'ok' if the video has been created
    def create_video(self, video):
        result = videoManager.create_video(video)
        if result == 'Error':
            return False, 'Error creating video', 400
        else:
            return True, 'ok', 200

    # Return #frames of videos in directory dir
    def get_frames_video(self, dir):
        frames = 0
        if os.path.isdir(dir):
            frames = len(os.listdir(dir))
        return frames

    # Add videos to database from videos directory
    # Return true if all videos have been updated, False ow
    def add_videos_AIK(self, dataset, dir):
        list_dir = os.listdir(dir)
        for f in list_dir:
            # Get id of camera and save it instead of name
            camera = int(f.split("camera")[1])

            video_dir = os.path.join(dir, f)
            if os.path.isdir(video_dir):
                video = Video(camera, dataset, video_dir, self.get_frames_video(video_dir), dataset.aik)
                result = videoManager.create_video(video)
                if result == 'Error':
                    return False
        return True

    # Add videos to database from posetrack directory
    # Return true if all videos have been updated, False ow
    def add_videos_PT(self, dataset):
        # if self.check_integrity_PT(datasetDir):
        dirs = ["train", "test", "val"]
        for type in dirs:
            try:
                images_dir = os.path.join(dataset.dir, "images/" + type)
                list_dir = os.listdir(images_dir)
                for f in list_dir:
                    save_path = os.path.join(images_dir, f)
                    if os.path.isdir(save_path):
                        video = Video(f.split('_')[0], dataset, save_path, self.get_frames_video(save_path), type)
                        result = videoManager.create_video(video)
                        if result == 'Error':
                            return result
            except FileNotFoundError:
                log.exception("Folder called " + str(type) + " not found")
        return 'ok'
        # else:
        #     return  'Error'

    # # Update frames of videos in DB
    # def update_videos_frames(self, dataset):
    #     dataset, _ = os.path.splitext(dataset)
    #     videosInDataset = videoManager.get_videos(dataset)
    #     if videosInDataset != 'Error':
    #         for video in videosInDataset:
    #             frames = self.get_frames_video(video['path'])
    #             result = videoManager.updateVideoFrames(video['name'], frames, dataset)
    #             if result == 'Error':
    #                 return False, 'Error updating video frames'
    #         return True, 'ok', 200
    #     else:
    #         return False, 'No videos for this dataset', 400
