const http = require('http');
const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');

const clients = new Map();
const messageHistory = [];

app.get('/ping', (req, res) => {
  console.log('有人ping我');
  res.send('pong');
})
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = uuidv4();
  const sseConnection = {
    res,
    clientId,
  };

  clients.set(clientId, sseConnection)

  req.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });

  sendSSEEvent(res, 'messageHistory', messageHistory);
  sendSSEEvent(res, 'connected', {
    message: `Client ${clientId} connected`,
    userId: clientId
  });
});

app.post('/message', express.json(), (req, res) => {
  const { userId, message } = req.body;
  const newMessage = { userId, message };

  messageHistory.push(newMessage);

  clients.forEach(({ res, clientId }) => {
    sendSSEEvent(res, 'messageHistory', messageHistory);
  });

  res.sendStatus(200);
});

function sendSSEEvent(res, eventName, eventData) {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(eventData)}\n\n`;
  res.write(data);
}

app.listen(8080, () => {
  console.log('Server listening on port 8080');
  setInterval(() => {
    http.get('https://sse-example.fly.dev/ping')
  }, 3000);
});