// Autorisations
exports.ALL = "all";
exports.ADMIN = "admin";
exports.NONE = "none";

// Paramètres de sous-programmes
exports.USER = "user"; // Demande la récupération des infos utilisateur

// Redirection vers une autre route
exports.redirect = function(key, params = {}) {
	return {redirect: key, params: params};
}

// Redirection vers une autre route
exports.bypass = function(key) {
	return exports.redirect(key, {bypass: true});
}

// Execute un sous programme, avec les paramètres fournis
exports.exec = function(bin, params = []) {
	return {exec: bin, params: params};
}