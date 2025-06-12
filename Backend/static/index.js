const socket = io();
let Markers = new Array();

let userMarker = '';
let destinationMarker = '';

const map = L.map('map').setView([13.13455, -59.62983], 12);

socket.on('connect', ()=>{
    console.log("connected with socket id: ", socket.id);
    //const map = L.map('map').setView([13.13455, -59.62983], 12);
});

/*socket.on('add_marker', (data) => {
    console.log("Adding marker: ", data);
    const { lat, lon } = data;
    L.marker([lat, lon]).addTo(map).bindPopup(`Lat: ${lat}, lon: ${lon}`).openPopup();
})*/


socket.on('coordinates_received', (data) => {
    console.log('Server acknowledged:', data);
});

document.addEventListener('DOMContentLoaded', async () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            isUserOnCampus({lat, lon});
            userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You - click to set origin");
        },
        (error) => {
            console.error('Geolocation error:', error);
        }
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
});

document.getElementById('search-btn').addEventListener('click', async (event) => {
    event.preventDefault();
    const input = document.getElementsByName('search-query')[0];
    const query = input?.value?.trim();

    if(!query) return;

    const data = await search(query);
    
    const {lat, lon, name, score} = data;
    let destination = L.latLng(lat, lon);

    Markers.push(data);
    let marker = Markers.pop();
    console.log(marker);
    addMarker(marker);

    //L.marker([lat, lon]).addTo(map).bindPopup(`${name}`).openPopup();
    map.setView([lat, lon], 20);
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  const menu = document.getElementById('menu-content');
  menu.classList.toggle('menu-visible');
});


/*input.addEventListener('input', async () => {
    console.log('input chnaged');
    const query = input.value.trim();
    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    let suggestions = search(query);

    suggestions.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.addEventListener('click', () => {
        input.value = item;
        suggestionsList.innerHTML = '';
        // Optional: trigger search here
      });
      suggestionsList.appendChild(li);
    });
});*/

const search = async (query) => {
    const response = await fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({query})
    });
    
    const data = await response.json();
    console.log(data);

    if(data.error){
        alert(data.error);
        return;
    }

    return data;
};

const route = (userlocation=null,destination=null) => {
    /*L.Routing.control({
        waypoints: [
            userLocation,
            destination
        ],
        routeWhileDragging: false,
        show: true,
        addWaypoints: false,
        draggableWaypoints: false

    }).addTo(map);*/

    const {ulat, ulon} = userlocation;
    const {dlat, dlon} = destination;

    fetch(`/route/${ulat}/${ulon}/${dlat}/${dlon}`)
    .then(res => res.json())
    .then(geojson => {
        L.geoJSON(geojson, { style: { color: "#ff3333", weight: 4 }})
        .addTo(map)
        .bindPopup("Shortest path");
    })
};

const isUserOnCampus = async (userlocation=null) => {
    console.log(userlocation);
    const response = await fetch('/check_user_location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userlocation)
    })
    
    const data = await response.json();

    if(data.onCampus){
        console.log("You are on the main campus");

    }else{
        console.log("You are not on the main campus");
    }
};

const addMarker = (data) => {
    const {lat, lon, name, score} = data;
    destinationMarker = L.marker([lat, lon]).addTo(map).bindPopup(`${name} - click to set as destination`).openPopup();
};

const removeMarker = (data) => {
    map.removeLayer(data);
};



let originCoords = null;
let destCoords = null;
let routeLayer = null;

// Function to call your Flask route API
function fetchAndDisplayRoute() {
  const [olat, olon] = originCoords;
  const [dlat, dlon] = destCoords;

  fetch(`/route/${olat}/${olon}/${dlat}/${dlon}`)
    .then(res => res.json())
    .then(data => {
      if (routeLayer) map.removeLayer(routeLayer); // clear old route if exists
      routeLayer = L.geoJSON(data, {
        style: { color: 'blue', weight: 4 }
      }).addTo(map);
    });
}



userMarker.on('click', function () {
  originCoords = [13.0974, -59.6165];
  alert("Origin set! Now click on the destination marker.");
});

destMarker.on('click', function () {
  destCoords = [13.091, -59.602];
  if (originCoords) {
    fetchAndDisplayRoute();
  } else {
    console.log("Set the origin first by clicking the user marker.");
  }
});

