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
        init_frame_number = int(os.path.splitext(os.path.split(frames[0]["file_name"])[-1])[0])
        n_frames = ptService.safely_read_dictionary(frames[0], "nframes")
        index = 0
        frame = {}
        for frame_number in range(0, n_frames):     # For every frame in VIDEO (not JSON FILE)
            frame_object_number = os.path.splitext(os.path.split(frames[index]["file_name"])[-1])[0]
            # print("n_frames: ", n_frames, " frame_number: ", frame_number + init_frame_number, " frame_object_number: ", int(frame_object_number))
            if (frame_number + init_frame_number) == int(frame_object_number):   # If there is data to add
                index += 1                              # Advance index
                frame = dict(frames[frame_number])       # Reformat object to insert into db
                frame["number"] = frame_number + init_frame_number
                frame["dataset"] = dataset.name
                frame["video"] = ptService.safely_read_dictionary(frame, "vid_id")
                ptService.safely_delete_dictionary_key(frame, "vid_id")
                ptService.safely_delete_dictionary_key(frame, "vid_id")
                frame["path"] = os.path.join(dataset.STORAGE_DIR, dataset.name + "/" +
                                             ptService.safely_read_dictionary(frame, "file_name"))
                ptService.safely_delete_dictionary_key(frame, "file_name")
                frame["has_ignore_regions"] = False if ptService.safely_read_dictionary(frame, "ignore_regions_x") is None \
                    else True                           # If it has no ignore regions, store it so we know later.
                ptService.safely_delete_dictionary_key(frame, "ignore_regions_x")
                ptService.safely_delete_dictionary_key(frame, "ignore_regions_y")
            else:       # If no data, initialize empty
                frame = dict()
                frame["number"] = frame_number + init_frame_number
                frame["dataset"] = dataset.name
                frame["video"] = ptService.safely_read_dictionary(frames[0], "vid_id")
                dirpath = os.path.join(dataset.STORAGE_DIR, dataset.name + "/" + os.path.split(frames[index]["file_name"])[-2])
                frame["path"] = os.path.join(dirpath, str(frame_number).zfill(6) + ".jpg")
                frame["has_ignore_regions"] = False

            f = Frame.from_json(frame)
            result = frameManager.create_frame(f)
            if result == 'error':
                return False
        return True

    # Update camera calibration parameters
    def update_camera_calibration(self, dataset):
        path = os.path.join(dataset.STORAGE_DIR, 'new_camera_calibration', dataset.name)

        # Read files of cameras in path
        for file in os.listdir(path):
            print('file: ', file)
            file = os.path.join(path, file)
            if os.path.isfile(file):
                try:
                    with open(file) as json_file:
                        camera_parameters = json.load(json_file)
                except OSError:
                    log.exception('Could not read from file')
                    return False, 'Error reading camera calibration, please check the file '+file, 500

                # Get video info
                if dataset.name == '181129_unroll' and camera_parameters['name'] == '12':
                    video = Video(12, dataset, frames=64862)
                else:
                    video = videoManager.get_video(Video(camera_parameters['name'], dataset))
                    if video == 'Error':
                        return False, 'Error updating camera calibration, please check the database', 500

                print('video: ', video.name)
                new_cam_params = {
                    'K': camera_parameters['K'],
                    'rvec': camera_parameters['R'],
                    'tvec': camera_parameters['t'],
                    'dist_coef': camera_parameters['distCoef'],
                    'w': camera_parameters['imgSize'][0],
                    'h': camera_parameters['imgSize'][1]
                }
                start_frame = 1
                end_frame = video.frames

                # 181129 dataset frames 0 until 25895 for camera03 use calibration from camera03.json,
                if dataset.name == '181129_unroll' and video.name == 3:
                    end_frame = 25895

                # Update camera calibration parameters in database for all frames
                result = frameManager.update_frames_camera_calibration(dataset, video, start_frame, end_frame+1, new_cam_params)
                if result == 'Error':
                    return False, 'Error updating camera calibration, please check the database', 500

                # 181129 dataset frames after 25895 for camera03 use calibration from camera12.json
                if dataset.name == '181129_unroll' and video.name == 12:
                    start_frame = 25896
                    video.name = 3
                    result = frameManager.update_frames_camera_calibration(dataset, video, start_frame, end_frame+1, new_cam_params)
                    if result == 'Error':
                        return False, 'Error updating camera calibration, please check the database', 500

        return True, 'Camera parameters updated successfully!', 200

