var map;
var latlng; // the center point if the map
var markers = {}; //list of markers on the map
var rad = 1.35; //radius of search
var pinMarker, pinInfo;
var latlng;
var source;

window.onload = init;
window.onhashchange = locationHashChanged;

function init() {
	
	locationHashChanged( false );

	if (window.EventSource){
		/*source = new EventSource('/stream');
		source.onmessage = function(e) {
			// XSS in chat is fun
			entry = JSON.parse(e.data);
		
			if (!entry.type){
				document.getElementById('notification').style.display = 'block';

				var link = $('<a href="#?id='+entry.id+'" onclick="popup(this)">New publication!</a>');
				
				var desc = $('<span style="margin-left: 10px;">'+decodeURIComponent(entry.text)+'...'+'</span>');

				$('#out').prepend(desc).prepend(link).prepend($('<span>[notification (glassfish)]: </span>'));
			}
		};*/
	}
	
	//maps

	markerList = {};

	map = new google.maps.Map(document.getElementById("map_canvas"), {
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		zoom: 5
	});
	
	latlng = new google.maps.LatLng('43.616548616564', '7.0685118565707');
	map.setCenter(latlng);

	pinMarker = new google.maps.Marker({
		map : map,
		draggable: true,
		icon: '/static/pin.png'
	});

	pinMarker.setPosition(new google.maps.LatLng(latlng.lat()-6, latlng.lng()-14));

	pinInfo = new google.maps.InfoWindow({
		content : "<p>Move me and leave a <b>message</b>!</p> " +
		"<p><label class='checkbox inline' style='padding-top: 1px;'><input type='checkbox' id='home_'>home</label>"+
		"<label class='checkbox inline' style='padding-top: 1px;'><input type='checkbox' id='work'>work</label></p>"+
		"<p><textarea id='content'></textarea></p>"+
		"<a onclick='addPOI();' class='btn btn-small btn-primary btn-block'>Save</a>" 
	});
	pinInfo.open(map, pinMarker);
	google.maps.event.addListener(pinMarker, 'click', function(event) {
		pinInfo.open(map, pinMarker);
	});
	/*google.maps.event.addListener(pinMarker, 'dragend', function(event) {
		console.log('marker ' + event.latLng.lat() + ' ' + event.latLng.lng());
	});*/

	google.maps.event.addListener(map, 'drag', updateRectangle);

	google.maps.event.addListener(map, 'dragend', function() {
		
		updateRectangle();
		if ($('#within').attr('checked')){
			getPOIs();
		}
		
	});

	rectangle = new google.maps.Rectangle();
	var rectOptions = {
		strokeColor : "#FF0000",
		strokeOpacity : 0.8,
		strokeWeight : 2,
		fillOpacity : 0,
		map : map
	};
	
	rectangle.setOptions(rectOptions);
	
	//initial req
	updateRectangle();
	getPOIs();
	
	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(displayPosition, displayError, {enableHighAccuracy : true, timeout: 5000, maximumAge: 0});
	}

}

function popup(el){
	if (location.hash === el.href.substr(el.href.indexOf('#'))){ //trigger hashchange manually
		locationHashChanged();
	}
}

function updateRectangle(){
	var center = map.getCenter();
	var c = Math.cos(center.lat()* Math.PI / 180);
	rectangle.setBounds(new google.maps.LatLngBounds(
			new google.maps.LatLng(center.lat()-c*rad, center.lng()-rad),
			new google.maps.LatLng(center.lat()+c*rad, center.lng()+rad)));
}


function getPOIs(){
	
	clearOverlays();
	var q='?', types = [];

	if (!$('#within').attr('checked')){
		rectangle.setVisible(false);
		q += 'earth=';
	}else{
		rectangle.setVisible(true);
		q += 'n='+rectangle.getBounds().getNorthEast().lat()
			+'&e='+rectangle.getBounds().getNorthEast().lng()
			+'&s='+rectangle.getBounds().getSouthWest().lat()
			+'&w='+rectangle.getBounds().getSouthWest().lng();
	}
	
	if ($('#home2').attr('checked'))
		types.push("home");
	if ($('#work2').attr('checked'))
		types.push("work");

	q += '&tags='+JSON.stringify(types);

	$.getJSON('/search' + q, function(res){
		//console.log(res);
		for (var i=0; i<res.length; i++){
			var item = res[i];
			if (!$('#within').attr('checked') || rectangle.getBounds().contains(new google.maps.LatLng(item.lat, item.lng)))
				addMarker(item);
		}
	});


}


