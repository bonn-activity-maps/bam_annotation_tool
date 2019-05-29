import os, subprocess, json, shutil
import cv2
import logging
from werkzeug.utils import secure_filename
import moviepy.editor as mp
import base64
import zipfile

from python.infrastructure.datasetManager import DatasetManager
from python.infrastructure.videoManager import VideoManager

# DatasetService logger
log = logging.getLogger('datasetService')

datasetManager = DatasetManager()
videoManager = VideoManager()


class DatasetService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the videos
    ffmpeg = '/usr/bin/ffmpeg'  # Path to ffmpeg
    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Return duration of videos hh:mm:ss.ss
    def getDurationVideo(this, video, dataset):
        dir = this.STORAGE_DIR + dataset + "/" + video
        duration = 0
        if os.path.isfile(dir):  # Is video
            sec = mp.VideoFileClip(dir).duration
            # Convert to hh:mm:ss.ss
            hh = int(sec // (60 * 60))
            mm = int((sec - hh * 60 * 60) // 60)
            ss = round(sec - (hh * 60 * 60) - (mm * 60), 2)
            mm = '0' + str(mm) if mm < 10 else str(mm)
            ss = '0' + str(ss) if ss < 10 else str(ss)
            duration = str(hh) + ':' + mm + ':' + ss
        return duration

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

    def addVideosAIK(this, dataset):
        datasetDir = os.path.join(this.STORAGE_DIR, dataset)
        listDir = os.listdir(datasetDir)
        for f in listDir:
            if f.endswith(".mp4"):
                videoDir = os.path.join(datasetDir, f)
                if not os.path.isfile(videoDir):
                    return False, "Error creating video", 400
                else:
                    filename, _ = os.path.splitext(videoDir)
                    result = this.createVideo(f, dataset, filename, this.aik)
                    r, _, _ = result
                    if not r:
                        return result
        return True, 'ok', 200

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
            return True, 'ok', 200
        else:
            return False, 'Error: Incomplete data.', 400

    def createVideo(this, file, dataset, save_path, type, frames=0):
        duration = this.getDurationVideo(file, dataset)
        filename = file
        filextension = "/"
        if os.path.isfile(save_path):
            filename, filextension = os.path.splitext(file)
        result = videoManager.createVideo(filename, dataset, filextension, duration, save_path, type=type,
                                          frames=frames)
        if result == 'Error':
            return False, 'Error creating video', 400
        else:
            return True, 'ok', 200

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
                zip = zipfile.ZipFile(save_path, 'r')
                zip.extractall(this.STORAGE_DIR)
                filename, _ = os.path.splitext(file.filename)

                integrity = this.checkIntegrity(this.STORAGE_DIR + filename) if type == this.pt else True
                if integrity:
                    os.remove(this.STORAGE_DIR + file.filename)  # Remove zip file
                    result = datasetManager.createDataset(filename, type)
                    if result == 'Error':
                        return False, 'Error creating dataset in database', 500
                    else:
                        if type == "actionInKitchen":
                            this.addVideosAIK(filename)
                        else:
                            this.addVideosPT(filename)
                        return True, result, 200
                else:
                    shutil.rmtree(this.STORAGE_DIR + filename)
                    os.remove(this.STORAGE_DIR + file.filename)
                    return False, 'Error on folder subsystem, check your file and try again', 400

        else:
            log.debug('Chunk %s of %s for %s', current_chunk + 1, total_chunks, file.filename)
        return True, 'ok', 200

    # Store chunked videos in $STORAGE_DIR
    def storeVideo(this, request, dataset):
        file = request.files['file']
        datasetDir = this.STORAGE_DIR + dataset + "/"

        save_path = os.path.join(datasetDir, secure_filename(file.filename))
        current_chunk = int(request.form['dzchunkindex'])

        # If the file exists and is the first chunk, you cannot overwrite it
        if os.path.exists(save_path) and current_chunk == 0:
            return False, 'File already exists', 400

        if not os.path.exists(datasetDir):
            os.mkdir(datasetDir)

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
                return this.createVideo(file, dataset, save_path)
        else:
            log.debug('Chunk %s of %s for %s', current_chunk + 1, total_chunks, file.filename)
        return True, 'ok', 200

    # Unwrap video in frames
    def unwrapVideos(this, dataset):
        # Create new directory for storing frames
        dataset, _ = os.path.splitext(dataset)
        datasetDir = os.path.join(this.STORAGE_DIR, dataset)
        listDir = os.listdir(datasetDir)
        for f in listDir:
            if f.endswith(".mp4"):
                result = this.unwrapVideo(f, dataset)
                r, _, _ = result
                if not r:
                    return result
        return True, 'ok', 200

    # Unwrap video in frames
    def unwrapVideo(this, v, dataset):  # TODO: callback when finished
        # Create new directory for storing frames
        filename, _ = os.path.splitext(v)
        dir = this.STORAGE_DIR + dataset + "/" + filename
        datasetDir = this.STORAGE_DIR + dataset + "/"
        if not os.path.exists(dir):
            os.makedirs(dir)
        else:
            log.warning('The directory %s for extracting frames exists', dir)
            return False, 'The directory for extracting frames exists', 500

        # Unwrap video in subfolder
        outFile = dir + '/' + '%06d.jpg'
        cmd = [this.ffmpeg, '-i', datasetDir + v, '-qscale:v', '2', outFile]
        # Extract frames from 10000 to 20000
        # cmd = [this.ffmpeg,'-i',this.STORAGE_DIR+v,'-vf','select=\'between(n\,10000\,20000)\'','-qscale:v','2',outFile]
        subprocess.call(cmd)
        log.warning('File %s has been unwraped successfully', filename)
        return True, 'ok', 200

    # Return info videos, duration and frames
    def getVideos(this, dataset):
        result = videoManager.getVideos(dataset)
        if result == 'Error':
            return False, 'Error pulling videos from database', 400
        else:
            return True, result, 200

    # Return the corresponding frame of video
    def getVideoFrame(this, video, frame, dataset):
        videoObject = videoManager.getVideo(video, dataset)
        frame = str(frame).zfill(6)  # Fill with 0 until 8 digits
        file = os.path.join(videoObject['path'], frame + '.jpg')
        # Read file as binary, encode to base64 and remove newlines
        if os.path.isfile(file):
            with open(file, "rb") as image_file:
                encodedImage = base64.b64encode(image_file.read())
                return True, {'image': str(encodedImage).replace("\n", ""), 'filename': video, 'frame': frame}, 200
        else:
            return False, 'Frame does not exist', 500

    # Rename video and folder with frames
    def renameVideo(this, name, newName, dataset):  # TODO: Fix for posetrack USE VIDEO PATH
        try:
            newName = secure_filename(newName)
            datasetDir = this.STORAGE_DIR + dataset + "/"

            # Separate name of file and extension
            filename, _ = os.path.splitext(name)
            newFilename, _ = os.path.splitext(newName)

            # Rename folder
            os.rename(datasetDir + filename, datasetDir + newFilename)

            # Rename video, if exists
            if os.path.isfile(datasetDir + name):
                os.rename(datasetDir + name, datasetDir + newName)

            log.info('Renamed ', datasetDir + name, ' to ', datasetDir + newName, ' successfully.')

            result = videoManager.updateVideoName(filename, newFilename, dataset)
            if result == 'Error':
                return False, 'Error updating video in database', 500
            else:
                return True, result, 200
        except OSError:
            log.exception('Error renaming the file')
            return False, 'Server error renaming the file', 500

    # Delete video and corresponding folder with frames
    def removeVideo(this, video, dataset):
        try:
            # Separate name of file and extension
            filename, filextension = os.path.splitext(video)  # TODO: Fix remove for posetrack USE VIDEO PATH
            datasetDir = this.STORAGE_DIR + dataset + "/"
            # Remove folder
            shutil.rmtree(datasetDir + filename)
            # Remove video, if exists
            if os.path.isfile(datasetDir + video):  # Is video
                os.remove(datasetDir + video)

            log.info('Removed ', dataset + video, ' file successfully.')
            result = videoManager.removeVideo(filename, dataset)
            if result == 'Error':
                return False, 'Error removing from database', 500
            else:
                return True, result, 200
        except OSError:
            log.exception('Error deleting the file')
            return False, 'Server error deleting the file', 500

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

    # Remove dataset and videos in DB and folder corresponding to dataset
    # Return 'ok' if the dataset has been removed
    def removeDataset(this, dataset):
        try:
            datasetDir = this.STORAGE_DIR + dataset + "/"

            # Remove folder
            shutil.rmtree(datasetDir)
            log.info('Removed ', dataset, ' successfully.')

            # Remove videos and dataset in DB
            result = videoManager.removeVideosByDataset(dataset)
            if result == 'Error':
                return False, 'Error deleting videos in dataset', 400
            else:
                result = datasetManager.removeDataset(dataset)
                if result == 'Error':
                    return False, 'Error deleting dataset', 400
                return True, result, 200
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
                print("Adding videos of type: ", type)
                return this.addVideosAIK(name) if type == this.aik else this.addVideosPT(name)
                # r, msg, code = result
                # if not r:
                #     return result
                #     #return False, 'Error creating videos in the dataset', 400
                # else:
                #     return True, result, 200
