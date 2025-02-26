// Initialize the map centered on Kabupaten Sikka (approx coordinates)
var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([-8.6233, 122.2167], 15); // Adjust latitude/longitude and zoom as needed

// Add a zoom control to the map
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Base layer (peta dasar)
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
// Base layer: Google Satellite
var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], // Subdomain Google
    attribution: '© Google Maps'
});
// Base layer: Google Hybrid (cek ulang)
var googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: 'Google Maps'
});

// Styling untuk rute DLH
function styleRute(feature) {
    switch (feature.properties.Jenis) {
        case 'Dump Truck':
            return { color: '#F48C06', weight: 4, opacity: 0.85, lineCap: 'round' }; // Oranye DLH
        case 'Penyapu':
            return { color: '#0078D4', weight: 3, opacity: 0.75, dashArray: '6, 12', lineJoin: 'round' }; // Biru DLH
        case 'Roda Tiga':
            return { color: '#1F5A3A', weight: 2, opacity: 0.7, lineCap: 'square' }; // Hijau tua DLH
        default:
            return { color: '#808080', weight: 1, opacity: 0.5 };
    }
}

// Styling untuk kontainer (titik)
function styleKontainer(feature, latlng) {
    let style;
    switch (feature.properties.Kondisi) {
        case 'Normal':
            style = { radius: 8, fillColor: '#F48C06', color: '#1F5A3A', weight: 1, opacity: 0.9, fillOpacity: 0.7 }; // Oranye DLH, border hijau tua
            break;
        case 'Kritis':
            style = { radius: 10, fillColor: '#0078D4', color: '#1F5A3A', weight: 1.5, opacity: 1, fillOpacity: 0.8 }; // Biru DLH, border hijau tua
            break;
        default:
            style = { radius: 6, fillColor: '#343A40', color: '#000000', weight: 1, opacity: 0.6, fillOpacity: 0.5 };
    }
    return L.circleMarker(latlng, style);
}

// Styling untuk TPA (titik tunggal)
function styleTPA(feature, latlng) {
    return L.circleMarker(latlng, {
        radius: 12, fillColor: '#1F5A3A', color: '#F48C06', weight: 2, opacity: 1, fillOpacity: 0.85 // Hijau tua DLH, border oranye
    });
}

// Fungsi popup untuk setiap feature
function onEachFeature(feature, layer) {
    let popupContent = '';
    if (feature.properties) {
        if (feature.geometry.type === 'MultiLineString') { // Rute DLH
            popupContent = `<strong>Rute Pelayanan</strong><br>${feature.properties.Jenis}`;
        } else if (feature.geometry.type === 'Point') { // Kontainer dan TPA
            if (feature.properties.Jenis) { // Kontainer
                popupContent = `<strong>Kontainer</strong><br>${feature.properties.Name}`;
            } else { // TPA
                popupContent = `<strong>TPA</strong><br>Lokasi: Tempat Pembuangan Akhir`;
            }
        }
    }
    if (popupContent) {
        layer.bindPopup(popupContent);
    }
}

// Buat layer kosong dulu
var ruteLayer = L.layerGroup();
var kontainerLayer = L.layerGroup();
var tpaLayer = L.layerGroup();

fetch('data/Kontainer.geojson') // Ganti dengan path file GeoJSON kamu
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: styleKontainer,
            onEachFeature: onEachFeature
        }).addTo(kontainerLayer);
        kontainerLayer.addTo(map);
    })
    .catch(error => console.log('Error loading Data Kontainer Sampah:', error));

fetch('data/Rute Pelayanan DLH.geojson') // Ganti dengan path file GeoJSON kamu
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: styleRute,
            onEachFeature: onEachFeature
        }).addTo(ruteLayer);
        ruteLayer.addTo(map);
    })
    .catch(error => console.log('Error loading Data Rute Pelayanan DLH:', error));

fetch('data/TPA.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: styleTPA,
            onEachFeature: onEachFeature
        }).addTo(tpaLayer);
        tpaLayer.addTo(map);
    })
    .catch(error => console.log('Error loading Data TPA:', error));

// Layer control dengan basemap
var baseLayers = {
    "Default": osm,
    "Satellite": googleSat,
    "Hybrid": googleHybrid
};

var overlays = {
    "Rute Pelayanan": ruteLayer,
    "Kontainer": kontainerLayer,
    "TPA": tpaLayer
};

L.control.layers(baseLayers, overlays,
    // { collapsed: false }
).addTo(map);

// Tambah legenda
var legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML += '<h4>LEGENDA</h4>';
    
    // Rute DLH (garis)
    div.innerHTML += '<h5>Rute Pelayanan</h5>';
    div.innerHTML += '<i style="background: #F48C06; width: 20px; height: 3px; display: inline-block;"></i> Dump Truck<br>';
    div.innerHTML += '<i style="background: #0078D4; width: 20px; height: 3px; display: inline-block; border: 1px dashed #0078D4;"></i> Penyapu<br>';
    div.innerHTML += '<i style="background: #1F5A3A; width: 20px; height: 3px; display: inline-block;"></i> Roda Tiga<br>';

    // Kontainer (titik)
    div.innerHTML += '<h5>Kontainer</h5>';
    div.innerHTML += '<i style="background: #F48C06; width: 10px; height: 10px; border-radius: 50%; display: inline-block; border: 1px solid #1F5A3A;"></i> Normal<br>';
    div.innerHTML += '<i style="background: #0078D4; width: 12px; height: 12px; border-radius: 50%; display: inline-block; border: 1px solid #1F5A3A;"></i> Kritis<br>';

    // TPA (titik tunggal)
    div.innerHTML += '<h5>TPA</h5>';
    div.innerHTML += '<i style="background: #1F5A3A; width: 14px; height: 14px; border-radius: 50%; display: inline-block; border: 1px solid #F48C06;"></i> TPA<br>';

    return div;
};

legend.addTo(map);
