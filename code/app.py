from flask import Flask
app = Flask(_name_)

@app.route("/")
def home():
    return "Hello from Kaggle!"

# Run Flask in background
from threading import Thread
def run():
    app.run(host="0.0.0.0", port=5000)

Thread(target=run).start()