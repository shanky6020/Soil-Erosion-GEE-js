//Massarosa wildfire 17-24 July 2022
//Soil erosion assessment before the wildfire (Baseline), nearly after (ca. 1 day), and one year after
//Differences (before and after) and  Recovery assessment

//------Start of the script-------//
//Image collections
var Before_1day = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") //(2 images on 15/07/2022)
.filterDate("2022-07-15","2022-07-17")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
.filter(ee.Filter.bounds(AOI))
.mosaic();

var After_1day = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") //(2 images on 27/07/2022)
.filterDate("2022-07-26","2022-07-30")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
.filter(ee.Filter.bounds(AOI))
.mosaic();

var After_1Yr = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") //(2 images on 15/07/2023)
.filterDate("2023-07-15","2023-07-17")
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))
.filter(ee.Filter.bounds(AOI))
.mosaic();

//RGB Composites
var visualization = {min:0,
max:3000,
bands : ['B4','B3','B2']
};
Map.addLayer(Before_1day,visualization,"Before 1 day RGB", false);
Map.addLayer(After_1day,visualization,"After 1 day RGB", false);
Map.addLayer(After_1Yr,visualization,"After 1 year RGB", false);
//Map.centerObject(AOI);

//-------RUSLE paramters extraction-------//

/// K Factor
//Soil = soil texture dataset from USDA at 0 cm depth updated until 2018

Soil = Soil .select('b0').clip(AOI).rename('soil');     
//Map.addLayer(Soil, {min: 0, max: 100, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'Soil', 0);

