import loadImage from './loadImage';
import { metaDataProvider } from './metaData/index';
import loadImageChunked from './loadImageChunked';

export default function (cornerstone) {
  // register wadors scheme and metadata provider
  cornerstone.registerImageLoader('wadors', loadImage);
  cornerstone.registerImageLoader('wadorsm', loadImageChunked);
  cornerstone.metaData.addProvider(metaDataProvider);
}
