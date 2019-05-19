/* eslint-disable */

import { ulid } from 'ulid';

function dynamicSort(property) {
  let sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  };
}

function getTemplate(date, version) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <mei xmlns="http://www.music-encoding.org/ns/mei">
        <meiHead>
            <fileDesc>
                <titleStmt/>
                <pubStmt/>
            </fileDesc>
            <encodingDesc>
                <appInfo>
                    <application isodate="${date}" version="${version}">
                        <name>Deep Optical Measure Detector</name>
                        <p>Measures detected with Deep Optical Measure Detector</p>
                    </application>
                </appInfo>
            </encodingDesc>
        </meiHead>
        <music>
            <facsimile>
            </facsimile>
            <body>
              <mdiv xml:id="mdiv_${ulid()}" n="1" label="">
                <score>
                  <scoreDef/>
                  <section>
                    <pb/>
                  </section>
                </score>
              </mdiv>
            </body>
        </music>
    </mei>`
}

export default { dynamicSort, getTemplate };
