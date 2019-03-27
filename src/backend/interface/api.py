from flask import Flask, render_template

app = Flask(__name__, root_path='/usr/src/',template_folder='frontend', static_folder='frontend/javascript')

@app.route("/")
def hello():
     return render_template('index.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0")
