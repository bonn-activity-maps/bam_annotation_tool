import os, subprocess, json, shutil
import cv2
import logging
from werkzeug.utils import secure_filename
import moviepy.editor as mp
import base64
import zipfile

from python.infrastructure.datasetManager import DatasetManager

# DatasetService logger
log = logging.getLogger('datasetService')

datasetManager = DatasetManager()


def checkIntegrityOfAnnotations(dirAnnotations, dirImages):
    hasConsistency = True
    for f in os.listdir(dirAnnotations):
        filename, filextension = os.path.splitext(f)
        if not os.path.isdir(dirImages + filename):
            hasConsistency = False
            break
    return hasConsistency


def checkIntegrity(dir):
    isDir = os.path.isdir(dir)
    dirAnnotations = dir + "/annotations"
    dirImages = dir + "/images"
    hasAnnotations = os.path.isdir(dirAnnotations)
    hasImages = os.path.isdir(dirImages)
    hasTest = os.path.isdir(dirImages + "/test") and os.path.isdir(dirAnnotations + "/test")
    hasTrain = os.path.isdir(dirImages + "/train") and os.path.isdir(dirAnnotations + "/train")
    hasVal = os.path.isdir(dirImages + "/val") and os.path.isdir(dirAnnotations + "/val")
    hasConsistency = checkIntegrityOfAnnotations(dirAnnotations + "/test/", dirImages + "/test/")
    hasConsistency *= checkIntegrityOfAnnotations(dirAnnotations + "/train/", dirImages + "/train/")
    hasConsistency *= checkIntegrityOfAnnotations(dirAnnotations + "/val/", dirImages + "/val/")

    return isDir and hasAnnotations and hasImages and hasTest and hasTrain and hasVal and hasConsistency


class DatasetService:
    STORAGE_DIR = '/usr/storage/'  # Path to store the videos
    ffmpeg = '/usr/bin/ffmpeg'  # Path to ffmpeg

    # Store item of a dataset in corresponding folder in $STORAGE_DIR
    def storeZip(this, request):
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
                integrity = checkIntegrity(this.STORAGE_DIR + filename)
                if integrity:
                    os.remove(this.STORAGE_DIR + file.filename)
                    return True, 'ok', 200
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
                # TODO: getDuration then create video
                return True, 'ok', 200
        else:
            log.debug('Chunk %s of %s for %s', current_chunk + 1, total_chunks, file.filename)
        return True, 'ok', 200

    # Unwrap video in frames
    def unwrapVideo(this, v, dataset):
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
    def getInfoVideos(this, dataset):
        files = []
        response = []
        datasetDir = this.STORAGE_DIR + dataset + "/"
        for f in os.listdir(
                datasetDir):  # TODO check folders in datasetDir/Images or ask database?  If folders then move video store dir
            filename, filextension = os.path.splitext(f)
            if filename not in files and os.path.isfile(os.path.join(this.STORAGE_DIR, f)) and filextension != ".zip":
                files.append(filename)
                response.append(json.dumps(
                    {'name': filename, 'extension': filextension, 'duration': this.getDurationVideo(f),
                     'frames': this.getFramesVideo(f)}))
            elif filename not in files and os.path.isdir(os.path.join(this.STORAGE_DIR, f)):
                files.append(filename)
                response.append(json.dumps(
                    {'name': filename, 'extension': '/', 'duration': this.getDurationVideo(f),
                     'frames': this.getFramesVideo(f)}))
        return True, response, 200

    # Return duration of videos hh:mm:ss.ss
    def getDurationVideo(this, video): # TODO: pasar dataset y arreglar
        duration = str(0)
        if os.path.isfile(this.STORAGE_DIR + video):  # Is video
            sec = mp.VideoFileClip(this.STORAGE_DIR + video).duration
            # Convert to hh:mm:ss.ss
            hh = int(sec // (60 * 60))
            mm = int((sec - hh * 60 * 60) // 60)
            ss = round(sec - (hh * 60 * 60) - (mm * 60), 2)
            mm = '0' + str(mm) if mm < 10 else str(mm)
            ss = '0' + str(ss) if ss < 10 else str(ss)
            duration = str(hh) + ':' + mm + ':' + ss
        return duration

    # Return #frames of videos
    def getFramesVideo(this, video): # TODO: pasar dataset y arreglar
        folder, _ = os.path.splitext(video)
        frames = 0
        if os.path.isdir(this.STORAGE_DIR + folder):
            frames = len(os.listdir(this.STORAGE_DIR + folder))
        return frames

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
    def renameVideo(this, name, newName):
        try:
            newName = secure_filename(newName)

            # Separate name of file and extension
            folder, _ = os.path.splitext(name)
            newFolder, _ = os.path.splitext(newName)

            # Rename folder
            os.rename(this.STORAGE_DIR + folder, this.STORAGE_DIR + newFolder)

            # Rename video, if exists
            if os.path.isfile(this.STORAGE_DIR + name):
                os.rename(this.STORAGE_DIR + name, this.STORAGE_DIR + newName)

            log.info('Renamed ', this.STORAGE_DIR + name, ' to ', this.STORAGE_DIR + newName, ' successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error renaming the file')
            return False, 'Server error renaming the file', 500

    # Delete video and corresponding folder with frames
    def removeVideo(this, video):
        try:
            # Separate name of file and extension
            filename, filextension = os.path.splitext(video)

            # Remove folder
            shutil.rmtree(this.STORAGE_DIR + filename)
            # Remove video, if exists
            if os.path.isfile(this.STORAGE_DIR + video):  # Is video
                os.remove(this.STORAGE_DIR + video)

            log.info('Removed ', this.STORAGE_DIR + video, ' file successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error deleting the file')
            return False, 'Server error deleting the file', 500

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
