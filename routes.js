// Routes des SMS
RT = require('./lib/Routes-consts.js'); // Constantes

exports.foo = {
	command: "foo",
	access: RT.ALL,
	response: RT.exec("foo")
}


exports.ping = {
	command: "ping",
	response: "Pong !"
}

exports.about = {
	command: "about",
	aliases: ["version", "galibot"],
	response: "Hey :)"
}


// Messages d'erreur
exports._unauthorized = "Commande non autorisée !";
exports._invalid = "Commande invalide !";