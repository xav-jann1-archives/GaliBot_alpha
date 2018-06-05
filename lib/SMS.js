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
  this.buffDelay = 20;           // Max delay between 2 buffers before the all buffer is computed

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
    resolve("init done")
  })
}

connectSerial(port,params){
  return new SerialPort(port, params, function(error){
    if(error){
      return console.log("Error: ", error.message);
    }
    console.log("serial ok")
  });
}

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
  // Reset buffer if it's the fisrt packet:
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


testBuffer(){
  this.state = 'idle';

  let answer = this.buffer + "";
  if(this.commandInProgress){
    // Get token from command:
    let token = this.commandsList[0].token
    // Delete command from list:
    this.commandsList.shift()
    this.commandInProgress = false;
    this.emit(token, token + answer);
    // Can
    this.sendNextCommand()
  }

}

async sendMessage(msg){
  let to = msg.to;
  let text = msg.text;

  // Send Command and wait for '> ':
  let command = 'AT+CMGS="' + to + '"';
  await this.executeCommand(command);

  // Send text:
  let answer = await this.executeCommand('_'+ text + ctrlZ);  // ('_' is use to not send '\r')

  return "final: "+ answer
}

async sendMessageFromMem(idx, to){
  let command = 'AT+CMSS='+ idx + ',"' + to + '"';
  await this.executeCommand(command);
}

async readMessage(idx){
  let command = 'AT+CMGR=' + idx ;
  let answer = await this.executeCommand(command)
  return "final: " + answer
}

// TODO: get idx from answer
async addMessageInMem(text){
  // Send Command and wait for '> ':
  let to = "";
  let command = 'AT+CMGW="' + to + '"';
  await this.executeCommand(command);

  // Send text:
  let answer = await this.executeCommand('_'+ text + ctrlZ);  // ('_' is use to not send '\r')

  //return idx;
}

}

module.exports = SMS_API
