const express = require('express')

const { Route } = require('./models')

const app = express()
const PORT = 3000

//操作fast-xml-parser
const fs = require('fs');
const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const gpxData = fs.readFileSync('./path/20230720.gpx', 'utf8');

let jsonObj = '' // 解析後的xml並轉成JSON儲存

// const options = {
//   attributeNamePrefix: '',
//   ignoreAttributes: false,
//   parseAttributeValue: true
// };

// const parser = new XMLParser(parserOptions);
// const builder = new XMLBuilder(options)
// const jsonObj = parser.parse(gpxData);
// const mySqlJson = JSON.stringify(jsonObj)
// console.log(mySqlJson)
// console.log(JSON.parse(mySqlJson))
// const waypoints = jsonObj.gpx.trk.trkseg.trkpt;

// const parsedData = waypoints.map(waypoint => {
//   return {
//     latitude: waypoint.lat,
//     longitude: waypoint.lon,
//     elevation: waypoint.ele,
//     time: waypoint.time
//   }
// })
// console.log(parsedData) //印出json格式的回傳資料

//將回傳資料轉為前端指定的array格式
// const waypointsArray = []

// for (const waypoint of parsedData) {
//   const waypointArray = [
//     waypoint.latitude,
//     waypoint.longitude,
//     // waypoint.elevation,
//     // waypoint.time
//   ];

//   waypointsArray.push(waypointArray)
// }
// console.log(waypointsArray)//此為前端希望的回傳格式


// 解析GPX(xml)檔，並將解析後的檔案轉成JSON
app.get('/parsexml', (req, res) => {
  const parserOptions = {
    attributeNamePrefix: '@_',
    attrNodeName: 'attr',
    textNodeName: '#text',
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    trimValues: true,
    cdataTagName: '__cdata',
    cdataPositionChar: '\\c',
    parseTrueNumberOnly: false,
    arrayMode: false,
    attributeValueProcessor: (val, attrName) => {
      if (attrName === 'version') return val
    }
  };
  const parser = new XMLParser(parserOptions)
  const gpxObj = parser.parse(gpxData)
  jsonObj = JSON.stringify(gpxObj)
// console.log('gpxObj:', gpxObj)
// console.log('jsonObj:', jsonObj)
  res.send(jsonObj)
})

// 將JSON格式的資料轉換回GPX(xml)並儲存至暫存資料夾temp
app.get('/buildxml', async (req, res) => {
  const fileName = 'outputTest'
  const builderOptions = {
    attributeNamePrefix: '@_',
    attrNodeName: 'attr',
    textNodeName: '#text',
    ignoreAttributes: false,
    cdataTagName: '__cdata',
    cdataPositionChar: '\\c',
    format: true,
    indentBy: '  '
  }
  const builder = new XMLBuilder(builderOptions)
  const gpxXml = builder.build(JSON.parse(jsonObj))

  fs.writeFileSync(`./temp/${fileName}.gpx`, gpxXml, 'utf-8')
  res.send(gpxXml)
})

// 將解析完成的JSON檔存到mySQL，執行前請先完成解析步驟(GET /parsexml)
app.get('/savejson', async (req, res) => {
  try {
    if (jsonObj) {
      await Route.create({
        gpx: jsonObj
      })
    } else {
      console.log('no data')
    }
    res.send('this is savejson page.')
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

// 從mySQL中取出JSON資料(只是撈出資料，還沒轉換成xml檔)
app.get('/getjson/:id', async (req, res, next) => {
  const id = req.params.id
  try {
    const gpxJson = await Route.findAll({
      where: { id: id },
      raw: true
    })
    if (gpxJson) {
      console.log('gpxJson:', gpxJson[0].gpx)
      console.log('gpxJson to xml:', JSON.parse(gpxJson[0].gpx))
    } else {
      console.log("can't find data")
    }
    res.send('this is getjson page.')
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

// 下載功能，下載檔案來自暫存資料夾temp，執行前請先完成將JSON轉為GPX檔步驟(GET /buildxml)
app.get('/downloadgpx/:filename', async (req, res, next) => {
  const filename = req.params.filename
  const filePath = __dirname + `/temp/${filename}.gpx` 
  try {
    // 檢查檔案是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(err)
        console.log('file does not exist')
      }
      else {
        res.download(filePath, (error) => {
          if (error) console.log(error);
          else console.log('download now.');
        })
      }
    })
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

app.get('/', (req, res) => {
  res.send('this is home page.')
})

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})