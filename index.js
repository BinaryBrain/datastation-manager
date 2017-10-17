const config = require('config');
let restler = require('restler');
let removeDiacritics = require('diacritics').remove;

let credentials = config.get('credentials');
let urls = config.get('urls');

let ideas = [
	{ id: 1, desc: "Obtenir une recette après l'expérience", cat: "Partage/Echange" },
]

function login() {
	restler.post(urls.login, {
		multipart: true,
		headers: {
			// 'Cookie': 'PHPSESSID=42c0c3a3q6m6hjtmfm0ahlr4s2; language_id=1; resource_id=295fdc5' // FIXME change PHPSESSID accordingly
		},
		data: {
			// "p1": credentials.email,
            // "p2": credentials.password,
			"p1": "sacha.bron@master.hes-so.ch",
            "p2": "prerasonhe",
            "remember_me": "on",
            "continue": "1",
            "go_url": ""
		}
	}).on("complete", function(result, response) {
        let cookies = response.headers['set-cookie'].join('; ')

        // RegEx mode: slower
        //let found = result.match(/\$\.cookie\('resource_id', '(.+)',/i);
        //console.log(found[1])

        let searchString = "$.cookie('resource_id";
        let index = result.indexOf(searchString);
        let secondIndex = result.indexOf(searchString, index + 1);
        let substring = result.slice(secondIndex, secondIndex + 50);
        let resource_id = substring.match(/\$\.cookie\('resource_id', '(.+)',/i)[1];
        console.log(resource_id)
        
        sendData(ideas, cookies + '; resource_id=' + resource_id, 0);
	});
}

function sendData(ideas, cookies, i) {
	console.log(i)
	console.log(cookies)
	restler.post(urls.add_idea, {
		multipart: true,
		headers: {
			'Cookie': cookies
		},
		data: {
			"challenge_id": "12",
			"visibility": "visible",
			"name": "#" + ideas[i].id + " - " + ideas[i].cat + " - " + ideas[i].desc,
			"description": ideas[i].desc
			// "name": "#" + ideas[i].id + " - " + removeDiacritics(ideas[i].cat) + " - " + removeDiacritics(ideas[i].desc),
			// "description": removeDiacritics(ideas[i].desc)
		}
	}).on("complete", function(data) {
		if (i < ideas.length - 1) {
			sendData(ideas, cookies, i+1);
		}
	}).on("error", function (stuff) {
        console.log("FAIL")
        console.log(stuff)
    });
}

login()
