var APP_ID = "SKILL_ID";

var Alexa 		= require('alexa-sdk');
var citybikes 	= require('./citybikesAPI.js')
var _  			= require('lodash');

var bikesAPI 	= new citybikes();
var temp;

var promptLocation = function(el) {
	var msg = "I don't know your location. Do you have an address for me?";
	el.handler.state = '_RECEIVE';
	el.emit(":ask", msg, msg);
};

var handleError = function(el) {
	var msg = "I'm sorry, I didn't understand you. Please say again.";
	el.emit(":ask", msg, msg);
};

var promptHelp = function(el) {
	var msg = "Here are some examples you can say:";
	msg += "Set my location to number street city state zip.";
	msg += "Where is the next free bike.";
	msg += "Where is the next station";
	el.emit(":ask", msg, msg)
};

var handlers = {
	"AskNearestIntent": function() {
		var req = this.event.request;
		var slots = req.intent.slots;
		var el = this;
		var cLocation = el.attributes['location'];
		var nearestStation = 
		bikesAPI.alexaResultNearest(cLocation).then(function (res) {
			if(!el.attributes['location']) {
				promptLocation(el);
				return false;
			} else {
				bikesAPI.setLocation(cLocation);
				bikesAPI.alexaResultNearest(cLocation)
				.then(function (res) {
					if(res) {
						var r = res.response;
						var d = res.data;
						el.emit(":tell", r, d);
					}
				});
		}
		});
	},
	"SetLocationIntent": function() {
		var req = this.event.request;
		var slots = req.intent.slots;
		var el = this;
		if(slots.Address.value && slots.City.value 
			&& slots.State.value && slots.Zip.value) {
			var l = String(slots.Address.value);
			l += String(", ");
			l += String(slots.City.value);
			l += String(", ");
			l += String(slots.State.value);
			l += String(" ");
			l += String(slots.Zip.value);
			// l = l.replace(",", "");
			bikesAPI.fetchLocation(l)
			.then( function (res) {
				if(res) {
					var a = res.formatted_address;
					temp = a;
					var message = "Thank you, I got " + a + ", ";
					message += "is that correct?";
					el.handler.state = "_VERIFY";
					el.emit(":ask", message, message);
				}
			});
		}
		else {
			var m = "Sorry I didn't catch your ";
			m += "location. Please try saying: ";
			m += "Set my location to, followed by your ";
			m += "street, city, state and zip code. ";
			el.emit(":ask", m, m);
		}
	},
	"GetLocationIntent": function() {
		var el = this;
		var location = this.attributes['location'];
		if(location) {
			var res = "Your address is currently set ";
			res += "to " + location;
			var t = "Your current location";
			el.emit(":tell", res, t, res);
		} else {
			promptLocation(el);
		}
	},
	"AMAZON.HelpIntent": function() {
		var el = this;
		promptHelp(el);
	},
	"AMAZON.CancelIntent": function() {
		var el = this;
		el.emit(":tell", "", "");
	},
	"AMAZON.StopIntent": function() {
		var el = this;
		el.emit(":tell", "", "");
	},
	"Unhandled": function() {
		var msg = "Sorry, I didn't get that. Please try again";
		this.handler.state = "_RECEIVE";
		this.emit(":ask", msg, msg);
	}

};

var receiveModeHandlers =Alexa.CreateStateHandler("_RECEIVE", {
	"ReceiveLocationIntent": function() {
		var el = this;
		var req = this.event.request;
		var slots = req.intent.slots;
		if(slots.Address.value && slots.City.value 
			&& slots.State.value && slots.Zip.value) {
			var val = slots.Address.value;
			val += ", ";
			val += slots.City.value;
			val += ", ";
			val += slots.State.value;
			val += " ";
			val += slots.Zip.value;
			console.log("receive:",val);
			bikesAPI.fetchLocation(val)
			.then(function (res) {
				if(res) {
					var a = res.formatted_address;
					temp = a;
					var msg = "Thank you, I got " + a + ", ";
					msg += "is that correct?";
					el.handler.state = "_VERIFY";
					el.emit(":ask", msg, msg);
				}
			});
		}
	},
	"Unhandled": function() {
		var msg = "Sorry, I didn't get that. Please try again ";
		msg += "saying only your postal address, city, state and zip";
		this.handler.state = "_RECEIVE";
		this.emit(":ask", msg, msg);
	}
});

var verifyModeHandlers = Alexa.CreateStateHandler("_VERIFY", {
	"VerifyLocationIntent": function() {
		var req = this.event.request;
		var slots = req.intent.slots;
		var el = this;
		if(slots.VerifyResponse.value) {
		var response = slots.VerifyResponse.value;
			if(response == 'Yes' || response == 'yes') {
				var message = "Great! Thank you, location ";
				message += "has been saved.";
				el.attributes['location'] = temp;
				bikesAPI.setLocation(temp);
				this.emit(":tell", message, message);
			} 
			else if(response == 'No' || response == 'no') {
				var message = "Sorry about that, ";
				message += "please try saying your address ";
				message += "again.";
				this.handler.state = "_RECEIVE";
				this.emit(":ask", message, message);
			} else {
				this.emit("Unhandled");
			}
		} else {
			this.emit("Unhandled");
		}
	},
	"Unhandled": function() {
		var message = "Sorry, I didn't get that. ";
		message += "Please try again.";
		this.emit(":ask", message, message);
	}
});

exports.handler = function(event, context, callback) {
	var alexa = Alexa.handler(event, context);
	var id = "SKILL_ID";
	alexa.appId = id;
	alexa.dynamoDBTableName = "alexaStorage";
	alexa.registerHandlers(handlers, receiveModeHandlers, verifyModeHandlers);
	alexa.execute();
};