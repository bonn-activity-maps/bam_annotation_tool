import os, subprocess, json, shutil
import logging
from werkzeug.utils import secure_filename
import base64
import zipfile
from aik.dataset import AIK

from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.videoManager import VideoManager
from python.infrastructure.annotationManager import AnnotationManager
from python.infrastructure.actionManager import ActionManager
from python.infrastructure.frameManager import FrameManager
from python.logic.frameService import FrameService
from python.logic.annotationService import AnnotationService
from python.logic.objectTypeService import ObjectTypeService


# DatasetService logger
log = logging.getLogger('datasetService')

datasetManager = DatasetManager()
videoManager = VideoManager()
annotationManager = AnnotationManager()
actionManager = ActionManager()
frameManager = FrameManager()
frameService = FrameService()
annotationService = AnnotationService()
objectTypeService = ObjectTypeService()

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

    # Transform point from XYWH to XYXY. w = width, h = height values from x1, y1. XYWH = posetrack XYXY = tool
    def transformToXYXY(self, points):
        x, y = points[0]
        w, h = points[1]

        return [[x, y], [x + w, y + h]]

    # Transform point from XYXY to XYWH. w = width, h = height values from x1, y1. XYWH = posetrack XYXY = tool
    def transformToXYWH(self, points):
        x1, y1 = points[0]
        x2, y2 = points[1]

        return [[x1, y1], [x2 - x1, y2 - y1]]

    # Return #frames of videos
    def getFramesVideo(self, dir):
        frames = 0
        if os.path.isdir(dir):
            frames = len(os.listdir(dir))
        return frames

    # PT: Check integrity of annotations
    # AIK: Check integrity of cameras and videos (for aik)
    def checkIntegrityOfAnnotations(self, dirAnnotations, dirImages):
        hasConsistency = True
        for f in os.listdir(dirAnnotations):
            filename, filextension = os.path.splitext(f)
            if not os.path.isdir(dirImages + filename):
                hasConsistency = False
                break
        return hasConsistency

    # Check integrity for posetrack datasets
    def checkIntegrityPT(self, dir):
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
            log.exception('Error checking integrity of zip')
            return False

    # Check integrity for aik datasets
    def checkIntegrityAIK(self, dir):
        # Directories and files
        dirCameras = dir + "/cameras"
        dirVideos = dir + "/videos"
        dirPoses = dir + "/poses"
        fileDataset = dir + "/dataset.json"

        # Check dirs and files
        isDir = os.path.isdir(dir)
        hasCameras = os.path.isdir(dirCameras)
        hasVideos = os.path.isdir(dirVideos)
        hasPoses = os.path.isdir(dirPoses)
        hasDataset = os.path.isfile(fileDataset)

        try:
            hasConsistency = self.checkIntegrityOfAnnotations(dirCameras, dirVideos+"/")

            return isDir and hasCameras and hasVideos and hasPoses and hasDataset and hasConsistency
        except:
            log.exception('Error checking integrity of zip')
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

    ###########################################################################
    ####                           PT INFO METHODS                        ####
    ###########################################################################

    # Store info of posetrack datasets: videos ....
    # TODO: read data
    def addInfoPt(self, dataset):
        # Store info in DB
        resultVideos = self.addVideosPT(dataset)
        resultAnnotations = self.readAnnotationsPT(dataset, os.path.join(self.STORAGE_DIR, dataset))
        if resultVideos == 'Error' or resultAnnotations == 'Error':
            return False, 'Error saving videos in database', 400
        else:
            return True, 'ok', 200

    # Add videos to database from posetrack directory
    # Return true if all videos have been updated, False ow
    def addVideosPT(self, dataset):
        datasetDir = os.path.join(self.STORAGE_DIR, dataset)
        # if self.checkIntegrityPT(datasetDir):
        dirs = ["train", "test", "val"]
        for type in dirs:
            try:
                imagesDir = os.path.join(datasetDir, "images/" + type)
                listDir = os.listdir(imagesDir)
                for f in listDir:
                    save_path = os.path.join(imagesDir, f)
                    if os.path.isdir(save_path):
                        result = self.createVideo(f.split('_')[0], dataset, save_path, type, frames=self.getFramesVideo(save_path))
                        r, _, _ = result
                        if not r:
                            return result
            except FileNotFoundError:
                log.exception("Folder called " + str(type) + " not found")
        return 'ok'
        # else:
        #     return  'Error'

    # Add annotation of objects to database from videos directory
    # Return true if all annotation have been updated, False if it encounters some problem
    def readAnnotationsPT(self, dataset, dir):
        # print("annotationsPT")
        # type = 'personPT'  # Type of objects
        finalResult = True
        types = ["test", "train", "val"]
        for type in types:
            try:
                dirpath = os.path.join(dir, "annotations/" + type)
                listdir = os.listdir(dirpath)
                for file in listdir:
                    filename, filextension = os.path.splitext(file)
                    if filextension == '.json':
                        tempResult = self.processAnnotationFilePT(dataset, file, dirpath)
                    finalResult = finalResult   # and tempResult # TODO check in the future
            except FileNotFoundError:
                # TODO Check if this is still the case in the future...
                log.exception("Folder called " + str(type) + " not found")
        return 'ok' if finalResult else 'Error'

    # Process one file entirely from JSON to our DB, including images, categories and anotations info.
    def processAnnotationFilePT(self, dataset, file, dir):
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
        frames = self.safelyReadDictionary(annotation, "images")
        categories = self.safelyReadDictionary(annotation, "categories")
        annotations = self.safelyReadDictionary(annotation, "annotations")

        try:
            resultCategories = self.addCategoriesPT(categories) if categories is not None else True
        except:
            log.exception("Error while processing Categories")
            resultCategories = True
        try:
            resultFrames = self.addFramesPT(dataset, frames) if frames is not None else True
        except:
            log.exception("Error while processing Frames")
            resultFrames = True
        try:
            resultAnnotations = self.addAnnotationsPT(dataset, annotations) if annotations is not None else True
        except:
            log.exception("Error while processing Annotations")
            resultAnnotations = True

        return resultFrames and resultAnnotations and resultCategories

    def addFramesPT(self, dataset, frames):
        initFrameNumber = int(os.path.splitext(os.path.split(frames[0]["file_name"])[-1])[0])
        nFrames = self.safelyReadDictionary(frames[0], "nframes")
        index = 0
        frame = {}
        for frameNumber in range(0, nFrames):     # For every frame in VIDEO (not JSON FILE)
            frameObjectNumber = os.path.splitext(os.path.split(frames[index]["file_name"])[-1])[0]
            # print("NFRAMES: ", nFrames, " FRAMENUMBER: ", frameNumber + initFrameNumber, " FRAMEOBJECTNUMBER: ", int(frameObjectNumber))
            if (frameNumber + initFrameNumber) == int(frameObjectNumber):   # If there is data to add
                index += 1                              # Advance index
                frame = dict(frames[frameNumber])       # Reformat object to insert into db
                # frame["image_id"] = self.safelyReadDictionary(frame, "frame_id")
                frame["number"] = frameNumber + initFrameNumber
                frame["dataset"] = dataset
                frame["video"] = self.safelyReadDictionary(frame, "vid_id")
                self.safelyDeleteDictionaryKey(frame, "vid_id")
                frame["path"] = os.path.join(self.STORAGE_DIR, dataset + "/" +
                                             self.safelyReadDictionary(frame, "file_name"))
                self.safelyDeleteDictionaryKey(frame, "file_name")
                frame["has_ignore_regions"] = False if self.safelyReadDictionary(frame, "ignore_regions_x") is None \
                    else True                           # If it has no ignore regions, store it so we know later.
                self.safelyDeleteDictionaryKey(frame, "ignore_regions_x")
                self.safelyDeleteDictionaryKey(frame, "ignore_regions_y")
            else:       # If no data, initialize empty
                frame = dict()
                frame["number"] = frameNumber + initFrameNumber
                frame["dataset"] = dataset
                frame["video"] = self.safelyReadDictionary(frames[0], "vid_id")
                dirpath = os.path.join(self.STORAGE_DIR, dataset + "/" + os.path.split(frames[index]["file_name"])[-2])
                frame["path"] = os.path.join(dirpath, str(frameNumber).zfill(6) + ".jpg")
                frame["has_ignore_regions"] = False
            result = frameService.createFrame(frame)
            if result == 'error':
                return False
        return True

    def addAnnotationsPT(self, dataset, annotations):

        for annotation in annotations:
            image_id = self.safelyReadDictionary(annotation, "image_id")
            # Read invariable data
            track_id = self.safelyReadDictionary(annotation, "track_id")
            category_id = 1
            id = self.safelyReadDictionary(annotation, "id")
            result, og_frame, _ = frameService.getFrameByID(image_id, dataset)
            og_objects = []
            # Read variable data (Data that may or may not be
            try:
                bbox_head = self.safelyReadDictionary(annotation, "bbox_head")
                bbox_head_keypoints = [[bbox_head[0], bbox_head[1]],
                                  [bbox_head[2], bbox_head[3]]]
                # Create object for bbox_head and add it to the objects list
                object_bbox_head = {
                    "uid": id,
                    "type": "bbox_head",
                    "keypoints": self.transformToXYXY(bbox_head_keypoints),
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_bbox_head)     # Append new object
            except:
                log.exception("Error reading bbox_head")
            try:
                bbox = self.safelyReadDictionary(annotation, "bbox")
                bbox_keypoints = [[bbox[0], bbox[1]],
                                  [bbox[2], bbox[3]]]
                object_bbox = {
                    "uid": id,
                    "type": "bbox",
                    "keypoints": self.transformToXYXY(bbox_keypoints),
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_bbox)          # Append new object
            except:
                log.exception("Error reading bbox")
            keypoints = self.safelyReadDictionary(annotation, "keypoints")
            person_keypoints = []   # Keypoints of the skeleton, ordered
            # Create array of 3d keypoints (z = visibility)
            try:
                for i in range(0, len(keypoints), 3):
                    person_keypoints.append([keypoints[i], keypoints[i+1], keypoints[i+2]])
                object_person = {
                    "uid": id,
                    "type": "person",
                    "keypoints": person_keypoints,
                    "validate": "unchecked",
                    "track_id": track_id,
                    "category_id": category_id
                }
                og_objects.append(object_person)        # Append new object
            except:
                log.exception("Error reading person")

            # Update annotation with the resulting objects
            result = annotationService.updateAnnotation(dataset, self.pt, og_frame["video"], og_frame["number"], "root",
                                                        og_objects)
            if result == 'error':
                return False
        return True

    def addCategoriesPT(self, categories):
        # Categories
        for cat in categories:
            type = self.safelyReadDictionary(cat, "name")
            datasetType = self.pt
            labels = self.safelyReadDictionary(cat, "keypoints")
            numKeypoints = len(labels)
            supercategory = self.safelyReadDictionary(cat, "supercategory")
            id = self.safelyReadDictionary(cat, "id")
            skeleton = self.safelyReadDictionary(cat, "skeleton")
            result = objectTypeService.createObjectType(type, datasetType, numKeypoints, labels,
                                                        supercategory=supercategory, id=id, skeleton=skeleton)
            if result == 'error':
                return False

        # Ignore Regions
        type = "ignore_region"
        datasetType = self.pt
        is_polygon = True
        labels = None
        numKeypoints = 0
        result = objectTypeService.createObjectType(type, datasetType, numKeypoints, labels, is_polygon=is_polygon)
        if result == 'error':
            return False

        # Bbox
        type = "bbox"
        datasetType = self.pt
        is_polygon = False
        labels = ["Top Left", "Bottom Right"]
        numKeypoints=2
        result = objectTypeService.createObjectType(type, datasetType, numKeypoints, labels, is_polygon=is_polygon)
        if result == 'error':
            return False

        # Bbox head
        type = "bbox_head"
        datasetType = self.pt
        is_polygon = False
        labels = ["Top Left", "Bottom Right"]
        numKeypoints=2
        result = objectTypeService.createObjectType(type, datasetType, numKeypoints, labels, is_polygon=is_polygon)
        if result == 'error':
            return False

        return True

    ###########################################################################
    ####                           AIK INFO METHODS                        ####
    ###########################################################################

    # Store info of AIK datasets: videos, annotations and camera params by frame
    def addInfoAIK(self, dataset):
        # Directories for AIK datasets
        datasetDir = os.path.join(self.STORAGE_DIR, dataset)
        videosDir = os.path.join(datasetDir, 'videos/')
        annotationsDir = os.path.join(datasetDir, 'poses/')

        # Store info in DB
        resultVideos = self.addVideosAIK(dataset, videosDir)
        resultCameras = self.addFrameAIK(dataset, datasetDir)
        resultAnnotations = self.addAnnotationsAIK(dataset, annotationsDir)

        if resultVideos == 'Error' or resultCameras == 'Error' or resultAnnotations == 'Error':
            self.removeDataset(dataset)
            log.error('Error storing dataset. The dataset ' + dataset + ' has been removed')
            return False, 'Error storing dataset. Please upload the zip again', 400
        else:
            return True, 'ok', 200

    # Add videos to database from videos directory
    # Return true if all videos have been updated, False ow
    def addVideosAIK(self, dataset, dir):
        listDir = os.listdir(dir)
        for f in listDir:
            # Get id of camera and save it instead of name
            camera = int(f.split("camera")[1])

            videoDir = os.path.join(dir, f)
            if os.path.isdir(videoDir):
                result = self.createVideo(camera, dataset, videoDir, self.aik, frames=self.getFramesVideo(videoDir))
                r, _, _ = result
                if not r:
                    return False
        return True

    # Add camera parameters to frames in database from camera directory
    # Return true if all have been updated, False ow
    def addFrameAIK(self, dataset, datasetDir):

        # Load dataset
        aik = AIK(datasetDir)
        for frame in aik.valid_frames:
            path, cameras = aik.get_frame(frame, return_paths=True)
            for i, cam in enumerate(cameras):

                # Frame directory, join datasetDir with relative path
                framePath = os.path.join(datasetDir, path[i])

                # Get name of video from path
                video = os.path.split(path[i])[0].split('/')[1]

                # Create dictionary with frame, video, dataset, path and camera parameters and store it in db
                frameDictionary = {"number": frame, "video": i, "dataset": dataset, "path": framePath,
                                   "cameraParameters": json.loads(cam.to_json())}
                result, _, _ = frameService.createFrame(frameDictionary)

                if not result:
                    return False
        return True

    # Add camera parameters to frames in database from camera directory (only for 'video')
    # Return true if all have been updated, False ow
    def addFrameVideoAIK(self, dataset, datasetDir, video):
        # Load dataset
        aik = AIK(datasetDir)
        for frame in aik.valid_frames:
            path, cameras = aik.get_frame(frame, return_paths=True)
            for i, cam in enumerate(cameras):
                if i == video:

                    # Frame directory, join datasetDir with relative path
                    framePath = os.path.join(datasetDir, path[i])

                    # Create dictionary with frame, video, dataset, path and camera parameters and store it in db
                    frameDictionary = {"number": frame, "video": i, "dataset": dataset, "path": framePath,
                                       "cameraParameters": json.loads(cam.to_json())}
                    result, _, _ = frameService.createFrame(frameDictionary)

                    if not result:
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
                if result == 'Error':
                    finalResult = False   # finalResult False if there is some problem

        return finalResult

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

        # Assign keypoint dimension depending on dataset type
        kpDim = ''
        if type == self.aik:
            kpDim = 3
        elif type == self.pt:
            kpDim = 2

        # Check integrity depending on the dataset type
        if type == self.pt:
            # integrity = self.checkIntegrityPT(self.STORAGE_DIR + dataset)
            integrity = True
        elif type == self.aik:
            integrity = self.checkIntegrityAIK(self.STORAGE_DIR + dataset)
        else:
            integrity = False

        if integrity:
            if type == self.aik:    #TODO enable it again once pt fixed
                os.remove(self.STORAGE_DIR + filename)  # Remove zip file
            result = datasetManager.createDataset(dataset, type, kpDim)
            if result == 'Error':
                return False, 'Error creating dataset in database', 500
            else:
                return True, result, 200
        else:
            if type == self.aik:    #TODO enable it again once pt fixed
                os.remove(self.STORAGE_DIR + filename)  # Remove zip file
            shutil.rmtree(self.STORAGE_DIR + dataset)
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

    # DELETE WHEN NEW FRAMESVIDEO IS WORKING
    # Return the corresponding frame of video
    def getVideoFrame(self, video, frame, dataset, type):
        # Get path of frame
        result = frameService.getFramePath(frame, int(video), dataset) if type == "actionInKitchen" \
            else frameService.getFramePath(frame, video, dataset)
        _, framePath, _ = result
        # Read file as binary, encode to base64 and remove newlines
        if os.path.isfile(framePath):
            with open(framePath, "rb") as image_file:
                encodedImage = base64.b64encode(image_file.read())
                return True, {'image': str(encodedImage).replace("\n", ""), 'filename': video, 'frame': frame}, 200
        else:
            return False, 'Frame does not exist', 500

    # Return the corresponding range of frames in video
    def getVideoFrames(self, dataset, type, video, startFrame, endFrame):
        imgs = []

        for frame in range(startFrame, endFrame):
            # Get path of frame
            result = frameService.getFramePath(frame, int(video), dataset) if type == self.aik \
                else frameService.getFramePath(frame, video, dataset)
            _, framePath, _ = result
            # Read file as binary, encode to base64 and remove newlines
            if os.path.isfile(framePath):
                with open(framePath, "rb") as image_file:
                    encodedImage = base64.b64encode(image_file.read())
                    imgs.append({'image': str(encodedImage).replace("\n", ""), 'filename': video, 'frame': frame})

        return True, imgs, 200


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
            return False, 'No videos for this dataset', 400

    ###########################################################################
    ####                           EXPORT                                  ####
    ###########################################################################

    # Export annotation to a file for given dataset depending on dataset type
    def exportDataset(self, dataset, datasetType):
        if datasetType == self.aik:
            result = self.exportDatasetAIK(dataset)
        elif datasetType == self.pt:
            result = self.exportDatasetPT(dataset)
        else:
            result = 'Incorrect dataset type'
        return True, result, 200

    # Export annotation file for PT datasets to a file for a given dataset
    def exportDatasetPT(self, dataset):
        videos = videoManager.getVideos(dataset)
        for j in range(0, len(videos)):
            file = dict()
            frames = frameService.getFrames(videos[j]["name"], dataset)
            for i in range(0, len(frames)):
                frames[i]["vid_id"] = frames[i]["video"]
                frames[i]["file_name"] = frames[i]["path"].split("/")[3:-1]
                del(frames[i]["number"])
                del(frames[i]["dataset"])
                del(frames[i]["video"])
                del(frames[i]["path"])
                del(frames[i]["has_ignore_regions"])
            file["images"] = frames
            # TODO change system to unique annotation
            annotations = annotationService.getAnnotations(dataset, videos[j]["name"])

        return 'ok'

    # Export annotation for AIK datasets to a file for given dataset
    def exportDatasetAIK(self, dataset):
        dbObjects = annotationManager.getObjectsByDataset(dataset)
        actions = actionManager.getActionsByDataset(dataset)

        if dbObjects == 'Error' or actions == 'Error':
            return False, 'Error getting annotations for the dataset', 400
        else:
            # TODO: Create the mean of all annotations
            finalAnnotation = self.buildAnnotationAIK(dbObjects, actions)

        # Write to file in same directory of dataset
        file = os.path.join(self.STORAGE_DIR, dataset + '.json')
        with open(file, 'w') as outfile:
            json.dump(finalAnnotation, outfile)

        return 'ok'

    # Build correct annotation using recover data from database
    def buildAnnotationAIK(self, dbObjects, actions):
        persons = []
        objects = []

        for annotation in dbObjects:    # Each annotation
            framePersons = []
            frameObjects = []
            for obj in annotation['objects']:     # Each object in annotation
                if obj['type'] == 'personAIK':
                    p = {"pid": obj['uid'],
                         "location": obj['keypoints']}
                    framePersons.append(p)
                else:
                    o = {"labels": obj['labels'],
                         "location": obj['keypoints'],
                         "oid": obj['uid']}
                    frameObjects.append(o)

            # Build persons and objects jsons and add to list
            personsJson = {"frame": annotation['frame'],
                           "persons": framePersons}
            objectsJson = {"frame": annotation['frame'],
                           "objects": frameObjects}
            persons.append(personsJson)
            objects.append(objectsJson)

        # Build final annotation
        finalAnnotation = {
            "persons": persons,
            "objects": objects,
            "actions": actions
        }
        return finalAnnotation

    ###########################################################################
    ####                           DATABASE                                ####
    ###########################################################################

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
            resultFrames = frameService.removeFramesByDataset(dataset)

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

    # Return info of video
    def getVideo(self, dataset, datasetType, video):
        result = videoManager.getVideo(dataset, datasetType, video)
        if result == 'Error':
            return False, 'Error pulling video from database', 400
        else:
            return True, result, 200

    # Return info videos, duration and frames
    def getVideos(self, dataset):
        result = videoManager.getVideos(dataset)
        if result == 'Error':
            return False, 'Error pulling videos from database', 400
        else:
            return True, result, 200

    # Return max frame of video
    # PT: total #frames is not the last frame
    def getMaxFrame(self, dataset, datasetType, video):
        if datasetType == self.pt:
            result, frames, _ = frameService.getFrameInfoOfVideo(dataset, video)

            if not result:
                return False, 'Error getting max frame', 400
            else:
                return True, {"frames": frames[1]['number']}, 200

        else:
            result = videoManager.getVideo(dataset, datasetType, video)

            if result == 'Error':
                return False, 'Error getting max frame', 400
            else:
                return True, {"frames": result['frames']}, 200


    ## USE ONLY IN CASE OF ERROR UPLOADING FRAMES
    # Remove and insert new frames for one video and dataset
    def insertFrames(self, dataset, video):
        datasetDir = os.path.join(self.STORAGE_DIR, dataset)

        # Delete frames of selected dataset and camera
        result = frameManager.removeFramesByDatasetAndVideo(dataset, video)
        print('Result of deleting frames of dataset ', dataset, ' camera ', video, ': ', result)

        if result == 'Error':
            return False, 'Error deleting existing frames of dataset', 400

        # Add new frames
        result = self.addFrameVideoAIK(dataset, datasetDir, video)
        print('Result of adding new frames of dataset ', dataset, ' camera ', video, ': ', result)

        if result:
            return True, 'ok', 200
        else:
            return False, 'Error inserting new frames', 400
