# base image
FROM nvidia/cuda:9.0-base

# install python3 and pip
RUN apt-get update
RUN apt-get install -y \
        curl \
        pkg-config \
        python3 \
        python3-dev

RUN cd /tmp/ && curl -O https://bootstrap.pypa.io/get-pip.py
RUN python3 /tmp/get-pip.py && \
        rm /tmp/get-pip.py

# install Python modules needed
COPY requirements.txt /usr/src
RUN pip3 install --no-cache-dir -r /usr/src/requirements.txt

# copy files required for the app
COPY python /usr/src/python
COPY static /usr/src/static
COPY templates /usr/src/templates
COPY api.py /usr/src/api.py

# port number the container should expose
EXPOSE 5000

# run the application
CMD ["python3", "/usr/src/api.py"]
