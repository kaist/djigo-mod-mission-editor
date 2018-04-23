sql = window.SQL;
var worker = new Worker("js/worker.sql.js");
worker.onerror = error;

var fname="";

function error(e) {
  console.log(e);
}


  var map = L.map('map');
  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 18,
    zoomControl: false,
    accessToken: 'pk.eyJ1IjoiemFsb21za2lqIiwiYSI6ImNqZmh6ajl0aTA0eWwycW84dnMxanhyYjYifQ.FVHmA_arLV_1i6D5LCHT2Q'
}).addTo(map);



L.gridLayer.googleMutant({
    type: 'hybrid' // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
}).addTo(map);


  map.setView([0, 0], 1);

var zoomControl = L.control.zoom({
                    position: 'bottomleft'
                });
                map.addControl(zoomControl);

  var markers=[];
  var settings=[];
  var output={};
  var total_distance=0;
  var polyline = L.polyline([], {color: 'red'}).addTo(map);



  map.on('click', function(e){
    var marker = new L.marker(e.latlng,{draggable:true});
    
    marker.addTo(map);
    marker.on('drag',function(e){
  var coords=[];
  markers.forEach(function(item, i, arr) {
          coords.push([item.getLatLng().lat,item.getLatLng().lng]);
          });
  polyline.setLatLngs(coords);
  update_distance();

    });
    markers.push(marker);
    settings.push([50,0,0]);
    var pop=marker.bindPopup('<a   class="" href="#" onclick="return edit_marker('+markers.length+')"><i style="color:green;" class="material-icons">edit</i></a> <a   href="#" onclick="return remove_marker('+markers.length+')"><i style="color:red;" class="material-icons">delete</i></a>').openPopup();
    var coords=[];
    markers.forEach(function(item, i, arr) {
          coords.push([item.getLatLng().lat,item.getLatLng().lng]);
          });
    polyline.setLatLngs(coords);
    update_distance();
});




function upl_helper(){
  output={};
  var a=[];
  markers.forEach(function(item, i, arr) {
          var t={};
          var c=parseInt(settings[i][1]);
          if (c>180){
            c=(180-(c-180))*-1
          }
          t.craftYaw=c;
          t.gimbalPitch=parseInt(settings[i][2]);
          t.gimbalYaw=0;
          t.height=parseInt(settings[i][0]);
          t.lat=item.getLatLng().lat;
          t.lng=item.getLatLng().lng;

          a.push(t);
          });
  output.points=a;


  $('#finput').click();
}






function save_all(){
  $('#loadingdiv').hide();
  $('#opendiv').show();
  $('#donediv').hide();
  $('#save_modal').modal('open');
}

function updateSlider(val){
  $('.plane_img').css('transform','rotate('+val+'deg)')
};

function cancel_edit(){
  $('#modal1').modal('close');
  $('#plane_div').hide();
}
function save_edit(n){
  settings[n]=[$('#fly_height').val(),$('#fly_yaw').val(),$('#fly_pitch').val()]
  $('#modal1').modal('close');
  $('#plane_div').hide(); 
}

function edit_marker(n){
  map.panTo(markers[n-1].getLatLng());
  $('#modal1').modal('open');

  $('#fly_height').val(settings[n-1][0]);
  $('#fly_pitch').val(settings[n-1][2]);  
  $('#fly_yaw').val(settings[n-1][1]);  
  $('#save_but').attr('onclick', 'save_edit('+(n-1)+')');

  $('.plane_img').css('transform','rotate('+settings[n-1][1]+'deg)')
  $('#plane_div').show();
}

function clear_all(){


  
  markers.forEach(function(item, i, arr) {
          map.removeLayer(item);
          });

  markers=[];
  settings=[];
  var coords=[];
  polyline.setLatLngs(coords);
  update_distance();
}

function remove_marker(n){
  map.removeLayer(markers[n-1]);
  delete markers[n-1];
  delete settings[n-1];
  var coords=[];
  markers.forEach(function(item, i, arr) {
          coords.push([item.getLatLng().lat,item.getLatLng().lng]);
          });
  polyline.setLatLngs(coords);
  update_distance();
  return false;


}

function zfill(number, size) {
    number = number.toString();
    while (number.length < size) number = "0" + number;
    return number;
  }

