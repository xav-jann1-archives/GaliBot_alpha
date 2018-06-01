var Debug = require('./Debug.js'); // LIB: Affichage console 
var exec = require('exec');
var GHD = require('github-download');
var mv = require('mv');

var githubRepo;
var error_flag = false;
var last_folder;
var currentFolder;

exports.init = function(githubRepo_local, currentFolder_local) {
	githubRepo = githubRepo_local;
	currentFolder = currentFolder_local;
}

exports.update = function() {
	Debug.important("Software update request ...");

	error_flag = false;
	last_folder = "./" + Date.now(); // Génération d'un nom de fichier unique

	// Récupération de la mise à jour sur GitHub
	GHD("https://github.com/" + githubRepo, last_folder)

	.on('error', function(err) {
		error_flag = true;
		Debug.error("Error while updating software !");
		Debug.error(err);
	})

	.on('end', function() {
		if(!error_flag)
			moveFolder(); // Déplacement des répertoires
	})
}

/*
 * Déplacement du répertoire téléchargé
 *  Déplacement ./ --> ./../<random>-bkp
 *  Déplacement ./<random> --> ./
 *  Déplacement ./../<random>-bkp --> ./bkp/<random>
*/
function moveFolder() {
	mv('./../' + currentFolder, './../' + last_folder + "-bkp", {mkdirp: true}, function(err) {
		if(err != undefined)
			return errorOnUpdate(); // Lors d'une erreur, affichage du message fatal

		mv(last_folder, './../' + currentFolder, {mkdirp: true}, function(err) {
			if(err != undefined)
				return errorOnUpdate();
			
			mv('./../' + last_folder + "-bkp", './../' + currentFolder + '/bkp/' + last_folder, {mkdirp: true}, function(err) {
				if(err != undefined)
					return errorOnUpdate();

				Debug.success("Software updated successfully ! Reboot...");
				Debug.warn("System reboot...");
				process.exit();
			});
		});
	});
}

// Mise à jour échouée
function errorOnUpdate() {
	Debug.error("****************************** FATAL ERROR ******************************");
	Debug.error("Software update failed ! Please fix and restore it manually, then upload update.");
}