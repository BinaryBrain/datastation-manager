const config = require('config');
let restler = require('restler');
let removeDiacritics = require('diacritics').remove;

let credentials = config.get('credentials');
let urls = config.get('urls');
let jsonfile = config.get('json');

// Create the array of ideas based on the json file passed as parameters
let ideas = [];

console.log("Test reading a json file and creating array");
console.log("using json file", jsonfile);

let fs = require('fs');
let obj = JSON.parse(fs.readFileSync('data/'+jsonfile, 'utf8'));

// readjson file and convery to array
for (let i = 0; i < obj.length; i++) {
    ideas[i] = { id: i, desc: obj[i].content, title: obj[i].title, date: new Date(obj[i].date) }
}

function login() {
    restler.get(urls.login_form)
    .on("complete", function(result, response) {
        let cookies = response.headers['set-cookie'].join('; ')

        // RegEx mode: slower
        //let found = result.match(/\$\.cookie\('resource_id', '(.+)',/i);
        //console.log(found[1])

        let searchString = "$.cookie('resource_id";
        let index = result.indexOf(searchString);
        let secondIndex = result.indexOf(searchString, index + 1);
        let substring = result.slice(secondIndex, secondIndex + 50);
        let resource_id = substring.match(/\$\.cookie\('resource_id', '(.+)',/i)[1];
        console.log(resource_id);

        restler.post(urls.login, {
            multipart: true,
            headers: {
                'Cookie': cookies
            },
            data: {
                "p1": credentials.email,
                "p2": credentials.password,
                "remember_me": "on",
                "continue": "1",
                "go_url": ""
            }
        }).on("complete", function(result, response) {
            sendData(ideas, cookies + '; resource_id=' + resource_id, 0);
        });
    });
}

function sendData(ideas, cookies, i) {
	console.log("Sending idea #" + i);
	restler.post(urls.add_idea, {
		headers: {
			'Cookie': cookies
		},
		data: {
			"challenge_id": config.get('challenge_id'),
			"visibility": "visible",
			"name": "#" + ideas[i].id + " - " + ideas[i].title,
			"description": ideas[i].desc + "\n\n" + "Ajouté le " + ideas[i].date.getDate() + "." + ideas[i].date.getMonth() + "." + ideas[i].date.getFullYear() + " à " + ideas[i].date.getHours() + "h" + ideas[i].date.getMinutes()
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
