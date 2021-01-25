const express = require('express');
const http = require('http');
const path = require('path');
const compression = require('compression');

const app = express();

app.use(compression());

app.use(express.static(path.join(__dirname, 'dist/game-coach-front')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/game-coach-front/index.html'));
});

const port = process.env.PORT || 3500;
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log("running"));
