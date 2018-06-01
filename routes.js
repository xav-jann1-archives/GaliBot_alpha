// Routes des SMS
RT = require('./lib/Routes-consts.js'); // Constantes

exports.ping = {
	command: "ping",

	access: RT.ALL,

	response: RT.bypass("foo")
}

exports.foo = {
	command:"foo",
	access: RT.NONE,
	response: "bar"
}


// Messages d'erreur
exports._unauthorized = "Commande non autorisée !";
exports._invalid = "Commande invalide !";