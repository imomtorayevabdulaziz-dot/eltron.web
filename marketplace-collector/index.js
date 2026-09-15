const { UzumSDK, UzumClient, UzumSearch, UzumProduct, UzumCategory, UzumCities } = require('./uzum');
const { WildberriesSDK, WildberriesClient, WildberriesSearch, WildberriesProduct, WildberriesSeller } = require('./wildberries');
const Exporter = require('./storage/exporter');
const ImageDownloader = require('./storage/imageDownloader');
const config = require('./config');

module.exports = {
  // Uzum Market
  Uzum: UzumSDK,
  UzumSDK,
  UzumClient,
  UzumSearch,
  UzumProduct,
  UzumCategory,
  UzumCities,

  // Wildberries
  Wildberries: WildberriesSDK,
  WildberriesSDK,
  WildberriesClient,
  WildberriesSearch,
  WildberriesProduct,
  WildberriesSeller,

  // Utilities
  Exporter,
  ImageDownloader,
  config
};
