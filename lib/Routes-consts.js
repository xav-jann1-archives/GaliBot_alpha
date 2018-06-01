exports.ALL = "all";
exports.ADMIN = "admin";
exports.NONE = "none";

// Redirection vers une autre route
exports.redirect = function(key, params = {}) {
	return {redirect: key, params: params};
}

// Redirection vers une autre route
exports.bypass = function(key) {
	return exports.redirect(key, {bypass: true});
}