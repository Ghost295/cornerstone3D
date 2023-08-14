import { xhrRequest } from '../internal/index';
import findIndexOfString from './findIndexOfString';

function findBoundary(header: string[]): string {
  for (let i = 0; i < header.length; i++) {
    if (header[i].substr(0, 2) === '--') {
      return header[i];
    }
  }
}

function findContentType(header: string[]): string {
  for (let i = 0; i < header.length; i++) {
    if (header[i].substr(0, 13) === 'Content-Type:') {
      return header[i].substr(13).trim();
    }
  }
}

function uint8ArrayToString(data, offset, length) {
  offset = offset || 0;
  length = length || data.length - offset;
  let str = '';

  for (let i = offset; i < offset + length; i++) {
    str += String.fromCharCode(data[i]);
  }

  return str;
}

function getPixelDataFramesChunked(
  uri,
  imageId: string,
  mediaType = 'application/octet-stream'
): Promise<any> {
  const headers = {
    Accept: mediaType,
  };

  const strlistFrames: string = imageId.slice(imageId.lastIndexOf('/') + 1);
  const listFrames: number[] = strlistFrames.split(',').map(Number);

  const rootUrl = imageId.slice(0, imageId.indexOf('/frames/'));

  // const requestUrl = `${baseUri}/frames/${listFrames.join()}`;

  return new Promise((resolve, reject) => {
    const loadPromise = xhrRequest(uri, imageId, headers);
    const { xhr } = loadPromise;

    loadPromise.then(function (imageFrameAsArrayBuffer /* , xhr*/) {
      // request succeeded, Parse the multi-part mime response
      const response = new Uint8Array(imageFrameAsArrayBuffer);

      const contentType =
        xhr.getResponseHeader('Content-Type') || 'application/octet-stream';

      if (contentType.indexOf('multipart') === -1) {
        resolve({
          contentType,
          frames: [
            {
              pixelData: response,
              id: imageId,
            },
          ],
        });

        return;
      }

      // First look for the multipart mime header
      const tokenIndex = findIndexOfString(response, '\r\n\r\n');
      if (tokenIndex === -1) {
        reject(new Error('invalid response - no multipart mime header'));
      }

      const header = uint8ArrayToString(response, 0, tokenIndex);

      // Now find the boundary  marker
      const split = header.split('\r\n');

      const boundary = findBoundary(split);
      if (!boundary) {
        reject(new Error('invalid response - no boundary marker'));
      }
      const currentStartIndex = tokenIndex + 4; // skip over the \r\n\r\n

      let currentEndIndex;
      const frameIndex = 0;

      const imagesData: object[] = [];

      while (
        frameIndex < listFrames.length &&
        currentStartIndex !== -1 &&
        (currentEndIndex = findIndexOfString(
          response,
          boundary,
          currentStartIndex
        )) !== -1
      ) {
        // Remove \r\n from the length
        const length = currentEndIndex - currentStartIndex - 2;

        const imageId = `wadorsm:${rootUrl}/frames/${listFrames[frameIndex]}`;

        const imageData = new Uint8Array(
          imageFrameAsArrayBuffer,
          currentStartIndex,
          length
        );

        imagesData.push({
          pixelData: imageData,
          id: imageId,
        });
      }

      console.log(findContentType(split).split(';')[1].split('=')[1]);
      console.log(findContentType(split));

      // return the info for this pixel data
      resolve({
        contentType: findContentType(split),
        frames: imagesData,
      });
    }, reject);
  });
}

export default getPixelDataFramesChunked;
