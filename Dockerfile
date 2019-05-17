FROM tensorflow/tensorflow:1.13.1-py3

RUN pip3 install pillow hug
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN curl -L https://github.com/OMR-Research/MeasureDetector/releases/download/v1.0/2019-05-16_faster-rcnn-inception-resnet-v2.pb --output model.pb


ADD backend ./
ADD dist ./

EXPOSE 8080

# ENTRYPOINT ["/bin/bash", "startup.sh"]
CMD ["hug", "-p=8080", "-f=server.py"]
