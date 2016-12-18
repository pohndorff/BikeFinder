var $q = require('q');
var moment = require('moment');
var _ = require('lodash');
var request = require('request');


var key = "GOOGLE_MAPS_KEY"; //fill this with your google API key

var mapsClient = require('@google/maps').createClient({
	Promise: $q.Promise,
	key: key
});

var citybikesUrl = "https://api.citybik.es/v2/networks"
var searchfield = "?fields=stations";



var citybikesAPI = function() {
	var args = arguments;
	var loc = (args[0] ? args[0]: []);
	var city = "";
	var address = "";
	return {
		searchStations: function(term) {
			var d = $q.defer();
			var el = this;

			var nextStation = [];
			var network = "/bay-area-bike-share";
			var networkURL = citybikesUrl + network + searchfield;

			request(networkURL, (err, response, body) => {
				if(!err && response.statusCode === 200) {
					var stations = JSON.parse(body).network.stations;
					stations = _.filter(stations, function(station) {
						return station.free_bikes > 0;
					});
					_.forEach(stations, function(station) {
						var add = {
							distance: el.calcDistance(stations)
						};
						_.assign(stations, add);
					});
					nextStation = _.sortBy(stations, function(station) {
						return station.distance;
					});
					var closestStation = _.head(nextStation);
					var s = {};
					s.address = closestStation.extra.address;
					s.distance = el.calcDistance(closestStation);
					s.free_bikes = closestStation.free_bikes;
					d.resolve(s);
				} else {
					d.resolve(false);
				}
			});
			console.log(nextStation.distance);
			return d.promise;
		},
		setLocation: function(query) {
			var d = $q.defer();
			mapsClient.geocode({
				address: query
			},
			function(err, response) {
				if(!err) {
					var res = response.json;
					var data = res.results[0];
					address = data.formatted_address;
					var geo = data.geometry;
					var location = geo.location;
					var t = [];
					t.push(location.lat);
					t.push(location.lng);
					loc = t;
					d.resolve(t);
				}
			});
			return d.promise;
		},
		fetchLocation: function(query) {
	      var d = $q.defer();
	      mapsClient.geocode({
	        address: query
	      }, function(err, response) {
	        if(!err) {
				var res = response.json;
				var data = res.results[0];
				var addr = data.formatted_address;
				var a = addr.replace(", USA", "");
				data.formatted_address = a;
				d.resolve(data);
	        }
	      });
	      return d.promise;
	    },
		calcDistance: function(station) {
			var lat = station.latitude;
			var lng = station.longitude;
			var radLat1 = Math.PI * loc[0]/180;
			var radLat2 = Math.PI * lat/180;
			var radLon1 = Math.PI * loc[1]/180;
			var radLon2 = Math.PI * lng/180;
			var theta = loc[1]-lng;
			var radTheta = Math.PI * theta/180;
			var dist = Math.sin(radLat1) * Math.sin(radLat2)
				+ Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
			dist = Math.acos(dist) * 180/Math.PI * 60 * 1.1516;
			dist = dist * 0.8684 * 100; // using miles
			return Math.floor(dist)/100;
		},
		alexaResultNearest: function(query) {
			var d = $q.defer();
			console.log("AlexaAskNearest (query)", query);
			var el = this;
			var text = "";
			text = "There are {{number}} bikes in about {{miles}} miles away at ";
			el.searchStations(query).then(function (res) {
				if(!res)
					return false;
				var station = res;
				if(station.free_bikes < 2) {
					text = "There is {{number}} bike in about {{miles}} miles away at ";
				}
				var distance = el.calcDistance(station);
				var addr = station.address;
				console.log(distance);
				// var dist = station.distance
				var r = text;
				r = r.replace('{{number}}', station.free_bikes);
				r = r.replace('{{miles}}', station.distance);
				r += addr;
				var t = {};
				t.response = r;
				t.data = res;
				d.resolve(t);

			});
			return d.promise;
		}
	};
};

module.exports = citybikesAPI;