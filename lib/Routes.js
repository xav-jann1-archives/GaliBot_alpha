// Gestion des routes pour les SMS
var Debug = require('./Debug.js'); // LIB: Affichage console 
var RT, routes, keys, lut;

exports.init = function() {
	RT = require('./Routes-consts.js'); // Constantes
	routes = require('../routes.js'); // Chargement onfiguration
	keys = Object.keys(require('../routes.js'));

	// Chargement de la lookup-table
	//  lut[ command ] = key
	lut = {};
	for(let i = 0; i < keys.length; i++) {
		let k = keys[i];
		if(routes[k] instanceof Object) {
			lut[routes[k].command] = k;

			// Ajout des alias
			if("aliases" in routes[k]) {
				for(let i in routes[k].aliases) {
					lut[ routes[k].aliases[i] ] = k;
				}
			}
		}
	}
}



// Execute une commande
exports.exec = function(from, time, command) {
	if(!(command in lut)) // Si la commande n'existe pas, on ne fait rien
		return exports.invalid();

	return execByKey(from, time, lut[command], {});
}



function execByKey(from, time, key, params) {
	if(!exist(key))
		return exports.invalid();

	let route = get(key); // Récupération de la route

	// Vérification de l'accès
	if("access" in route && !params.bypass) {
		if(route.access == RT.NONE)
			return exports.unauthorized();
	}

	let response = route.response;

	// On vérifie s'il ne s'agit pas d'une action ...
	if(response instanceof Object) {
		// Redirection
		if("redirect" in response && exist(response.redirect))
			return execByKey(from, time, response.redirect, response.params);

		// Execution de programme
		if("exec" in response && exist(response.exec))
			return execBin(from, time, response.exec, response.params);
	}

	// Tout semble OK
	return response;
}

// Execution d'un sous-programme
function execBin(from, time, binName, needed_params) {
	// Vérification de l'existance du programme
	let bin;
	try {
		bin = require('../bin/' + binName + '.js');
	} catch(err) { // Si on ne le trouve pas, dommage
		Debug.error("Binary '" + binName + "' not found !");
		return exports.invalid();
	}
	
	// Résolution des paramètres
	resolved_params = {
		time: time,
		from: from
	}

	if(needed_params.includes(RT.USER))
		resolved_params.user = {lastname: "AVINAIN", firstname: "Pierre"};
	
	try {
		return bin.exec(resolved_params);
	} catch(err) { // Si la structure ne correspond pas...
		Debug.error("Invalid structure for binary '" + binName + "' !");
		Debug.error(err);
		return exports.invalid();
	}
}


// Renvoie un message de permission invalide
exports.unauthorized = function() {
	if(exist("_unauthorized"))
		return get("_unauthorized");

	return "Unauthorized command."; // Message par défaut
}

// Renvoie un message de commande invalide
exports.invalid = function() {
	if(exist("_invalid"))
		return get("_invalid");

	return "Invalid command."; // Message par défaut
}



function get(key) {
	return routes[key];
}

function exist(key) {
	return (key in routes);
}