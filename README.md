<img align="right" width="40%" src="/preview.png">

# Deep Optical Measure Detector

This is a self contained package of the *Deep Optical Measure Detector*. It can be utilized to generate measure annotations in the MEI format for handwritten and typeset score images.

## Requirements
Make sure to have [Docker](https://www.docker.com/) installed and running properly. That's it.

## How to Run
1. Get the docker image with the latest model

```bash
$ docker pull cemfi/measure-detector
```

2. Run in container
```bash
$ docker run -p 8000:8000 -it cemfi/measure-detector
```

3. Go to [http://localhost:8000](http://localhost:8000) and drop some images. Be patient, the detection is computationally pretty heavy.

## Acknowledgements
The DNN model was trained by [Alexander Pacha](https://github.com/apacha/), see [this project](https://github.com/OMR-Research/MeasureDetector/).
Thanks also to [Alexander Leemhuis](https://github.com/AlexL164) for meticulously annotating hundreds of score images for the dataset.
