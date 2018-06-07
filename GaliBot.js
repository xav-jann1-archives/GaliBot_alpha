/* 
 * PARAMETRES GENERAUX
 */
var APP_version = "0.1.0";  // Version de l'application
var APP_startingTime = Date.now();     // Timestamp de démarrage de l'application
var APP_readyTime = null;     // Timestamp de l'application prête à décoder les positions entrantes
var APP_currentFolder = __dirname.split("/").pop(); // Nom du répertoire courant


/* 
 * CHARGEMENT DES LIBRAIRIES
 */
var Config = require('./config.js'); // Chargement de la configuration
var Debug = require('./lib/Debug.js'); // LIB: Affichage console 

Debug.init(APP_version);
Debug.info("Starting application...");
Debug.info("Loading modules...");

var mv = require('mv');
Debug.success("'mv' loaded.");

var exec = require('exec');
Debug.success("'exec' loaded.");

var GHD = require('github-download');
Debug.success("'github-download' loaded.");

var NoSQL = require('nosql');
Debug.success("'nosql' loaded.");

var AutoUpdate = require('./lib/AutoUpdate.js');
AutoUpdate.init(Config.APP_githubRepo, APP_currentFolder);
Debug.success("'*AutoUpdate' loaded.");

var DB = require('./lib/DB.js');
DB.init(Config.DB_hostname, Config.DB_username, Config.DB_password, Config.DB_database);
Debug.success("'*DB' loaded.");

const SMS_api = require('../lib/SMS.js');
let SMS = new SMS_api({
  port: '/dev/serial0',
  baudRate: 19200,
  pin: '1234'
})
SMS.init().catch(error => {
  console.log(error);
})
Debug.success("'*SMS' loaded.");

var Middleware = require('./lib/Middleware.js');
Middleware.init();
Debug.success("'*Middleware' loaded.");

var Routes = require('./lib/Routes.js');
Routes.init();
Debug.success("'*Routes' loaded.");

SMS.on('new message', (idx)=>{
	setTimeout(() => SMS.readMessage(idx).then(msg => {
		let res = Routes.exec(msg.from, Date.now(), msg.text);
		if(res != undefined)
			SMS.sendMessage({to: msg.from, text: res});
	}), 1000);
})

APP_readyTime = Date.now(); // Enregistrement de l'heure
Debug.success("GaliBot successfully loaded.");
console.log('------------------------------------------------------');

//DB.close();

