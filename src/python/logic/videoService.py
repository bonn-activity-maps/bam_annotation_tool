import os, subprocess, json
import logging
import ffmpeg
from werkzeug.utils import secure_filename

# Path to store the videos
STORAGE_DIR = '/usr/storage/'

# VideoService logger
log = logging.getLogger('videoService')

class VideoService:

    # Storage chunked videos in $STORAGE_DIR
    def storeVideo(this, request):
        file = request.files['file']

        save_path = os.path.join(STORAGE_DIR, secure_filename(file.filename))
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
            return False, 'Server error writting the file', 500

        total_chunks = int(request.form['dztotalchunkcount'])

        # If it is the last chunk, check if it is complete
        if current_chunk + 1 == total_chunks:
            if os.path.getsize(save_path) != int(request.form['dztotalfilesize']):
                log.error('File %s was completed, but has a size mismatch.'
                    ' Was %s but we expected %s', file.filename,
                    os.path.getsize(save_path), request.form['dztotalfilesize'])
                return False, 'Error in the size of file', 500
            else:
                log.warning('File %s has been uploaded successfully', file.filename)

        else:
            log.debug('Chunk %s of %s for %s', current_chunk+1, total_chunks, file.filename)
            # this.unwrapVideo(file.filename)
        return True, 'ok', 200

    # Unwrap video in frames
    def unwrapVideo(this,v):
        # "ffmpeg -i " + STORAGE_DIR+v + " -vf fps=" + str(fps) + " " + self.output + output + "/output%06d.jpg"
        frames = "ffmpeg -i " + STORAGE_DIR+v + " " + STORAGE_DIR +"output%06d.jpg"
        response = subprocess.Popen(frames, shell=True, stdout="output%06d.jpg")

    # Return info videos and lenght
    def getInfoVideos(this):
        videos = os.listdir(STORAGE_DIR)
        return True, videos, 200

    # Return metadata of video

    # Rename video
    def renameVideo(this, name, newName):
        try:
            os.rename(STORAGE_DIR+name, STORAGE_DIR+newName)
            log.info('Rename ', STORAGE_DIR+name,' to ', STORAGE_DIR+newName, ' successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error renaming the file')
            return False, 'Server error renaming the file', 500


    # Delete video
    def deleteVideo(this, video):
        try:
            videos = os.remove(STORAGE_DIR+video)
            log.info('Remove ',STORAGE_DIR+video, ' file successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error deleting the file')
            return False, 'Server error deleting the file', 500
