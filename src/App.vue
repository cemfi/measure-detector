<template>
  <v-app style="height: 100%">
    <vue-topprogress ref="topProgress" color="#f96d00" :trickle="false"/>
    <v-toolbar app dark color="#222831">
      <v-toolbar-title class="headline text-uppercase">
        <a href="http://www.cemfi.de/" target="_blank" style="text-decoration: none;">
          <span style="color:#f96d00">CEMFI.</span>
        </a>
        <span class="font-weight-thin">Deep Optical Measure Detector</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      v{{version}}
    </v-toolbar>

    <v-content>
      <v-container style="height:100%; display:grid" @drop.prevent="onFileDrop" @dragover.prevent>
        <div
          v-if="images.length == 0"
          style="margin:auto; color:#222831"
          class="display-1"
        >Drop image files here</div>
        <v-card v-else>
          <v-list dense>
            <v-list-tile avatar v-for="(image, index) in images" :key="index">
              <v-list-tile-avatar>
                <img
                  v-if="image.isError"
                  src="./assets/times-solid.svg"
                  style="width:22px;height:22px"
                >
                <img
                  v-else-if="image.isFinished"
                  src="./assets/check-solid.svg"
                  style="width:22px;height:22px"
                >
                <v-progress-circular v-else indeterminate color="#f96d00"/>
              </v-list-tile-avatar>
              <div class="ellipsize-left">{{image.file.name}}</div>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-container>
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

export default {
  name: 'App',
  components: {
    vueTopprogress,
  },
  data() {
    return {
      version,
      images: [],
      currentImage: null,
      countFinished: 0,
    };
  },
  methods: {
    onFileDrop(event) {
      if (this.images.length === 0) {
        const files = [];
        Array.from(event.dataTransfer.files).forEach((file) => {
          files.push(file);
        });
        files.sort(utils.dynamicSort('name'));
        files.forEach((file) => {
          this.images.push({ file, isFinished: false, isError: false });
        });
        this.$refs.topProgress.start();
        this.processNext();
      }
    },
    processNext() {
      const nextElement = this.images.find(element => !element.isFinished);

      // All elements processed
      if (nextElement === undefined) {
        this.generateMei();
        return;
      }

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
        .post('http://localhost:8080/upload', formData, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          nextElement.measures = response.data.measures;
          nextElement.isFinished = true;
          this.countFinished += 1;
          this.$refs.topProgress.progress = 100 * (this.countFinished / this.images.length);
          this.processNext();
        })
        .catch((error) => {
          nextElement.isFinished = true;
          nextElement.isError = true;
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
      let curMeasure = 1;
      let curPage = 1;

      this.images.forEach((page) => {
        if (!page.isError) {
          meiFacsimile.append(
            `<surface xml:id="surface_${ulid()}"
            n="${curPage}"
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
            width="${page.width}"
            height="${page.height}"
          />`,
          );

          page.measures.forEach((measure, m) => {
            const meiZoneId = `zone_${ulid()}`;
            meiSurface.append(
              `<zone xml:id="${meiZoneId}"
              type="measure"
              ulx="${Math.floor(measure.left)}"
              uly="${Math.floor(measure.top)}"
              lrx="${Math.floor(measure.right)}"
              lry="${Math.floor(measure.bottom)}"
            />`,
            );

            meiSection.append(
              `<measure xml:id="measure_${ulid()}"
              n="${curMeasure}"
              label="${curMeasure}"
              facs="#${meiZoneId}"
            />`,
            );
            curMeasure += 1;

            if (
              page.measures.length > m + 1
              && page.measures[m + 1].left < measure.left
            ) {
              meiSection.append('<sb />');
            } else if (page.measures.length <= m + 1) {
              meiSection.append('<sb />');
            }
          });

          meiSection.append('<pb />');
          curPage += 1;
        }
      });

      let meiString = new XMLSerializer().serializeToString(meiXml.get(0));
      meiString = vkbeautify.xml(meiString.replace(/ xmlns=""/g, ''));
      saveAs(
        new Blob([meiString], { type: 'text/plain;charset=utf-8' }),
        'measure_annotations.mei',
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
</style>
