const SerialPort = require('serialport');
const EventEmitter = require('events').EventEmitter;

const defaultSettings = Object.freeze({
  port: '/dev/serial0',
  baudRate: 19200,
  pin: '1234'
})

const ctrlZ = String.fromCharCode(26); // End char when writing a text message


class SMS_API extends EventEmitter{

constructor(options){
  super(); // For events

  // Combine defaultSettings and user options: (cannot be change later : thanks to Object.freeze())
  this.settings = Object.assign({}, defaultSettings, options)

  this.SERIAL = undefined;
  this.state = "wait init..";

  this.buffer = Buffer.alloc(0); // empty buffer
  this.timeout = undefined;      // Reference to Timeout
  this.buffDelay = 30;           // Max delay between 2 buffers before the all buffer is computed

  this.commandsList = [];
  this.commandInProgress = false;

  // When a new command need to be executed:
  this.on('new command', command => {
    // Save command in a list:
    this.commandsList.push(command);

    // Command to be send:
    this.sendNextCommand();
  });

}

// Connect to Serial and setup SMS module:
init(){
  return new Promise((resolve, reject) => {

    if(this.state == "wait init..") this.state = "init";
    else { reject("Init already done"); return }

    console.log("connecting...");

    // Connect to Serial:
    let port = this.settings.port;
    let baudRate = this.settings.baudRate;
    let params = { baudRate };
    this.SERIAL = this.connectSerial(port, params);

    // Serial input:
    this.SERIAL.on('data', (data) => this.serialInput(data)) // '() => function' needed for 'this' to refer to SMS_API and not SerialPort

    this.state = "idle";
    resolve("init done");
  })
}

connectSerial(port,params){
  return new SerialPort(port, params, function(error){
    if(error){
      return console.log("Error: ", error.message);
    }
    console.log("serial ok");
  });
}


/**
*  Execute a command:
*/

// Command to be executed is stored in a list and return a promise:
executeCommand(command){
  return new Promise((resolve, reject) => {
    // Create token to identify command with this.emit()
    let token = Math.random().toString(36).substring(7);

    // Warn process to add command on the list:
    this.emit('new command', { command, token })

    // Wait until response:
    this.once(token, answer => {
      resolve(answer)
    });
  });
}

// Send to module a command stored in list (one command at a time):
sendNextCommand(){
  // If there is a command waiting and there is no command in progress :
  if(!this.commandInProgress && this.commandsList.length > 0){
    this.commandInProgress = true;

    // Get command from list:
    let command = this.commandsList[0].command;

    // Special characters:
    if(command[0]=="_") command = command.substr(1);  // No <CR>? or <LF>?
    else if(command == "st") command = "abc\r\n+CMGL: 45\r\nachy"
    else if(command == "ee") command = ctrlZ;  // end input text
    else command += "\r"

    // Send command through Serial:
    this.SERIAL.write(command, function(error) {
      if(error){
        return console.log('Error on write: ', error.message);
      }
    });

    console.log("Send:", command)
  }
}


// Manage buffer packets on Serial's input:
serialInput(data){
  // Reset buffer if it's the first packet:
  if(this.state == 'idle'){
    this.state = 'receive data...';
    this.buffer = Buffer.alloc(0);  // Reset buffer
  }

  // Save data in buffer:
  const totalLength = this.buffer.length + data.length;
  this.buffer = Buffer.concat([this.buffer,data], totalLength);

  // Wait for the complete message:
  // Will test buffer if no new data after <buffDelay> ms:
  if(this.timeout === undefined)
    this.timeout = setTimeout(() => this.testBuffer(), this.buffDelay);
  else{
    // if new data -> refresh Timeout:
    // timeout.refresh(); // does not work yet ??
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.testBuffer(), this.buffDelay);
  }
}

// Recognise answer from buffer:
testBuffer(){
  this.state = 'idle';

  let data = this.buffer + "";
  data = data.split("\r\n")
  console.log(data)

  let hasCommandAnswer = false;
  let answer = "no answer";

  for(let i=0; i<data.length; i++){
    let d = data[i];

    // Enter text for message:
    if(d.startsWith("> ") || d.startsWith("OK")){
      hasCommandAnswer = true;
      continue;
    }

    // New message notification
    if(d.startsWith("+CMTI")){
      // Get index from answer:
      let idx = parseInt(d.split(',')[1])
      this.emit("new message", idx)
      continue;
    }

    // Network notification:
    if(d.startsWith("+CREG") || d.startsWith("+CFUN")){
      // Get index from answer:
      let idx = parseInt(d.split(' ')[1]);
      continue;
    }

    // Message correctly send or added in memory:
    if(d.startsWith("+CMGS") || d.startsWith("+CMSS") || d.startsWith("+CMGW")){
      hasCommandAnswer = true;
      // Get index from answer:
      let idx = parseInt(d.split(':')[1])
      answer = idx;
      continue;
    }

    // Read message:
    if(d.startsWith("+CMGR")){
      hasCommandAnswer = true;

      // Separate data and remove "":
      d = d.replace(/"/g,'').split(',');

      //let idx = d[0].split(" ")[1]; // Only with CMGL
      let type = d[0];
      let from = d[1];        let to = d[2];
      let date = d[3] || '';  let time = d[4] || '';

      i++;
      let text = data[i];
      // if there is '\r\n' element in the text : get the complete message
      while(i+1 < data.length && data[i+1] != "OK"){
        i++;
        if(data[i]) text += "\n" + data[i];
      }

      let msg = { /*idx,*/ type, from, to, date, time, text }
      answer = msg;
    }

  }

  if(hasCommandAnswer && this.commandInProgress){
    // Get token from command:
    let token = this.commandsList[0].token

    // Delete command from list:
    this.commandsList.shift()
    this.commandInProgress = false;

    // Resolve command:
    this.emit(token, answer);

    // Launch next command:
    this.sendNextCommand()
  }

}


/**
*  API Commands:
*/

// Send message:
async sendMessage(msg){
  let to = msg.to;
  let text = msg.text;

  if(typeof to == 'object'){
    let idx = await this.addMessageInMem(text);
    for(let num of to){
      await this.sendMessageFromMem(idx, num);
    }
    return
  }

  // Send Command and wait for '> ':
  let command = 'AT+CMGS="' + to + '"';
  await this.executeCommand(command);

  // Send text:
  let answer = await this.executeCommand('_'+ text + ctrlZ);  // ('_' is use to not send '\r')
  return answer
}

// Send message from memory:
async sendMessageFromMem(idx, to){
  let command = 'AT+CMSS='+ idx + ',"' + to + '"';
  await this.executeCommand(command);
}

// Read message:
async readMessage(idx){
  let command = 'AT+CMGR=' + idx ;
  let answer = await this.executeCommand(command)
  return answer
}

// Add message in memory:
async addMessageInMem(text){
  // Send Command and wait for '> ':
  let to = "";
  let command = 'AT+CMGW="' + to + '"';
  await this.executeCommand(command);

  // Send text:
  let answer = await this.executeCommand('_'+ text + ctrlZ);  // ('_' is use to not send '\r')
  return answer
}

// Delete message in memory:
async deleteMessage(idx){
  let command = 'AT+CMGD=' + idx ;
  let answer = await this.executeCommand(command)
  return answer
}

}

module.exports = SMS_API
