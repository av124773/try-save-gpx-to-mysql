const express = require('express')

const { Route } = require('./models')

const app = express()
const PORT = 3000

//操作fast-xml-parser
const fs = require('fs');
const { XMLParser } = require("fast-xml-parser");

const gpxData = fs.readFileSync('./path/20230720.gpx', 'utf8');
const options = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseAttributeValue: true
};

const parser = new XMLParser(options);
const jsonObj = parser.parse(gpxData);
const mySqlJson = JSON.stringify(jsonObj)
console.log(mySqlJson)
console.log(JSON.parse(mySqlJson))
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
console.log(waypointsArray)//此為前端希望的回傳格式

app.get('/savejson', async (req, res) => {
  await Route.create({
    gpx: mySqlJson
  })
  res.redirect('/')
})
app.get('/getjson', async (req, res) => {
  const gpxJson = await Route.findAll({
    where: { id: 1 },
    raw: true
  })
  if(gpxJson) {
    console.log('gpxJson:', gpxJson[0].gpx)
    console.log('gpxJson to xml:', JSON.parse(gpxJson[0].gpx))
  }
  res.redirect('/')
})
app.get('/', (req, res) => {
  res.send('this is home page.')
})


app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})