<img align="right" width="40%" src="/preview.png">

# Deep Optical Measure Detector

This is a self contained package of the *Deep Optical Measure Detector*. It can be utilized to generate measure annotations in the MEI format (compatible to v3 & v4) for handwritten and typeset score images.

## Disclaimer
This code was meant as a quick functional demonstration. It is **not** production ready or even documented! Handle with care.

## How to Run
1. Make sure to have [Docker](https://www.docker.com/) installed and running properly with at least 4 GB of RAM assigned to Docker.

2. Run the container in a terminal:
```bash
docker run -p 8000:8000 -i --rm cemfi/measure-detector
```

3. Go to [http://localhost:8000](http://localhost:8000) and drop some images. Be patient, the detection is computationally pretty heavy.

## Acknowledgements
The DNN model was trained by [Alexander Pacha](https://github.com/apacha/), see [this project](https://github.com/OMR-Research/MeasureDetector/).
Thanks also to [Alexander Leemhuis](https://github.com/AlexL164) for meticulously annotating hundreds of score images for the dataset.
