const createSession = require('./auth');

const parseCookies = (req, res, next) => {
	var cookies = {};
	console.log('REq ', req);
	if (req.headers.cookie) {
		var newCookies = req.headers.cookie.split("; ");
		for (var i = 0; i < newCookies.length; i++) {
			var splitCookie = newCookies[i].split('=');
			console.log('cookie value ', splitCookie[1])
			cookies[splitCookie[0]] = splitCookie[1];
		}
	}
	req.cookies = cookies;
	console.log('RQ ' + req.cookies)
	console.log('RS ' + res.cookies)

	next();
};

module.exports = parseCookies;
