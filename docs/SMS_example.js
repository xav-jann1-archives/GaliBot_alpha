//Example:

const SMS_api = require('../lib/SMS.js')  //*

// Create SMS Object:
let SMS = new SMS_api({
  port: '/dev/serial0',
  baudRate: 19200,
  pin: '1234'
})

// Connect to module:
SMS.init().then(response => {
  console.log(response)

  // Send a message:
  let msg = {
    to: "+336xxxxxxxx",
    text: "send automatic message"
  }
  SMS.sendMessage(msg).then(console.log);

  // Read a message from memory:
  let idx = 4;
  SMS.readMessage(idx).then(console.log)


  // Read all messages with index between 1 et 10:
  for(let i=1; i<10; i++){
    SMS.readMessage(i).then(console.log)
  }

  // Add message in memory: return idx
  let text = "Test with automatic API";
  SMS.addMessageInMem(text).then(idx => {
    console.log("Message saved at index: " + idx);
  });

  // Send a message from memory to a num:
  idx = 1;
  let to = "+336xxxxxxxx";
  SMS.sendMessageFromMem(idx, to).then(console.log)

}).catch(error => {
  console.log(error);
})

SMS.on('notification', (msg)=>{
  console.log(msg)
})

// TODO: change idx -> msg
SMS.on('new message', (idx)=>{
  console.log("nouveau message")
  console.log(idx)
  SMS.readMessage(idx)
})


// CLI:
const readline = require('readline');

const CLI = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
});

CLI.on('line', (line) => {
  line = line.trim();
  SMS.executeCommand(line).then(console.log)

}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
