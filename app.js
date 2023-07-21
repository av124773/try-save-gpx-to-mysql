const express = require('express')

const { Route } = require('./models')

const app = express()
const PORT = 3000

//操作fast-xml-parser
const fs = require('fs');
const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const util = require('util');
const writeFileAsync = util.promisify(fs.writeFile);

const gpxData = fs.readFileSync('./path/20230720.gpx', 'utf8');
const options = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseAttributeValue: true
};

const parser = new XMLParser(options);
const builder = new XMLBuilder(options)
const jsonObj = parser.parse(gpxData);
const mySqlJson = JSON.stringify(jsonObj)
// console.log(mySqlJson)
// console.log(JSON.parse(mySqlJson))
const waypoints = jsonObj.gpx.trk.trkseg.trkpt;

const parsedData = waypoints.map(waypoint => {
  return {
    latitude: waypoint.lat,
    longitude: waypoint.lon,
    elevation: waypoint.ele,
    time: waypoint.time
  }
})
// console.log(parsedData) //印出json格式的回傳資料

//將回傳資料轉為前端指定的array格式
const waypointsArray = []

for (const waypoint of parsedData) {
  const waypointArray = [
    waypoint.latitude,
    waypoint.longitude,
    // waypoint.elevation,
    // waypoint.time
  ];

  waypointsArray.push(waypointArray)
}
// console.log(waypointsArray)//此為前端希望的回傳格式

// 顯示經XMLparser解析出來的string
app.get('/showlocalxml', async (req, res) => {
  console.log(typeof(jsonObj)) //
  res.send(jsonObj)
})
app.get('/showlocaljson', async (req, res) => {
  console.log(typeof(mySqlJson))
  res.send(mySqlJson)
})
app.get('/savejson', async (req, res) => {
  await Route.create({
    gpx: mySqlJson,
    str_gpx: jsonObj
  })
  res.send('this is savejson page.')
})
app.get('/getjson', async (req, res) => {
  const gpxJson = await Route.findAll({
    where: { id: 1 },
    raw: true
  })
  if (gpxJson) {
    console.log('gpxJson:', gpxJson[0].gpx)
    console.log('gpxJson to xml:', JSON.parse(gpxJson[0].gpx))
  }
  res.send('this is getjson page.')
})
app.get('/downloadgpx', async (req, res) => {
  const gpxName = '20230721' // 暫定名稱，實作會撈取資料庫中的路線名稱
  const filePath = __dirname + `/temp/${gpxName}.gpx`
  const optionsXml = {
    ignoreAttributes: false,
    attributeNamePrefix: '',
    attrNodeName: 'attributes',
    textNodeName: '#text',
  };
  const parserXml = new XMLParser(optionsXml);
  try {
    const gpxJson = await Route.findAll({
      where: { id: 1 },
      raw: true
    });

    if (gpxJson) {
      const buildXml = builder.build(JSON.parse(gpxJson[0].gpx))
      
      const gpxData = parserXml.parse(gpxJson[0].gpx);
      const gpxString = parserXml.parse(gpxData, {
        ignoreAttributes: false,
        format: true,
      });
      await writeFileAsync(filePath, gpxString);

      // await writeFileAsync(filePath, buildXml);
      // res.download(filePath, (error) => {
      //   if (error) console.log(error);
      //   else console.log('download now.');
      // })
    } else {
      res.send('No GPX data found.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
  // res.send('this is download page.')
})
app.get('/', (req, res) => {
  res.send('this is home page.')
})


app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})