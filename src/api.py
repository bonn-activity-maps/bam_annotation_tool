from flask import Flask, render_template,make_response
import os
import json

app = Flask(__name__)

@app.route("/")
def redirect():
     # return render_template('index.html')
     return make_response(open('/usr/src/templates/index.html').read())

if __name__ == "__main__":
    app.run(host="0.0.0.0")
