var dataset = s2.filterDate("2022-07-17","2022-07-23")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.filter(ee.Filter.bounds(AOI));
var image = dataset.median()
Map.addLayer(image, { min: [0], max: [3000], bands: ['B4', 'B4', 'B1'] }, 'Image');
Map.centerObject(AOI);
var bandMap = {
  BLUE: image.select('B2'),
  GREEN: image.select('B3'),
  RED: image.select('B4'),
  NIR: image.select('B8'),
  SWIR1: image.select('B11'),
  SWIR2: image.select('B12'),
};
// Calculate Normalized Difference Vegetation Index
var ndvi = image.expression('(NIR - RED) / (NIR + RED)', bandMap).rename('NDVI');
Map.addLayer(ndvi, { min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI');

// Calculate Enhanced Vegetation Index
var evi = image.expression('(2.5 * (NIR - RED)) / (NIR + 6 * RED - 7 * BLUE + 1)', bandMap).rename('EVI');
Map.addLayer(evi, { min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'EVI');
// Calculate Normalized Difference Water Index
var ndwi = image.expression('(GREEN - SWIR1) / (GREEN + SWIR1)', bandMap).rename('NDWI');
Map.addLayer(ndwi, { min: -1, max: 1, palette: ['red', 'white', 'blue']}, 'NDWI');

// Calculate Normalized Difference Built-up Index
var ndbi = image.expression('(SWIR1 - NIR) / (SWIR1 + NIR)', bandMap).rename('NDBI');
Map.addLayer(ndbi, { min: -1, max: 1, palette: ['blue', 'white', 'red']}, 'NDBI');

// Calculate Enhance Mangrove Vegetation Index
var mvi = image.expression('(GREEN - SWIR2) / (SWIR1 - GREEN)', bandMap).rename('EMVI');
Map.addLayer(mvi, { min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'EMVI');
// Calculat Normalized Difference Moisture Index [ref]
var ndmi = image.expression ('(NIR-SWIR1)/(NIR+SWIR1)',bandMap).rename('NDMI');
Map.addLayer(mvi, { min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDMI');
