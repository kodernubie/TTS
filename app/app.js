const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const opn = require('opn')
const textToSpeech = require('@google-cloud/text-to-speech')

const app = express()
const port = 3000

app.use(bodyParser.json())
app.post('/init', async function (req, res) {
    
    let d = new Date();

    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear(),
        hour = d.getHours(),
        minute = d.getMinutes(),
        ss = d.getSeconds();

    if (month.length < 2) 
        month = '0' + month;
    
    if (day.length < 2) 
        day = '0' + day;

    if (hour.length < 2) 
        hour = '0' + hour;

    if (minute.length < 2) 
        minute = '0' + minute;

    if (ss.length < 2) 
        ss = '0' + ss;

    let dirName = year + month + day + hour + minute + ss;

    await fs.promises.mkdir(__dirname + "/html/" + dirName, { recursive: true });

    res.send('{ "id" : "' + dirName + '" }');
})

app.use(bodyParser.json())
app.post('/convert', async function (req, res) {
    
    const client = new textToSpeech.TextToSpeechClient();
    const request = {
        input: {text: req.body.text},
        voice: {languageCode: 'id-ID', ssmlGender: 'NEUTRAL'},
        audioConfig: {audioEncoding: 'MP3'},
      };
    
      let fileNo = 0;
      let list = await fs.promises.readdir(__dirname + "/html/" + req.body.id);

      let found = false;
      let fileName = "" + fileNo;

      while (!found) {

        found = true;
        fileNo++;
        fileName = "" + fileNo;
        
        while (fileName.length < 4)
            fileName = "0" + fileName;

        fileName = fileName + ".mp3";

        for (i in list) {

            if (list[i] == fileName) {
                found = false;
                break;
            }
        }
      }

      const [response] = await client.synthesizeSpeech(request);
      await fs.promises.writeFile(__dirname + "/html/" + req.body.id + "/" + fileName, response.audioContent, 'binary');
      console.log('Audio content written to file: ' + fileName);
      
      res.send('{ "link" : "' + req.body.id + '/' +  fileName + '" }')
})

app.use(express.static('app/html'))

app.listen(port, () => {
    console.log(`TTS app listening at http://localhost:${port}`)
    opn('http://127.0.0.1:' + port)
})