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

var SMS = require('./lib/SMS.js');
SMS.init(Config.SMS_pin);
Debug.success("'*SMS' loaded.");

var Middleware = require('./lib/Middleware.js');
Middleware.init();
Debug.success("'*Middleware' loaded.");

var Routes = require('./lib/Routes.js');
Routes.init();
Debug.success("'*Routes' loaded.");

// Traitement d'un message
function execute(from, time, message) {
	let res = Routes.exec(from, time, message);
	if(res != undefined)
		SMS.sendMessageTo(res, from);
}

APP_readyTime = Date.now(); // Enregistrement de l'heure
Debug.success("GaliBot successfully loaded.");
console.log('------------------------------------------------------');


execute("+33604199481", Date.now(), "foo");

DB.close();

