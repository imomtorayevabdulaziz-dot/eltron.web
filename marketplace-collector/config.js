/**
 * Marketplace Collector - Konfiguratsiya
 */

module.exports = {
  uzum: {
    graphqlUrl: 'https://graphql.uzum.uz/',
    apiUrl: 'https://api.uzum.uz/api/',
    token: "eyJraWQiOiIwcE9oTDBBVXlWSXF1V0w1U29NZTdzcVNhS2FqYzYzV1N5THZYb0ZhWXRNIiwiYWxnIjoiRWREU0EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJVenVtIElEIiwiaWF0IjoxNzg4NjkzMDAxLCJzdWIiOiIzNTVlNWIyMC03MjFkLTQ4OTMtYmEwZS1mNjlmOTg1YTllYTYiLCJhdWQiOlsidXp1bV9hcHBzIiwibWFya2V0L3dlYiJdLCJldmVudHMiOnt9LCJleHAiOjE3ODg3MDM4MDF9.xJwOpXlKQitjxb5EmgwfghifWIScVjvfwxEJFp6tgAKduEdBGLmjiJpa_kzYBqZBluP6N8V3J6izmMdXzoIGAg",
    xiid: '5baf0ca1-8cd8-4dd6-bb54-9224b9f6e9d1',
    clientName: 'web-customers',
    clientVersion: '1.63.2',
    defaultCityId: '1', // Toshkent
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  wildberries: {
    searchUrl: 'https://search.wb.ru/exactmatch/ru/common/v7/search',
    catalogUrl: 'https://catalog.wb.ru/catalog',
    detailUrl: 'https://card.wb.ru/cards/v2/detail',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    defaultDest: '-1257786', // Toshkent / umumiy mintaqa dest kodi
    defaultCurr: 'rub' // rub, uzs
  }
};
