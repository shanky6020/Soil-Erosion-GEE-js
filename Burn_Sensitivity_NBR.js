var preFire = s2.filterDate("2022-07-14","2022-07-17")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.filter(ee.Filter.bounds(AOI))
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.mosaic();
print(preFire)
var postFire = s2.filterDate("2022-07-23","2022-07-26")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.filter(ee.Filter.bounds(AOI))
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.mosaic();
print(postFire)

var During = s2.filterDate("2023-07-17","2023-07-23")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.filter(ee.Filter.bounds(AOI))
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)) 
.mosaic();
print(During)

Map.addLayer(preFire, { min: [0], max: [3000], bands: ['B4', 'B4', 'B1'] }, 'Image');
Map.addLayer(postFire, { min: [0], max: [3000], bands: ['B4', 'B4', 'B1'] }, 'Image');
Map.addLayer(During, { min: [0], max: [3000], bands: ['B4', 'B4', 'B1'] }, 'During');
Map.centerObject(AOI);
//var bandMap = {
  //BLUE: image.select('B2'),
  //GREEN: image.select('B3'),
  //: image.select('B4'),
  //NIR: image.select('B8'),
  //SWIR1: image.select('B11'),
  //SWIR2: image.select('B12'),
//};


var NBR1 = preFire.expression(
        "(NIR - SWIR2) / (NIR + SWIR2)",
        {
          SWIR2: preFire.select('B12'),    //SWIR2
          NIR: preFire.select('B8'),    // NIR
          BLUE: preFire.select('B2')    // BLUE
        });

    Map.addLayer(NBR1, {min: 0, max: 1}, "NBR1");

var NBR2 = postFire.expression(
        "(NIR - SWIR2) / (NIR + SWIR2)",
        {
          SWIR2: postFire.select('B12'),    //SWIR2
          NIR: postFire.select('B8'),    // NIR
          BLUE: postFire.select('B2')    // BLUE
        });

var NBR3 = During.expression(
        "(NIR - SWIR2) / (NIR + SWIR2)",
        {
          SWIR2: During.select('B12'),    //SWIR2
          NIR: During.select('B8'),    // NIR
          BLUE: During.select('B2')    // BLUE
        });

    Map.addLayer(NBR3, {min: 0, max: 1}, "NBR3");


    Map.addLayer(NBR2, {min: 0, max: 1}, "NBR2");
var dNBR = NBR1.subtract(NBR2);

    Map.addLayer(dNBR, {min: 0, max: 1}, "dNBR");
    
var colorizedVis = {
  min: -1.0,
  max: 1.0,
    palette: ['000000', 'FFFFFF'],
};

// Map.centerObject(AOI);
// Map.addLayer(NBR1, colorizedVis, 'NBR1');

// Map.centerObject(AOI);
// Map.addLayer(NBR2, colorizedVis, 'NBR2');

// Map.centerObject(AOI);
// Map.addLayer(NBR3, colorizedVis, 'NBR3');

// Map.centerObject(AOI);
// Map.addLayer(dNBR, colorizedVis, 'dNBR');


/// K Factor
Soil = Soil.select('b0').clip(AOI).rename('soil');     
Map.addLayer(Soil, {min: 0, max: 100, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'Soil', 0);

var K = Soil.expression(
    "(b('soil') > 11) ? 0.0053" +
      ": (b('soil') > 10) ? 0.0170" +
        ": (b('soil') > 9) ? 0.045" +
           ": (b('soil') > 8) ? 0.050" +
            ": (b('soil') > 7) ? 0.0499" +
            ": (b('soil') > 6) ? 0.0394" +
            ": (b('soil') > 5) ? 0.0264" +
            ": (b('soil') > 4) ? 0.0423" +
            ": (b('soil') > 3) ? 0.0394" +
            ": (b('soil') > 2) ? 0.036" +
            ": (b('soil') > 1) ? 0.0341" +
            ": (b('soil') > 0) ? 0.0288" +
             ": 0")
             .rename('K').clip(AOI);              
              
Map.addLayer(K, {min: 0, max: 0.06, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'KFactor Map', 0);

/// Multiply the K factor with nbr 
var one_day_before_NBR = NBR1.multiply(K).rename('NBR1DayBefK');
print('1 Day Before NBR multiplied by K:', one_day_before_NBR);
var one_day_After_NBR = NBR2.multiply(K).rename('NBR1DayAftK');
print('1 Day After NBR multiplied by K:', one_day_After_NBR);
var one_yr_After_NBR = NBR3.multiply(K).rename('NBR1YrAftK');
print('1 Day Before NBR multiplied by K:', one_yr_After_NBR);
rint('1 Day Before NBR multiplied by K:', one_yr_After_NBR);

