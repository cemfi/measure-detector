<img align="right" width="40%" src="/preview.png">

# Deep Optical Measure Detector

This is a self contained package of the *Deep Optical Measure Detector*. It can be utilized to generate measure annotations in the MEI format for handwritten and typeset score images.

## Requirements
Make sure to have [Docker](https://www.docker.com/) installed and running properly. That's it.

## How to Run
1. Build the docker image with the latest model

```bash
$ docker build -t measure_detector .
```

2. Run in container
```bash
$ docker run -p 8080:8080 -i -t measure_detector
```

3. Go to [http://localhost:8080](http://localhost:8080) and drop some images. Be patient, the detection is computationally pretty heavy.

## Acknowledgements
The DNN model was trained by [Alexander Pacha](https://github.com/apacha/), see [this project](https://github.com/OMR-Research/MeasureDetector/). Thank you very much, Alex!