function update_distance(){

  var d=0;
  var coords=[];
  var all=0;
  markers.forEach(function(item, i, arr) {
          coords.push([item.getLatLng().lat,item.getLatLng().lng]);
          all+=1;
          });
  
  for (var i = 0; i < coords.length-1; i++) {
    d+=latlng2distance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
   
}


  if (parseInt(d)==0){
      $('#sbut1').addClass('disabled');
    }
    else{
      $('#sbut1').removeClass('disabled');
    }


$('#points_span').html(parseInt(all));
$('#m_span').html(parseInt(d));
var t=parseInt(d/$('#speed').val());
$('#time_span').html(zfill(Math.floor(t/60),2)+':'+zfill(t%60,2) );
total_distance=d;
  //console.log(d);
  //console.log(d/10);



  
}

function latlng2distance(lat1, long1, lat2, long2) {
    //радиус Земли
    var R = 6372795;
    //перевод коордитат в радианы
    lat1 *= Math.PI / 180;
    lat2 *= Math.PI / 180;
    long1 *= Math.PI / 180;
    long2 *= Math.PI / 180;
    //вычисление косинусов и синусов широт и разницы долгот
    var cl1 = Math.cos(lat1);
    var cl2 = Math.cos(lat2);
    var sl1 = Math.sin(lat1);
    var sl2 = Math.sin(lat2);
    var delta = long2 - long1;
    var cdelta = Math.cos(delta);
    var sdelta = Math.sin(delta);
    //вычисления длины большого круга
    var y = Math.sqrt(Math.pow(cl2 * sdelta, 2) + Math.pow(cl1 * sl2 - sl1 * cl2 * cdelta, 2));
    var x = sl1 * sl2 + cl1 * cl2 * cdelta;
    var ad = Math.atan2(y, x);
    var dist = ad * R; //расстояние между двумя координатами в метрах

    return dist
}


function savedb () {
  worker.onmessage = function(event) {
    var arraybuff = event.data.buffer;
    var blob = new Blob([arraybuff]);
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    console.log(fname.split('/'));
    a.download = fname.split('\\').pop();
    a.onclick = function() {
      setTimeout(function() {
        window.URL.revokeObjectURL(a.href);
      }, 1500);
    };
    a.click();
      $('#loadingdiv').hide();
      $('#opendiv').hide();
      $('#donediv').show();
  };
  worker.postMessage({action:'export'});
}

function init(){
  $('.tabs').tabs();
  if (!(localStorage.getItem('dnt')==1)){
  $('#about_modal').modal('open');};


  $('#dnt').change(function() {
        if(this.checked) {
           localStorage.setItem('dnt',1);
        }
        else{
          localStorage.setItem('dnt',0);
        }
       
    });




}


  $(document).ready(function(){
    M.AutoInit();
    init();


  navigator.geolocation.getCurrentPosition(function(position) {
    map.setView([position.coords.latitude, position.coords.longitude], 8);
});


   document.getElementById('finput').onchange = function() {
          $('#loadingdiv').show();
           $('#opendiv').hide();
          var file_data = $("#finput").prop("files")[0];   
          fname=$('#finput').val();



  var r = new FileReader();
  r.onload = function() {
  
  worker.onmessage = function () {
    worker.onmessage = function () {
      worker.onmessage = function(event) {
      var results = event.data.results;
      savedb();   }
    worker.postMessage({action:'exec', sql:"insert into dji_pilot_dji_groundstation_controller_DataMgr_DJIWPCollectionItem (distance,pointsJsonStr,location,autoAddFlag,createdDate) values ("+total_distance+",'"+JSON.stringify(output)+"','',1,"+Date.now()+");"});
};
  
 worker.postMessage({action:'exec', sql:"CREATE TABLE if not exists dji_pilot_dji_groundstation_controller_DataMgr_DJIWPCollectionItem ( id INTEGER PRIMARY KEY AUTOINCREMENT,distance REAL,pointsJsonStr,location,autoAddFlag INTEGER,createdDate INTEGER )"});

      
}
      

   
    try {
      worker.postMessage({action:'open',buffer:r.result}, [r.result]);
    }
    catch(exception) {
      worker.postMessage({action:'open',buffer:r.result});
    }
  }
  r.readAsArrayBuffer(file_data);
                  


         

                 };


  });

 