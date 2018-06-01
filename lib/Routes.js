// Gestion des routes pour les SMS
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
		lut[routes[k].command] = k;
	}
}



// Execute une commande
exports.exec = function(command) {
	if(!(command in lut)) // Si la commande n'existe pas, on ne fait rien
		return exports.invalid();

	return execByKey(lut[command], {});
}



function execByKey(key, params) {
	if(!exist(key))
		return exports.invalid();

	let route = get(key); // Récupération de la route

	// Vérification de l'accès
	if("access" in route && !params.bypass) {
		if(route.access != RT.ALL)
			return exports.unauthorized();
	}

	let response = route.response;

	// On vérifie s'il n'y a pas de redirection
	if(response instanceof Object && "redirect" in response && exist(response.redirect))
		return execByKey(response.redirect, response.params);

	// Tout semble OK
	return response;
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