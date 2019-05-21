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


    # Return duration of videos hh:mm:ss.ss
    def getDurationVideo(this, video, dataset): # TODO: check
        dir = this.STORAGE_DIR + dataset + "/" + video
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
    def getFramesVideo(this, filename, dataset):
        datasetDir = this.STORAGE_DIR + dataset + "/" #TODO: fix for posetrack
        frames = 0
        if os.path.isdir(datasetDir + filename):
            frames = len(os.listdir(datasetDir + filename))
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
        hasConsistency = this.checkIntegrityOfAnnotations(dirAnnotations + "/test/", dirImages + "/test/")
        hasConsistency *= this.checkIntegrityOfAnnotations(dirAnnotations + "/train/", dirImages + "/train/")
        hasConsistency *= this.checkIntegrityOfAnnotations(dirAnnotations + "/val/", dirImages + "/val/")

        return isDir and hasAnnotations and hasImages and hasTest and hasTrain and hasVal and hasConsistency


    def addVideosAIK(this, filename):
        # TODO: create Video entries in DB for AIK dataset
        pass

    def addVideosPT(this, filename):
        # TODO: create Video entries in DB for PT dataset
        pass

    def createVideo(this, file, dataset, save_path):
        duration = this.getDurationVideo(file.filename, dataset)
        filename, filextension = os.path.splitext(file.filename)
        result = videoManager.createVideo(filename, dataset, filextension, duration, save_path)
        if result == 'Error':
            return False, 'Error creating video', 400
        else:
            return True, 'ok', 200

    # Store item of a dataset in corresponding folder in $STORAGE_DIR
    def storeZip(this, request, type):
        print("TYPE: ", type)
        file = request.files['file']

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

                result = datasetManager.createDataset(filename, type)
                if result == 'Error':
                    return False, 'Error creating dataset in database', 500
                else:
                    if type == "actionInKitchen":
                        this.addVideosAIK(filename)
                    else:
                        this.addVideosPT(filename)
                    return True, result, 200

                #integrity = this.checkIntegrity(this.STORAGE_DIR + filename) #TODO: add every video to db
                # if integrity:
                #     os.remove(this.STORAGE_DIR + file.filename)
                #     return True, 'ok', 200
                # else:
                #     shutil.rmtree(this.STORAGE_DIR + filename)
                #     os.remove(this.STORAGE_DIR + file.filename)
                #     return False, 'Error on folder subsystem, check your file and try again', 400
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
    def unwrapVideo(this, v, dataset): # TODO: callback when finished
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
        outFile = dir + '/' + '%08d.jpg'
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
    def getVideoFrame(this, video, frame):
        frame = str(frame).zfill(8)  # Fill with 0 until 8 digits
        file = os.path.join(this.STORAGE_DIR, video, frame + '.jpg')

        # Read file as binary, encode to base64 and remove newlines
        if os.path.isfile(file):
            with open(file, "rb") as image_file:
                encodedImage = base64.b64encode(image_file.read())
                return True, {'image': str(encodedImage).replace("\n", ""), 'filename': video, 'frame': frame}, 200
        else:
            return False, 'Frame does not exist', 500

    # Rename video and folder with frames
    def renameVideo(this, name, newName, dataset): #TODO: Fix for posetrack USE VIDEO PATH
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
            filename, filextension = os.path.splitext(video) #TODO: Fix remove for posetrack USE VIDEO PATH
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

    def updateVideoFrames(this, video, dataset):
        filename, _ = os.path.splitext(video)
        frames = this.getFramesVideo(filename, dataset)
        result = videoManager.updateVideoFrames(filename, frames, dataset)
        if result == 'Error':
            return False, 'Error updating frames in database', 500
        else:
            return True, result, 200

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

    # Return 'ok' if the dataset has been removed
    def removeDataset(this, dataset):
        result = datasetManager.removeDataset(dataset)
        if result == 'Error':
            return False, 'Error deleting dataset', 400
        else:
            return True, result, 200

    # Return dataset name if it has been created
    def createDataset(this, req):
        name = req['name']
        # Check if datasets exists
        if datasetManager.getDataset(name) != 'Error':
            return False, 'The dataset ' + name + ' already exists', 400
        else:
            result = datasetManager.createDataset(name)
            if result == 'Error':
                return False, 'Error creating dataset', 400
            else:
                return True, {'name': name}, 200
