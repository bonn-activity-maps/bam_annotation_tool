from flask import Flask, render_template,make_response, request
import os
import json

app = Flask(__name__)

# Base redirection to index.html. Let AngularJS handle Webapp states
@app.route("/")
def redirect():
     return make_response(open('/usr/src/templates/index.html').read())

# Admin login handler
# TODO: this is temporal, when database is up change to true user management
@app.route("/api/adminLogin", methods=['GET'])
def adminLogin():
    password = request.headers['password']
    if (password == "test"):
        return json.dumps({'success':True, 'msg':'ok'}), 200, {'ContentType':'application/json'}
    else:
        return json.dumps({'success':False, 'msg':'Incorrect password'}), 400, {'ContentType':'application/json'}

# Normal user login handler
@app.route("/api/userLogin", methods=['GET'])
def userLogin():
    username = request.headers['username']
    # TODO: Check for username in database

if __name__ == "__main__":
    app.run(host="0.0.0.0")
