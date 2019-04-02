from flask import Flask, render_template, make_response, request
import os
import logging
import json

from python.logic.videoService import storeVideo

app = Flask(__name__)

log = logging.getLogger('pydrop')

@app.route("/")
def redirect():
     # return render_template('index.html')
     return make_response(open('/usr/src/templates/index.html').read())

# Upload chunked video
@app.route('/uploadVideo', methods=['POST'])
def uploadVideo():
    success, msg, status = storeVideo(request)
    # return json.dumps({'success':success, 'msg':msg}), status, {'ContentType':'application/json'}
    return make_response(('ok', 200))

if __name__ == "__main__":
    app.run(host="0.0.0.0")
