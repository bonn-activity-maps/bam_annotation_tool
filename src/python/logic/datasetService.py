import os, subprocess, json, shutil
import cv2
import logging
from werkzeug.utils import secure_filename
import moviepy.editor as mp
import base64
import zipfile

from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.frameManager import FrameManager
from python.logic.annotationService import AnnotationService

# DatasetService logger
log = logging.getLogger('datasetService')

datasetManager = DatasetManager()
videoManager = VideoManager()
annotationManager = AnnotationManager()
frameManager = FrameManager()
annotationService = AnnotationService()


class DatasetService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the videos
    ffmpeg = '/usr/bin/ffmpeg'  # Path to ffmpeg
    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Return #frames of videos
    def getFramesVideo(self, dir):
        frames = 0
        if os.path.isdir(dir):
            frames = len(os.listdir(dir))
        return frames

    def checkIntegrityOfAnnotations(self, dirAnnotations, dirImages):
        hasConsistency = True
        for f in os.listdir(dirAnnotations):
            filename, filextension = os.path.splitext(f)
            if not os.path.isdir(dirImages + filename):
                hasConsistency = False
                break
        return hasConsistency

    def checkIntegrity(self, dir):
        isDir = os.path.isdir(dir)
        dirAnnotations = dir + "/annotations"
        dirImages = dir + "/images"
        hasAnnotations = os.path.isdir(dirAnnotations)
        hasImages = os.path.isdir(dirImages)
        hasTest = os.path.isdir(dirImages + "/test") and os.path.isdir(dirAnnotations + "/test")
        hasTrain = os.path.isdir(dirImages + "/train") and os.path.isdir(dirAnnotations + "/train")
        hasVal = os.path.isdir(dirImages + "/val") and os.path.isdir(dirAnnotations + "/val")

        try:
            hasConsistency = self.checkIntegrityOfAnnotations(dirAnnotations + "/test/", dirImages + "/test/")
            hasConsistency *= self.checkIntegrityOfAnnotations(dirAnnotations + "/train/", dirImages + "/train/")
            hasConsistency *= self.checkIntegrityOfAnnotations(dirAnnotations + "/val/", dirImages + "/val/")

            return isDir and hasAnnotations and hasImages and hasTest and hasTrain and hasVal and hasConsistency
        except:
            return False

    # Return the result of storing info wrt different types of datasets
    def addInfo(self, dataset, type):
        if type == self.aik:
            result = self.addInfoAIK(dataset)
        elif type == self.pt:
            result = self.addInfoPt(dataset)
        else:
            result = False, 'Incorrect dataset type', 500
        return result

    # Store info of AIK datasets: videos, annotations and camera params by frame
    def addInfoAIK(self, dataset):
        # Directories for AIK datasets
        datasetDir = os.path.join(self.STORAGE_DIR, dataset)
        videosDir = os.path.join(datasetDir, 'videos/')
        camerasDir = os.path.join(datasetDir, 'cameras/')
        annotationsDir = os.path.join(datasetDir, 'tracks3d/')

        # Store info in DB
        resultVideos = self.addVideosAIK(dataset, videosDir)
        resultCameras = self.addFrameAIK(dataset, camerasDir, videosDir)
        resultAnnotations = self.addAnnotationsAIK(dataset, annotationsDir)

        if resultVideos == 'Error':
            return False, 'Error saving videos in database', 400
        elif resultCameras == 'Error':
            return False, 'Error saving camera parameters in database', 400
        elif resultAnnotations == 'Error':
            return False, 'Error saving annotations in database', 400
        else:
            return True, 'ok', 200

    # Store info of posetrack datasets: videos ....
    # TODO: read data
    def addInfoPt(self, dataset):
        # Store info in DB
        resultVideos = self.addVideosPT(dataset)

        if resultVideos == 'Error':
            return False, 'Error saving videos in database', 400
        else:
            return True, 'ok', 200

    # Add videos to database from videos directory
    # Return true if all videos have been updated, False ow
    def addVideosAIK(self, dataset, dir):
        listDir = os.listdir(dir)
        for f in listDir:
            videoDir = os.path.join(dir, f)
            if os.path.isdir(videoDir):
                result = self.createVideo(f, dataset, videoDir, self.aik, frames=self.getFramesVideo(videoDir))
                r, _, _ = result
                if not r:
                    return False
        return True

    # Add camera parameters to annotations in database from camera directory
    # Return true if all have been updated, False ow
    def addFrameAIK(self, dataset, dir, videosDir):
        listDir = os.listdir(dir)
        for camera in listDir:                   # for all cameras/videos
            cameraDir = os.path.join(dir, camera)           # Directory for camera parameters
            frameDir = os.path.join(videosDir, camera)      # Directory for frames
            if os.path.isdir(cameraDir):         # each frame in each camera
                frames = os.listdir(cameraDir)
                for fr in frames:
                    # Read number of frame
                    frame = int(os.path.splitext(fr)[0].split('frame')[1])

                    # Read file of camera parameters
                    frameFile = os.path.join(cameraDir, fr)
                    try:
                        with open(frameFile) as jsonFile:
                            camParams = json.load(jsonFile)
                    except OSError:
                        log.exception('Could not read from file')
                        return False

                    # Obtain path of frames.png in videos folder
                    frameVideoFile = os.path.splitext(fr)[0]+'.png'
                    framePath = os.path.join(frameDir, frameVideoFile)

                    # Create dictionary with frame, video, dataset, path and camera parameters and store it in db
                    frameDictionary = {"number": frame, "video": camera, "dataset": dataset, "path": framePath,
                                       "cameraParameters": camParams}
                    result = frameManager.createFrame(frameDictionary)
                    if result == 'Error':
                        return False
        return True

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if has been some problem
    def addAnnotationsAIK(self, dataset, dir):
        listDir = os.listdir(dir)   # List of all objects/persons
        type = 'personAIK'          # Type of objects
        finalResult = True

        for f in listDir:
            trackFile = os.path.join(dir, f)

            # Read uid/number of object
            uid = int(os.path.splitext(f)[0].split('track')[1])

            # Read data from file
            try:
                with open(trackFile) as jsonFile:
                    tracks = json.load(jsonFile)
            except OSError:
                log.exception('Could not read from file')
                return False

            # Transform annotation to our format and store in db
            frames = tracks['frames']
            poses = tracks['poses']
            for i, frame in enumerate(frames):
                keypoints = poses[i]
                objects = {"uid": uid, "type": type, "keypoints": keypoints}
                result = annotationService.updateAnnotationFrameObject(dataset, dataset, frame, 'root', objects)
                if result == 'Error': finalResult = False   # finalResult False if there is some problem

        return finalResult

    # Add videos to database from posetrack directory
    # Return true if all videos have been updated, False ow
    def addVideosPT(self, dataset):
        datasetDir = os.path.join(self.STORAGE_DIR, dataset)
        if self.checkIntegrity(datasetDir):
            dirs = ["train", "test", "val"]
            for type in dirs:
                imagesDir = os.path.join(datasetDir, "images/" + type)
                listDir = os.listdir(imagesDir)
                for f in listDir:
                    save_path = os.path.join(imagesDir, f)
                    if os.path.isdir(save_path):
                        result = self.createVideo(f, dataset, save_path, type, frames=self.getFramesVideo(save_path))
                        r, _, _ = result
                        if not r:
                            return result
            return True, 'ok', 200
        else:
            return False, 'Error: Incomplete data.', 400

    def createVideo(self, file, dataset, save_path, type, frames=0):
        result = videoManager.createVideo(file, dataset, save_path, type=type, frames=frames)
        if result == 'Error':
            return False, 'Error creating video', 400
        else:
            return True, 'ok', 200

    def processDataset(self, save_path, filename, type):
        zip = zipfile.ZipFile(save_path, 'r')
        zip.extractall(self.STORAGE_DIR)
        dataset, _ = os.path.splitext(filename)
        kpDim = '3D'    # TODO: how to check self?

        # TODO: check integrity for AIK
        integrity = self.checkIntegrity(self.STORAGE_DIR + dataset) if type == self.pt else True
        if integrity:
            os.remove(self.STORAGE_DIR + filename)  # Remove zip file
            result = datasetManager.createDataset(dataset, type, kpDim)
            if result == 'Error':
                return False, 'Error creating dataset in database', 500
            else:
                return True, result, 200
        else:
            shutil.rmtree(self.STORAGE_DIR + dataset)
            os.remove(self.STORAGE_DIR + filename)
            return False, 'Error on folder subsystem, check your file and try again', 400

    # Store item of a dataset in corresponding folder in $STORAGE_DIR
    def storeZip(self, request):
        file = request.files['file']
        type = request.headers['type']

        save_path = os.path.join(self.STORAGE_DIR, secure_filename(file.filename))
        current_chunk = int(request.form['dzchunkindex'])

        # If the file exists and is the first chunk, you cannot overwrite it
        if os.path.exists(save_path) and current_chunk == 0:
            return False, 'File already exists', 400

        # Write chunks at the end of the file
        try:
            with open(save_path, 'ab') as f:
                f.seek(int(request.form['dzchunkbyteoffset']))
                f.write(file.stream.read())
        except OSError:
            log.exception('Could not write to file')
            return False, 'Server error while writing to the file', 500

        total_chunks = int(request.form['dztotalchunkcount'])

        # If it is the last chunk, check if it is complete and unwrap
        if current_chunk + 1 == total_chunks:
            if os.path.getsize(save_path) != int(request.form['dztotalfilesize']):
                log.error('File %s was completed, but has a size mismatch.'
                          ' Was %s but we expected %s', file.filename,
                          os.path.getsize(save_path), request.form['dztotalfilesize'])
                return False, 'Error in the size of file', 500
            else:
                log.warning('File %s has been uploaded successfully', file.filename)
                return self.processDataset(save_path, file.filename, type)

        else:
            log.debug('Chunk %s of %s for %s', current_chunk + 1, total_chunks, file.filename)
        return True, 'ok', 200

    # Convert bytes to MB, GB, etc
    def convert_bytes(self, num):
        """
        self function will convert bytes to MB.... GB... etc
        """
        for x in ['bytes', 'KB', 'MB', 'GB', 'TB']:
            if num < 1024.0:
                return "%3.1f %s" % (num, x)
            num /= 1024.0

    # Return a list of zip files in the root file system
    def getZipFiles(self):
        listDir = os.listdir(self.STORAGE_DIR)
        zipFiles = []
        for file in listDir:
            if file.endswith(".zip"):
                size = os.stat(os.path.join(self.STORAGE_DIR, file)).st_size
                zipFiles.append({
                    "name": file,
                    "size": self.convert_bytes(size)
                })
        return True, zipFiles, 200

    def loadZip(self, filename, type):
        save_path = os.path.join(self.STORAGE_DIR, secure_filename(filename))
        return self.processDataset(save_path, filename, type)

    # Return info videos, duration and frames
    def getVideos(self, dataset):
        result = videoManager.getVideos(dataset)
        if result == 'Error':
            return False, 'Error pulling videos from database', 400
        else:
            return True, result, 200

    # Return the corresponding frame of video
    def getVideoFrame(self, video, frame, dataset):
        # Get path of frame
        framePath = frameManager.getFramePath(frame, video, dataset)['path']

        # Read file as binary, encode to base64 and remove newlines
        if os.path.isfile(framePath):
            with open(framePath, "rb") as image_file:
                encodedImage = base64.b64encode(image_file.read())
                return True, {'image': str(encodedImage).replace("\n", ""), 'filename': video, 'frame': frame}, 200
        else:
            return False, 'Frame does not exist', 500

    # Update frames of videos in DB
    def updateVideosFrames(self, dataset):
        dataset, _ = os.path.splitext(dataset)
        videosInDataset = videoManager.getVideos(dataset)
        if videosInDataset != 'Error':
            for video in videosInDataset:
                frames = self.getFramesVideo(video['path'])
                result = videoManager.updateVideoFrames(video['name'], frames, dataset)
                if result == 'Error':
                    return False, 'Error updating video frames'
            return True, 'ok', 200
        else:
            return False, 'No videos for self dataset', 400

    # Return dataset info
    def getDataset(self, dataset):
        result = datasetManager.getDataset(dataset)
        if result == 'Error':
            return False, 'Incorrect dataset', 400
        else:
            return True, result, 200

    # Return datasets info
    def getDatasets(self):
        result = datasetManager.getDatasets()
        if result == 'Error':
            return False, 'Error searching datasets', 400
        else:
            return True, result, 200

    # Remove dataset, videos and frames in DB and folder corresponding to dataset
    # Remove corresponding annotations
    # Return 'ok' if the dataset has been removed
    def removeDataset(self, dataset):
        try:
            datasetDir = self.STORAGE_DIR + dataset + "/"

            # Remove folder
            shutil.rmtree(datasetDir)
            log.info('Removed ', dataset, ' successfully.')

            # Remove videos and dataset in DB
            resultVideos = videoManager.removeVideosByDataset(dataset)
            resultDataset = datasetManager.removeDataset(dataset)
            resultAnnotations = annotationManager.removeAnnotationsByDataset(dataset)
            resultFrames = frameManager.removeFramesByDataset(dataset)

            if resultVideos == 'Error':
                return False, 'Error deleting videos in dataset', 400
            elif resultDataset == 'Error':
                return False, 'Error deleting dataset', 400
            elif resultAnnotations == 'Error':
                return False, 'Error deleting annotations', 400
            elif resultFrames == 'Error':
                return False, 'Error deleting frames', 400
            else:
                return True, 'ok', 200
        except OSError:
            log.exception('Error deleting the dataset in file system')
            return False, 'Server error deleting the dataset', 500

    # Return dataset name if it has been created
    def createDataset(self, req):
        name, _ = os.path.splitext(req['name'])
        type = req['type']
        # Check if datasets exists
        if datasetManager.getDataset(name) != 'Error':
            return False, 'The dataset ' + name + ' already exists', 400
        else:
            result = datasetManager.createDataset(name, type)
            if result == 'Error':
                return False, 'Error creating dataset', 400
            else:
                return self.addVideosAIK(name) if type == self.aik else self.addVideosPT(name)
