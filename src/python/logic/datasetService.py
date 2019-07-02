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

    # Method to read a dictionary key that may not exist.
    def safelyReadDictionary(self, dict, key):
        try:
            return dict[key]
        except KeyError:
            return None

    # Method to delete a dictionary key that may not exist. If it doesn't, don't delete.
    # What is deleted may never delete.
    def safelyDeleteDictionaryKey(self, dict, key):
        try:
            del dict[key]
        except KeyError:
            pass

    # Return #frames of videos
    def getFramesVideo(this, dir):
        frames = 0
        if os.path.isdir(dir):
            frames = len(os.listdir(dir))
        return frames

    def checkIntegrityOfAnnotations(this, dirAnnotations, dirImages):
        hasConsistency = True
        for f in os.listdir(dirAnnotations):
            filename, filextension = os.path.splitext(f)
            if not os.path.isdir(dirImages + filename):
                hasConsistency = False
                break
        return hasConsistency

    def checkIntegrity(this, dir):
        isDir = os.path.isdir(dir)
        dirAnnotations = dir + "/annotations"
        dirImages = dir + "/images"
        hasAnnotations = os.path.isdir(dirAnnotations)
        hasImages = os.path.isdir(dirImages)
        hasTest = os.path.isdir(dirImages + "/test") and os.path.isdir(dirAnnotations + "/test")
        hasTrain = os.path.isdir(dirImages + "/train") and os.path.isdir(dirAnnotations + "/train")
        hasVal = os.path.isdir(dirImages + "/val") and os.path.isdir(dirAnnotations + "/val")

        try:
            hasConsistency = this.checkIntegrityOfAnnotations(dirAnnotations + "/test/", dirImages + "/test/")
            hasConsistency *= this.checkIntegrityOfAnnotations(dirAnnotations + "/train/", dirImages + "/train/")
            hasConsistency *= this.checkIntegrityOfAnnotations(dirAnnotations + "/val/", dirImages + "/val/")

            return isDir and hasAnnotations and hasImages and hasTest and hasTrain and hasVal and hasConsistency
        except:
            return False

    # Return the result of storing info wrt different types of datasets
    def addInfo(this, dataset, type):
        if type == this.aik:
            result = this.addInfoAIK(dataset)
        elif type == this.pt:
            result = this.addInfoPt(dataset)
        else:
            result = False, 'Incorrect dataset type', 500
        return result

    ###########################################################################
    ####                           PT INFO METHODS                        ####
    ###########################################################################

    # Store info of posetrack datasets: videos ....
    # TODO: read data
    def addInfoPt(this, dataset):
        # Store info in DB
        resultVideos = this.addVideosPT(dataset)
        resultAnnotations = this.addAnnotationsPT(dataset, os.path.join(this.STORAGE_DIR, dataset))
        if resultVideos == 'Error' or resultAnnotations == 'Error':
            return False, 'Error saving videos in database', 400
        else:
            return True, 'ok', 200

    # Add videos to database from posetrack directory
    # Return true if all videos have been updated, False ow
    def addVideosPT(this, dataset):
        datasetDir = os.path.join(this.STORAGE_DIR, dataset)
        if this.checkIntegrity(datasetDir):
            dirs = ["train", "test", "val"]
            for type in dirs:
                imagesDir = os.path.join(datasetDir, "images/" + type)
                listDir = os.listdir(imagesDir)
                for f in listDir:
                    save_path = os.path.join(imagesDir, f)
                    if os.path.isdir(save_path):
                        result = this.createVideo(f, dataset, save_path, type, frames=this.getFramesVideo(save_path))
                        r, _, _ = result
                        if not r:
                            return result
            return 'ok'
        else:
            return  'Error'

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if it encounters some problem
    def addAnnotationsPT(this, dataset, dir):
        print("annotationsPT")
        # type = 'personPT'  # Type of objects
        finalResult = True
        types = ["test", "train", "val"]
        for type in types:
            dirpath = os.path.join(dir, "annotations/" + type)
            listdir = os.listdir(dirpath)
            for file in listdir:
                tempResult = this.processAnnotationFilePT(dataset, file, dirpath)
                finalResult = finalResult and tempResult

        return 'ok' if finalResult else 'Error'

    def processAnnotationFilePT(this, dataset, file, dir):
        print("Processing annotation file ", file, " from ", dir)
        # Read data from file
        fileRoute = os.path.join(dir, file)
        try:
            with open(fileRoute) as jsonFile:
                annotation = json.load(jsonFile)
        except OSError:
            log.exception('Could not read from file')
            return False

        # Transform annotation to our format and store in db
        frames = this.safelyReadDictionary(annotation, "images")
        categories = this.safelyReadDictionary(annotation, "categories")
        annotations = this.safelyReadDictionary(annotation, "annotations")

        resultFrames = this.addFramesPT(dataset, frames) if frames is not None else print("errorcico") #TODO: Feedback?
        resultAnnotations = False
        resultCategories = False

        return resultFrames and resultAnnotations and resultCategories

    def addFramesPT(this, dataset, frames):
        nFrames = this.safelyReadDictionary(frames[0], "nframes")
        index = 0
        frame = {}
        for frameNumber in range(0, nFrames):           # For every frame in VIDEO (not JSON FILE)
            frameObjectNumber = os.path.splitext(os.path.split(frames[index]["file_name"])[-1])[0]
            # print("frameNumber: ", frameNumber, " frameObjectNumber: ", int(frameObjectNumber), " index: ", index)
            if frameNumber == int(frameObjectNumber):   # If there is data to add
                index += 1                              # Advance index
                frame = dict(frames[frameNumber])       # Reformat object to insert into db
                frame["number"] = frameNumber
                frame["dataset"] = dataset
                frame["video"] = this.safelyReadDictionary(frame, "vid_id")
                this.safelyDeleteDictionaryKey(frame, "vid_id")
                frame["path"] = os.path.join(this.STORAGE_DIR, dataset + "/" +
                                             this.safelyReadDictionary(frame, "file_name"))
                this.safelyDeleteDictionaryKey(frame, "file_name")
                frame["has_ignore_regions"] = False if this.safelyReadDictionary(frame, "ignore_regions_x") is None \
                    else True                           # If it has no ignore regions, store it so we know later.
                this.safelyDeleteDictionaryKey(frame, "ignore_regions_x")
                this.safelyDeleteDictionaryKey(frame, "ignore_regions_y")
            else:                                       # If no data, initialize empty
                frame = dict()
                frame["number"] = frameNumber
                frame["dataset"] = dataset
                frame["video"] = this.safelyReadDictionary(frames[0], "vid_id")
                dirpath = os.path.join(this.STORAGE_DIR, dataset + "/" + os.path.split(frames[index]["file_name"])[-2])
                frame["path"] = os.path.join(dirpath, str(frameNumber).zfill(6) + ".jpg")
                frame["has_ignore_regions"] = False
                print("Saving frame: ", frame)
            result = frameManager.createFrame(frame)
            if result == 'error':
                return False
        return True


    ###########################################################################
    ####                           AIK INFO METHODS                        ####
    ###########################################################################

    # Store info of AIK datasets: videos, annotations and camera params by frame
    def addInfoAIK(this, dataset):
        # Directories for AIK datasets
        datasetDir = os.path.join(this.STORAGE_DIR, dataset)
        videosDir = os.path.join(datasetDir, 'videos/')
        camerasDir = os.path.join(datasetDir, 'cameras/')
        annotationsDir = os.path.join(datasetDir, 'tracks3d/')

        # Store info in DB
        resultVideos = this.addVideosAIK(dataset, videosDir)
        resultCameras = this.addFrameAIK(dataset, camerasDir, videosDir)
        resultAnnotations = this.addAnnotationsAIK(dataset, annotationsDir)

        if resultVideos == 'Error':
            return False, 'Error saving videos in database', 400
        elif resultCameras == 'Error':
            return False, 'Error saving camera parameters in database', 400
        elif resultAnnotations == 'Error':
            return False, 'Error saving annotations in database', 400
        else:
            return True, 'ok', 200

    # Add videos to database from videos directory
    # Return true if all videos have been updated, False ow
    def addVideosAIK(this, dataset, dir):
        listDir = os.listdir(dir)
        for f in listDir:
            videoDir = os.path.join(dir, f)
            if os.path.isdir(videoDir):
                result = this.createVideo(f, dataset, videoDir, this.aik, frames=this.getFramesVideo(videoDir))
                r, _, _ = result
                if not r:
                    return False
        return True

    # Add camera parameters to frames in database from camera directory
    # Return true if all have been updated, False ow
    def addFrameAIK(this, dataset, dir, videosDir):
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
    def addAnnotationsAIK(this, dataset, dir):
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

    def createVideo(this, file, dataset, save_path, type, frames=0):
        result = videoManager.createVideo(file, dataset, save_path, type=type, frames=frames)
        if result == 'Error':
            return False, 'Error creating video', 400
        else:
            return True, 'ok', 200

    def processDataset(this, save_path, filename, type):
        zip = zipfile.ZipFile(save_path, 'r')
        zip.extractall(this.STORAGE_DIR)
        dataset, _ = os.path.splitext(filename)
        kpDim = '3D'    # TODO: how to check this?

        # TODO: check integrity for AIK
        integrity = this.checkIntegrity(this.STORAGE_DIR + dataset) if type == this.pt else True
        if integrity:
            os.remove(this.STORAGE_DIR + filename)  # Remove zip file
            result = datasetManager.createDataset(dataset, type, kpDim)
            if result == 'Error':
                return False, 'Error creating dataset in database', 500
            else:
                return True, result, 200
        else:
            shutil.rmtree(this.STORAGE_DIR + dataset)
            os.remove(this.STORAGE_DIR + filename)
            return False, 'Error on folder subsystem, check your file and try again', 400

    # Store item of a dataset in corresponding folder in $STORAGE_DIR
    def storeZip(this, request):
        file = request.files['file']
        type = request.headers['type']

        save_path = os.path.join(this.STORAGE_DIR, secure_filename(file.filename))
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
                return this.processDataset(save_path, file.filename, type)

        else:
            log.debug('Chunk %s of %s for %s', current_chunk + 1, total_chunks, file.filename)
        return True, 'ok', 200

    # Convert bytes to MB, GB, etc
    def convert_bytes(this, num):
        """
        this function will convert bytes to MB.... GB... etc
        """
        for x in ['bytes', 'KB', 'MB', 'GB', 'TB']:
            if num < 1024.0:
                return "%3.1f %s" % (num, x)
            num /= 1024.0

    # Return a list of zip files in the root file system
    def getZipFiles(this):
        listDir = os.listdir(this.STORAGE_DIR)
        zipFiles = []
        for file in listDir:
            if file.endswith(".zip"):
                size = os.stat(os.path.join(this.STORAGE_DIR, file)).st_size
                zipFiles.append({
                    "name": file,
                    "size": this.convert_bytes(size)
                })
        return True, zipFiles, 200

    def loadZip(this, filename, type):
        save_path = os.path.join(this.STORAGE_DIR, secure_filename(filename))
        return this.processDataset(save_path, filename, type)

    # Return info videos, duration and frames
    def getVideos(this, dataset):
        result = videoManager.getVideos(dataset)
        if result == 'Error':
            return False, 'Error pulling videos from database', 400
        else:
            return True, result, 200

    # Return the corresponding frame of video
    def getVideoFrame(this, video, frame, dataset):
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
    def updateVideosFrames(this, dataset):
        dataset, _ = os.path.splitext(dataset)
        videosInDataset = videoManager.getVideos(dataset)
        if videosInDataset != 'Error':
            for video in videosInDataset:
                frames = this.getFramesVideo(video['path'])
                result = videoManager.updateVideoFrames(video['name'], frames, dataset)
                if result == 'Error':
                    return False, 'Error updating video frames'
            return True, 'ok', 200
        else:
            return False, 'No videos for this dataset', 400

    # Return dataset info
    def getDataset(this, dataset):
        result = datasetManager.getDataset(dataset)
        if result == 'Error':
            return False, 'Incorrect dataset', 400
        else:
            return True, result, 200

    # Return datasets info
    def getDatasets(this):
        result = datasetManager.getDatasets()
        if result == 'Error':
            return False, 'Error searching datasets', 400
        else:
            return True, result, 200

    # Remove dataset, videos and frames in DB and folder corresponding to dataset
    # Remove corresponding annotations
    # Return 'ok' if the dataset has been removed
    def removeDataset(this, dataset):
        try:
            datasetDir = this.STORAGE_DIR + dataset + "/"

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
    def createDataset(this, req):
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
                return this.addVideosAIK(name) if type == this.aik else this.addVideosPT(name)
