/*
 * === AIRNODE F.F.A - Gestion de championnats A.N.R. ===
 * | Gestionnaire des sorties console
 * | (c) 2018 - Pierre AVINAIN
 * ======================================================
 */

/*
 * Calcul du préfixe des lignes de log
 * Format : [DD/MM/YYYY @ HH:MM:SS]
 */
function prefix() {
	let currentdate = new Date();

	// Jour
	let dd = currentdate.getDate();
	if(dd < 10)
		dd = "0" + dd;

	// Mois
	let mm = currentdate.getMonth() + 1;
	if(mm < 10)
		mm = "0" + mm;

	return "[" + dd + "/"+ mm + "/" + currentdate.getFullYear() + " @ " 
           + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + "]";
}



/*
 * Génération du message d'initialisation de l'application
 */
exports.init = function(APP_version) {
	console.log("   _____         _  _  ____          _   ");
	console.log("  / ____|       | |(_)|  _ \\        | |  ");
	console.log(" | |  __   __ _ | | _ | |_) |  ___  | |_ ");
	console.log(" | | |_ | / _` || || ||  _ <  / _ \\ | __|");
	console.log(" | |__| || (_| || || || |_) || (_) || |_ ");
	console.log("  \\_____| \\__,_||_||_||____/  \\___/  \\__|");
	console.log("                                           ");
	console.log("------ GaliBot, version " + APP_version + " ------");
}

/*
 * Affichage des lignes de log par type d'importance
 */
exports.info = function(text) {
	console.log(prefix() + '[INFO] ' + text); 
}

exports.important = function(text) {
	console.log(prefix() + '\x1b[36m[IMPORTANT] ' + text + '\x1b[0m'); 
}

exports.warn = function(text) {
	console.log(prefix() + '\x1b[33m[WARN] ' + text + '\x1b[0m'); 
}

exports.error = function(text) {
	console.log(prefix() + '\x1b[31m[ERROR] ' + text + '\x1b[0m'); 
}

exports.success = function(text) {
	console.log(prefix() + '\x1b[32m[SUCCESS] ' + text + '\x1b[0m'); 
}
