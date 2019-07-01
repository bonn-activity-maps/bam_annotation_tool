# base image
FROM nvidia/cuda:9.0-base

# install python3.6, pip and other libraries
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/python-3.6
RUN apt-get update
RUN apt-get install -y \
        curl \
        pkg-config \
        python3.6 \
        python3.6-dev \
        ffmpeg \
        libsm6 \
        libxext6 \
        libxrender-dev

# install git
RUN apt-get install -y git

RUN cd /tmp/ && curl -O https://bootstrap.pypa.io/get-pip.py
RUN python3.6 /tmp/get-pip.py && \
        rm /tmp/get-pip.py

RUN pip3.6 install --upgrade pip

# install Python modules needed
COPY requirements.txt /usr/src
RUN pip3.6 install --no-cache-dir -r /usr/src/requirements.txt

# copy files required for the app
COPY python /usr/src/python
COPY static /usr/src/static
COPY templates /usr/src/templates
COPY api.py /usr/src/api.py
RUN mkdir /usr/storage

# port number the container should expose
EXPOSE 5000

# run the application
CMD ["python3.6", "-u", "/usr/src/api.py"]
