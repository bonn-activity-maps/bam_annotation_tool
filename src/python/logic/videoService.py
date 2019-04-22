import os, subprocess, json, shutil
import logging
from werkzeug.utils import secure_filename
import moviepy.editor as mp

class VideoService:

    STORAGE_DIR = '/usr/storage/'  # Path to store the videos
    ffmpeg = '/usr/bin/ffmpeg'     # Path to ffmpeg

    # VideoService logger
    log = logging.getLogger('videoService')


    # Storage chunked videos in $STORAGE_DIR
    def storeVideo(this, request):
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
            return False, 'Server error writting the file', 500

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
                success, msg, status = this.unwrapVideo(file.filename)
                return success, msg, status
        else:
            log.debug('Chunk %s of %s for %s', current_chunk+1, total_chunks, file.filename)
        return True, 'ok', 200

    # Unwrap video in frames
    def unwrapVideo(this,v):
        # Create new directory for storing frames
        filename, _ = os.path.splitext(v)
        dir = this.STORAGE_DIR+filename
        if not os.path.exists(dir):
            os.makedirs(dir)
        else:
            log.warning('The directory %s for extracting frames exists', dir)
            return False, 'The directory for extracting frames exists', 500

        # Unwrap video in subfolder
        outFile = dir + '/' + '%08d.jpg'
        cmd = [this.ffmpeg,'-i',this.STORAGE_DIR+v,'-qscale:v','2',outFile]
        # Extract frames from 10000 to 20000
        # cmd = [this.ffmpeg,'-i',this.STORAGE_DIR+v,'-vf','select=\'between(n\,10000\,20000)\'','-qscale:v','2',outFile]
        subprocess.call(cmd)
        log.warning('File %s has been unwraped successfully', filename)
        return True, 'ok', 200

    # Return info videos, duration and frames
    def getInfoVideos(this):
        files = [f for f in os.listdir(this.STORAGE_DIR) if os.path.isfile(os.path.join(this.STORAGE_DIR, f))]
        duration = this.getDurationVideos(files)
        frames = this.getFramesVideos(files)

        # Parse response to json {'name':name, 'duration':duration, 'frames':frames}
        response = []
        for i in range(len(files)):
            response.append(json.dumps({'name':files[i], 'duration':duration[i], 'frames':frames[i]}))
        return True, response, 200

    # Return duration of videos hh:mm:ss.ss
    def getDurationVideos(this, videos):
        duration = []
        for v in videos:
            sec = mp.VideoFileClip(this.STORAGE_DIR+v).duration
            # Convert to hh:mm:ss.ss
            hh = int(sec//(60*60))
            mm = int((sec-hh*60*60)//60)
            ss = round(sec-(hh*60*60)-(mm*60),2)
            mm = '0'+str(mm) if mm < 10 else str(mm)
            ss = '0'+str(ss) if ss < 10 else str(ss)
            duration.append(str(hh)+':'+mm+':'+ss)
        return duration

    # Return frames of videos
    def getFramesVideos(this, videos):
        frames = []
        for v in videos:
            folder, _ = os.path.splitext(v)
            frames.append(len(os.listdir(this.STORAGE_DIR+folder)))
        return frames

    # Rename video and folder with frames
    def renameVideo(this, name, newName):
        try:
            newName = secure_filename(newName)

            # Separate name of file and extension
            folder, _ = os.path.splitext(name)
            newFolder, _ = os.path.splitext(newName)

            # Rename video and directory
            os.rename(this.STORAGE_DIR+name, this.STORAGE_DIR+newName)
            os.rename(this.STORAGE_DIR+folder, this.STORAGE_DIR+newFolder)

            log.info('Rename ', this.STORAGE_DIR+name,' to ', this.STORAGE_DIR+newName, ' successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error renaming the file')
            return False, 'Server error renaming the file', 500

    # Delete video and corresponding folder with frames
    def deleteVideo(this, video):
        try:
            # Separate name of file and extension
            filename, _ = os.path.splitext(video)

            # Remove video and folder
            os.remove(this.STORAGE_DIR+video)
            shutil.rmtree(this.STORAGE_DIR+filename)

            log.info('Remove ',this.STORAGE_DIR+video, ' file successfully.')
            return True, 'ok', 200
        except OSError:
            log.exception('Error deleting the file')
            return False, 'Server error deleting the file', 500
