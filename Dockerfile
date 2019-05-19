FROM tensorflow/tensorflow:1.13.1-py3

RUN apt-get update && apt-get install -y curl
RUN pip3 install pillow hug gunicorn
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN curl -L https://github.com/OMR-Research/MeasureDetector/releases/download/v1.0/2019-05-16_faster-rcnn-inception-resnet-v2.pb --output model.pb


ADD backend ./
ADD dist ./

EXPOSE 8000

# ENTRYPOINT ["/bin/bash", "startup.sh"]
CMD ["gunicorn", "--bind=0.0.0.0:8000", "--timeout=180", "--workers=2", "server:__hug_wsgi__"]
