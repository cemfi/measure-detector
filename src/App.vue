<template>
  <v-app style="height: 100%">
    <vue-topprogress ref="topProgress" color="#f96d00" :trickle="false"/>
    <v-toolbar app dark color="#222831">
      <v-toolbar-title class="headline">
        <a href="http://www.cemfi.de/" target="_blank" style="text-decoration: none;">
          <span style="color:#f96d00">cemfi.</span>
        </a>
        <span class="font-weight-thin">Deep Optical Measure Detector</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      v{{version}}
    </v-toolbar>

    <v-content>
      <v-container style="height:100%;" @drop.prevent="onFileDrop" @dragover.prevent>
        <v-card style="height:100%;">
          <div v-if="images.length == 0" class="dropZone">
            <span class="display-1">Drop image files here</span>
            <p
              style="margin-top:20px"
            >(All files will be sorted alphanumerically before processing.)</p>
          </div>
          <v-list v-else dense>
            <v-list-tile
              avatar
              v-for="(image, index) in images"
              :key="index"
              @click.stop="showImage(index)"
            >
              <v-list-tile-avatar>
                <img
                  :src="`${publicPath}icons/${image.status}.svg`"
                  style="width:32px;height:32px"
                  v-bind:class="{ rotate: image.status === 'processing' }"
                >
              </v-list-tile-avatar>
              <div class="ellipsize-left">{{image.file.name}}</div>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-container>
      <v-dialog v-model="showViewer" max-width="1000">
        <v-card dark color="#222831" class="pa-3">
          <canvas ref="canvas" style="max-width:100%" @click="showViewer = false"/>
          <span class="ellipsize-left" style="font-size:13px">{{ viewerFilename }}</span>
        </v-card>
      </v-dialog>
    </v-content>
  </v-app>
</template>

<script>
import { vueTopprogress } from 'vue-top-progress';
import axios from 'axios';
import saveAs from 'file-saver';
import $ from 'jquery';
import { ulid } from 'ulid';
import vkbeautify from 'vkbeautify';

import { version } from '../package.json';
import utils from './utils';

axios.defaults.timeout = 180000; // 3 min timeout

export default {
  name: 'App',
  components: {
    vueTopprogress,
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
      version,
      images: [],
      countFinished: 0,
      showViewer: false,
      viewerFilename: null,
    };
  },
  methods: {
    onFileDrop(event) {
      this.images = [];
      this.countFinished = 0;

      const files = [];
      Array.from(event.dataTransfer.files).forEach((file) => {
        files.push(file);
      });
      files.sort(utils.dynamicSort('name'));
      files.forEach((file) => {
        this.images.push({ file, status: 'enqueued' });
      });
      this.$refs.topProgress.start();
      this.processNext();
    },
    showImage(index) {
      const image = this.images[index];
      const reader = new FileReader();

      this.viewerFilename = image.file.name;
      this.$refs.canvas.width = 0;
      this.$refs.canvas.height = 0;

      reader.onload = (event) => {
        const imageData = new Image();
        imageData.src = reader.result;
        imageData.onload = () => {
          this.$refs.canvas.width = imageData.width;
          this.$refs.canvas.height = imageData.height;
          const ctx = this.$refs.canvas.getContext('2d');
          ctx.drawImage(imageData, 0, 0);
          if (image.measures !== undefined) {
            ctx.lineWidth = '3';
            ctx.strokeStyle = '#f96d00';
            ctx.fillStyle = '#22283144';
            image.measures.forEach((measure) => {
              ctx.beginPath();
              ctx.rect(
                measure.ulx,
                measure.uly,
                measure.lrx - measure.ulx,
                measure.lry - measure.uly,
              );
              ctx.fill();
            });
            image.measures.forEach((measure) => {
              ctx.beginPath();
              ctx.rect(
                measure.ulx,
                measure.uly,
                measure.lrx - measure.ulx,
                measure.lry - measure.uly,
              );
              ctx.stroke();
            });
          }
        };
        this.showViewer = true;
      };
      reader.readAsDataURL(image.file);
    },
    processNext() {
      const nextElement = this.images.find(
        element => element.status === 'enqueued',
      );

      // All elements processed
      if (nextElement === undefined) {
        this.generateMei();
        return;
      }

      nextElement.status = 'processing';
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = new Image();
        imageData.src = reader.result;
        imageData.onload = () => {
          nextElement.width = imageData.width;
          nextElement.height = imageData.height;
        };
      };
      reader.readAsDataURL(nextElement.file);

      const formData = new FormData();
      formData.append('image', nextElement.file);
      axios
        .post('/upload', formData, {
          headers: {
            // 'Access-Control-Allow-Origin': '*',
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          nextElement.measures = response.data.measures;
          nextElement.status = 'success';
          this.countFinished += 1;
          this.$refs.topProgress.progress = 100 * (this.countFinished / this.images.length);
          this.processNext();
        })
        .catch((error) => {
          nextElement.status = 'error';
          this.countFinished += 1;
          this.$refs.topProgress.progress = 100 * (this.countFinished / this.images.length);
          console.log(error);
          this.processNext();
        });
    },
    generateMei() {
      const template = utils.getTemplate(
        new Date().toISOString(),
        this.version,
      );
      const meiXml = $($.parseXML(template));

      const meiFacsimile = meiXml.find('facsimile').first();
      const meiSection = meiXml.find('section').first();

      this.images.forEach((page, p) => {
        const meiSurfaceId = `surface_${ulid()}`;

        if (page.status === 'success') {
          meiFacsimile.append(
            `<surface xml:id="${meiSurfaceId}"
            n="${p + 1}"
            ulx="0"
            uly="0"
            lrx="${page.width - 1}"
            lry="${page.height - 1}"
          />`,
          );
          const meiSurface = meiFacsimile.find('surface').last();

          meiSurface.append(
            `<graphic xml:id="graphic_${ulid()}"
            target="${page.file.name}"
            width="${page.width}px"
            height="${page.height}px"
          />`,
          );

          page.measures.forEach((measure, m) => {
            const meiZoneId = `zone_${ulid()}`;
            meiSurface.append(
              `<zone xml:id="${meiZoneId}"
              type="measure"
              ulx="${Math.floor(measure.ulx)}"
              uly="${Math.floor(measure.uly)}"
              lrx="${Math.floor(measure.lrx)}"
              lry="${Math.floor(measure.lry)}"
            />`,
            );

            meiSection.append(
              `<measure xml:id="measure_${ulid()}"
              n="${m + 1}"
              label="${m + 1}"
              facs="#${meiZoneId}"
            />`,
            );

            if (
              page.measures.length > m + 1
              && page.measures[m + 1].ulx < measure.ulx
            ) {
              meiSection.append('<sb />');
            }
          });

          meiSection.append(`<pb xml:id="pb_${ulid()}" n="${p + 2}" facs="#${meiSurfaceId}"/>`);
        }
      });

      let meiString = new XMLSerializer().serializeToString(meiXml.get(0));
      meiString = vkbeautify.xml(meiString.replace(/ xmlns=""/g, ''));
      saveAs(
        new Blob([meiString], { type: 'text/xml;charset=utf-8' }),
        'measure_annotations.xml',
      );
    },
  },
};
</script>

<style>
.ellipsize-left {
  /* Standard CSS ellipsis */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;

  /* Beginning of string */
  direction: rtl;
  text-align: left;
}

.dropZone {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #222831;
  text-align: center;
}

.rotate {
  animation: rotation 2s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
