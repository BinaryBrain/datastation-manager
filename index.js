const config = require('config');
let restler = require('restler');
let removeDiacritics = require('diacritics').remove;

let credentials = config.get('credentials');
let urls = config.get('urls');
let jsonfile = config.get('json');



// Create the array of ideas based on the json file passed as parameters

//let ideas = [
//	{ id: 1, desc: "Test idea from Node", cat: "Partage/Echange" },
//]

var ideas = [];

console.log("Test reading a json file and creating array");
console.log("using json file"+jsonfile);

//process.exit()

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('data/'+jsonfile, 'utf8'));

// readjson file and convery to array
for (var i=0; i<obj.length; i++){
    ideas[i] = { id: i, desc: obj[i].content, title: obj[i].title }
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
			//"name": "#" + ideas[i].id + " - " + ideas[i].title + " - " + ideas[i].desc,
			"name": "#" + ideas[i].id + " - " + ideas[i].title,
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