var K = Soil.remap([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
[0.0288, 0.0341, 0.036, 0.0394, 0.0423, 0.0264, 0.0394, 0.0499, 0.050, 0.045, 0.0170, 0.0053])
.rename('K').clip(AOI);              
              
Map.addLayer(K, {min: 0, max: 0.06, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']},  'K Factor Map', 0);

//This K factor above is a baseline for the "Before 1 day conditions"

//---NBR and post-fire K assessment---//

var NBR_Baseline = Before_1day.normalizedDifference(['B8', 'B12']);
var NBRpost_1d = After_1day.normalizedDifference(['B8', 'B12']);
var NBRpost_1y = After_1Yr.normalizedDifference(['B8', 'B12']);

Map.addLayer(NBR_Baseline, {min: -1, max: 1}, "NBR Pre fire (Baseline)", false);
Map.addLayer(NBRpost_1d, {min: -1, max: 1}, "NBR Post fire 1 day", false);
Map.addLayer(NBRpost_1y, {min: -1, max: 1}, "NBR Post fire 1yr", false);

var dNBR_1d = NBR_Baseline.subtract(NBRpost_1d); //For assessing K factor nearly after the wildfire
var dNBR_1y = NBR_Baseline.subtract(NBRpost_1y); //For assessing K factor 1yr after the wildfire
Map.addLayer(dNBR_1d, {}, 'dNBR 1 day after')
Map.addLayer(dNBR_1y, {}, 'dNBR 1 year after')

//-----Burned area-----
// Burned area is tipically detected as the area with dNBR values > 0.1
// This value can be used as a mask to better visualize the results (e.g. RUSLE results will be visualized only within this mask)
var burnedMask = dNBR_1d.gte(0.1);

// Multiply the K factor by an empirical dNBR dependent factor in respect to widlfire lagtime
// Remember! the pre fire condition doens't need NBR multiplication, no wildfire occurred yet!
// First the dNBR must be remapped in order to give a positive value depenedent to the burn severity (Recall the USGS Burn severity table)!
//These increasing factors are empirically created, you can euse theme, they provide an idea of the wildfire impact
// dNBR < 0.1 --> no wildifre --> Kpre = K post
// dNBR + 0.1 - +0.27 --> Low Severity --> Kpost = Kpre*1.2
// dNBR + 0.27 - +0.44 --> Moderate/Low Severity --> Kpost = Kpre*1.4
// dNBR +0.44 - +0.66 --> Moderate/High Severity --> Kpost = Kpre*1.6
// dNBR > +0.66 --> High severity --> Kpost = Kpre*1.8
//dNBR 1d after reclaffied become an increasing factor
dNBR_1d = dNBR_1d.where(dNBR_1d.lt(0.1), 1);
dNBR_1d = dNBR_1d.where((dNBR_1d.gte(0.1).and(dNBR_1d.lt(0.27))), 1.2);
dNBR_1d = dNBR_1d.where((dNBR_1d.gte(0.27).and(dNBR_1d.lt(0.44))), 1.4);
dNBR_1d = dNBR_1d.where((dNBR_1d.gte(0.44).and(dNBR_1d.lt(0.66))), 1.6);
dNBR_1d = dNBR_1d.where(dNBR_1d.gte(0.66), 1.8);
//dNBR 1y reclaffied become an increasing factor
dNBR_1y = dNBR_1y.where(dNBR_1y.lt(0.1), 1);
dNBR_1y = dNBR_1y.where((dNBR_1y.gte(0.1).and(dNBR_1y.lt(0.27))), 1.2);
dNBR_1y = dNBR_1y.where((dNBR_1y.gte(0.27).and(dNBR_1y.lt(0.44))), 1.4);
dNBR_1y = dNBR_1y.where((dNBR_1y.gte(0.44).and(dNBR_1y.lt(0.66))), 1.6);
dNBR_1y = dNBR_1y.where(dNBR_1y.gte(0.66), 1.8);

var Kpost_1d = K.multiply(dNBR_1d).rename('K_post_1d');
var Kpost_1y = K.multiply(dNBR_1y).rename('K_post_1y');
Map.addLayer(Kpost_1d, {}, 'K post 1 day', false);
Map.addLayer(Kpost_1y, {}, 'K post 1 year', false)

//------R Factor-----//
//For the R factor calculation, starting from a mean annual precipitation should be enough

// Define a 10 years dataset
var timeSpan = ee.DateRange("2011-01-01", "2021-12-31");

// Filter the dataset for the date range and calculate the total precipitation in ten year
var precipitationTotal = CHIRPS.filterDate(timeSpan.start(), timeSpan.end()).select('precipitation').sum().clip(AOI);

//divide by 10 to extract the mean annual precipitation (MAP)
var ten = ee.Image(10)
var MAP = precipitationTotal.divide(ten)
//Map.addLayer(MAP, {min: 800, max: 900}, 'MAP');

// Calculate the R factor
var R = MAP.multiply(0.363).add(79).rename('R');

// Add the R factor layer to the map with a color palette
Map.addLayer(R, {min: 300, max: 400, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'R Factor Map', false);

//------LS Factor------//

var elevation = DEM.select('elevation');
var slope = ee.Terrain.slope(elevation).clip(AOI);
//Converting Slope from Degrees to %
var LS = slope.divide(180).multiply(Math.PI).tan()//.multiply(100);
 
Map.addLayer(slope, {min: 0, max: 15, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'slope in %', 0);

// var LS4 = Math.sqrt(500/100); 
// var LS3 = ee.Image(slope.multiply(0.53));
// var LS2 = ee.Image(slope).multiply(ee.Image(slope).multiply(0.076));
// var LS1 = ee.Image(LS3).add(LS2).add(0.76);
// var LS = ee.Image(LS1).multiply(LS4).rename("LS");
 
Map.addLayer(LS, {min: 0, max: 90, palette: ['a52508','ff3818','fbff18','25cdff','2f35ff','0b2dab']}, 'LS Factor Map', 0);


// ------P Factor------//
var lulc = lulc.select('landcover').rename('lulc');
//Map.addLayer (lulc, {}, 'lulc', 0);

// Combined LULC & slope in single image
var lulc_slope = lulc.addBands(slope);

// Create P Facor map using an expression (codes from 211 to 244 stand for agricultural land use)
//P factor is dependent from agricultural practicies and slope, other land use could be set as costant
var P = lulc_slope.expression(
  "(b('lulc') > 244) ? 0.8 :" + //(codes > 242 stand for forest land uses)
    "(b('lulc') < 143) ? 1 :" + //(codes < 143 stand for artificial land uses)
    "((b('slope') < 2) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.6 :" +
    "((b('slope') < 5) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.5 :" +
    "((b('slope') < 8) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.5 :" +
    "((b('slope') < 12) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.6 :" +
    "((b('slope') < 16) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.7 :" +
    "((b('slope') < 20) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.8 :" +
    "((b('slope') > 20) && (b('lulc') > 211) && (b('lulc') < 244)) ? 0.9 :" +
    "1"
    ).rename('P').clip(AOI);
Map.addLayer (P, {}, 'P Factor', 0);

//-----C Factor-----//
//C factor could be calculated by the use of the inverse of NDVI (High NDVI means low C values and viceversa)
//Calculate NDVI for the three conditions
var ndviBefore = Before_1day.normalizedDifference(['B8','B4']).rename("NDVI");
var ndviAfter_1d = After_1day.normalizedDifference(['B8','B4']).rename("NDVI");
var ndviAfter_1y = After_1Yr.normalizedDifference(['B8','B4']).rename("NDVI");

//Calculate the inverse of NDVI (by subtracting 1 to the NDVI value)
var oneImage = ee.Image(1)
var C_Before = oneImage.subtract(ndviBefore);
var C_after_1d = oneImage.subtract(ndviAfter_1d);
var C_after_1y = oneImage.subtract(ndviAfter_1y);
Map.addLayer (C_Before, {min: 0, max: 1, palette: ['green', 'yellow', 'red']}, 'C Before',0);
Map.addLayer (C_after_1d, {min: 0, max: 1, palette: ['green', 'yellow', 'red']}, 'C After 1d',0);
Map.addLayer (C_after_1y, {min: 0, max: 1, palette: ['green', 'yellow', 'red']}, 'C After 1y',0);

// ----- RUSLE soil loss calculation-----/
// RUSLE formula for the three conditions (A = R x K x LS x C x P)
//These results are visualized only for the burned area by the use of the burnedMask (line 69)
var soilLoss_Before = ee.Image(R.multiply(K).multiply(LS).multiply(C_Before).multiply(P)).rename("Soil_Loss_before").updateMask(burnedMask)
var soilLoss_After1d = ee.Image(R.multiply(Kpost_1d).multiply(LS).multiply(C_after_1d).multiply(P)).rename("Soil_Loss_after_1d").updateMask(burnedMask)
var soilLoss_After1yr = ee.Image(R.multiply(Kpost_1y).multiply(LS).multiply(C_after_1y).multiply(P)).rename("Soil_Loss_after_1y").updateMask(burnedMask)

Map.addLayer (soilLoss_Before, {min: 0, max: 10, palette: ['green', 'yellow', 'orange', 'red']}, 'Soil Loss before', 0)
Map.addLayer (soilLoss_After1d, {min: 0, max: 10, palette: ['green', 'yellow', 'orange', 'red']}, 'Soil Loss after 1 day', 0)
Map.addLayer (soilLoss_After1yr, {min: 0, max: 10, palette: ['green', 'yellow', 'orange', 'red']}, 'Soil Loss after 1 year', 0)

//Merge togheter the three images in one image (useful for composites, or other analysis)
//This is not mandatory (you can skip this part and visualize as single images)
// var soilLoss = soilLoss_Before.addBands(soilLoss_After1d)
// var soilLoss = soilLoss.addBands(soilLoss_After1yr)
// Map.addLayer (soilLoss, {min: 1, max: 500}, 'Soil Loss composite', 0)
// Red: soil loss before, Green: soil loss after 1d, Blue: soil loss after 1yr

print('Max and min Soil erosion rate before:', soilLoss_Before.reduceRegion(ee.Reducer.minMax(), AOI))
print('Max and min Soil erosion rate after 1 day:', soilLoss_After1d.reduceRegion(ee.Reducer.minMax(), AOI))
print('Max and min Soil erosion rate after 1 yr:', soilLoss_After1yr.reduceRegion(ee.Reducer.minMax(), AOI))

// ----Graphs for soil erosion pixel distribution------ //
// Before the wildfire
var options = {
lineWidth: 1,
pointSize: 2,
hAxis: {title: 'Soil erosion rate (t/ha*yr)'},
vAxis: {title: 'Num of pixels'},
title: 'Number of pixels by soil erosion rate (Before the wildfire)'
}; 
var histBefore = ui.Chart.image.histogram({
  image: soilLoss_Before,
  region: AOI,
}).setOptions(options);
print(histBefore);
// After 1 day
var options = {
lineWidth: 1,
pointSize: 2,
hAxis: {title: 'Soil erosion rate (t/ha*yr)'},
vAxis: {title: 'Num of pixels'},
title: 'Number of pixels by soil erosion rate (After 1 day from the wildfire)'
}; 
var histAfterD = ui.Chart.image.histogram({
  image: soilLoss_After1d,
  region: geometry,
}).setOptions(options);
print(histAfterD);
// After 1 year------- //
var options = {
lineWidth: 1,
pointSize: 2,
hAxis: {title: 'Soil erosion rate (t/ha*yr)'},
vAxis: {title: 'Num of pixels'},
title: 'Number of pixels by soil erosion rate (After 1 year from the wildfire)'
}; 
var histAfterY = ui.Chart.image.histogram({
  image: soilLoss_After1yr,
  region: AOI,
}).setOptions(options);
print(histAfterY);

//---------Validation--------
var soilWatchAOI = soilWatch.clip(AOI);
Map.addLayer(soilWatchAOI, {min:0, max: 50, palette: ['green', 'yellow', 'red']}, 'Soil erosion watch')
// Please use this reference for soil erosion watch
// Ouellette, W. (2021, May 28). Soil erosion watch RUSLE (Version 1.0.0). GitHub. https://github.com/SoilWatch/soil-erosion-watch

// Compute differences between RUSLE and print out the image
var differences = soilLoss_Before.subtract(soilWatchAOI);
Map.addLayer(differences, {min: -10, max: 10, palette: ['red', 'white', 'blue']}, 'Differences GEE before - Soil watch');
// Please create a legend (you can adjust the legend that you already done with the corrected value from the differences image)

// // Soil watch vs RUSLE before scatterplot
var beforeMasked = soilLoss_Before.updateMask(soilWatchAOI)

var valid = ee.ImageCollection([beforeMasked, soilWatchAOI]).toBands()
Map.addLayer(valid)
var points = ee.FeatureCollection.randomPoints({region: geometry, points:1000})
var samples = valid.sampleRegions(points);

var chart = ui.Chart.feature.byFeature(samples, '1_b1', '0_Soil_Loss_before')
  .setChartType('ScatterChart')
  .setOptions({
    dataOpacity: 0.7,
    title: 'Soil Watch soil erosion rate vs RUSLE model Before Wildfire soil erosion rate',
    hAxis: {
      title: 'Soil watch rate (t/ha*yr)',
      //logScale: true
      },
    vAxis: {
      title: 'Before the wildfire rate (t/ha*yr)',
      //logScale: true
      },
    trendlines: {
      0: {
        type: 'linear',
        color: 'black',
        lineWidth: 2,
        opacity: 1,
        showR2: false,
        visibleInLegend: false,
      }
    }
  });  
print(chart);

//----------------------------------------------------------------------------

// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }});
 
// Create legend title
var legendTitle = ui.Label({
  value: 'Soil erosion class',
  style: {fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }});
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      })};
 
//  Palette with the colors
var palette =['7a8737', 'acbe4d', '0ae042', 'fff70b', 'ffaf38', 'ff641b', 'a41fd6', 'ffffff'];
 
// name of the legend
var names = ['Enhanced Regrowth, High','Enhanced Regrowth, Low','Unburned', 'Low soil loss',
'Moderate-low soil loss', 'Moderate-high soil loss', 'High soil loss', 'NA'];
 
// Add color and and names
for (var i = 0; i < 8; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);