function addPOI(){

	var types = [];
	
	if ($('#home_').attr('checked'))
		types.push("home");
	if ($('#work').attr('checked'))
		types.push("work");


	$.post('/add',
		{
			text: encodeURIComponent($('#content').val()),
			lat: pinMarker.getPosition().lat(),
			lng: pinMarker.getPosition().lng(),
			time: parseInt(new Date().getTime()/1000),
			tags: JSON.stringify(types)
		}, function(res){
			//console.log(res);
			//if success add marker
			getPOIs();
		}
	);


}

function delPOI(id){

	if (confirm('Are you sure?')){
		$.getJSON('/delete?id='+id,
			function(res){
				//console.log(res);
				getPOIs();
		});
	}
}


function addMarker(item){
	
	var p = new google.maps.LatLng(item.lat, item.lng)
	map.setCenter(p);
	//check if  markers contains this id
	if (item.id in markers){
		markers[item.id].setMap(map);
		return;
	}
	
	var marker = new google.maps.Marker({
		map : map,
		position: p
	});
	if (item.tags.indexOf("home")>=0){
		if (item.tags.indexOf("work")>=0)
			marker.setIcon('/static/homework.png');
		else
			marker.setIcon('/static/home.png');
	} else if (item.tags.indexOf("work")>=0)
		marker.setIcon('/static/work.png');
	
	marker.infowindow = new google.maps.InfoWindow({
		content: (item.author ? "<p><b>"+item.author+"</b></p>" : "") +
				"<p>" + decodeURIComponent(item.text||"vide...")+"</p>"+
				"<p><a href='#' onclick='delPOI(\""+item.id+"\");'>delete</a></p>"
	});
	//infowindow.open(map, marker);
	google.maps.event.addListener(marker, 'click', function(event) {
		if (location.hash === '#id='+item.id){
			locationHashChanged(); //manual trigger
		} else {
			location.hash = '#id='+item.id;
		}
	});
	
	markers[item.id] = marker;
}

function setAllMap(map) {
	for (var i in markers) {
		markers[i].setMap(map);
	}
}
// Removes the overlays from the map, but keeps them in the array.
function clearOverlays() {
	setAllMap(null);
}
// Shows any overlays currently in the array.
function showOverlays() {
	setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteOverlays() {
	clearOverlays();
	markers = {};
}

function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


function refresh(){
	google.maps.event.trigger(map, 'resize');
	map.setCenter(latlng);
}

function selectRange(el){
	rad = parseFloat($(el).val()*180/(Math.PI*6371));
	$('#radius_value').html(el.value);
	google.maps.event.trigger(map, 'dragend');
}


function displayPosition(position) {
	latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.setCenter(latlng);
	pinMarker.setPosition(latlng);
	if (position.coords.accuracy) {
		console.log("acc: " + position.coords.accuracy);
	}
}
function displayError(error) {
	var errors = {
		1 : 'Denied permission',
		2 : 'Position not available',
		3 : 'Expired request'
	};
	console.log("geolocation error: " + errors[error.code]);
}


function locationHashChanged( evt ) {

	if (location.hash.length < 1) {
		location.hash = '#home';
		return;
	}
	if (location.hash == '#') {
		history.go(-1);
		return;
	}

	var page = location.hash.substr(1), pages =  $('.page');

	//map hash point id, if any
	if(evt !== false){
		console.log("ef");
		var parts = page.split('=');
		if (parts.length>1){
			var marker = markers[parts[1]];
			marker.infowindow.open(map, marker);
		}
	}
	

	//page switch
	for (var i=0; i<pages.length; i++){
		if (page === pages[i].id){
			//if page exists
			$('.current').removeClass('current').addClass('hidden');
			$('#'+page).removeClass('hidden').addClass('current');
			return;
		}
	}

	//for the map
	//if (map)
	//	google.maps.event.trigger(map, 'dragend');//resize
}
