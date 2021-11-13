const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
app.listen(process.env.PORT || port, ()=>{console.log(`Listnening at ${port}`)});

app.use(express.static('public'));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname , '/public/index.html'), function(err) {
    if (err) {
      res.status(500).send(err);
      console.log("Something wrong");
    }
  })
})

// my pull