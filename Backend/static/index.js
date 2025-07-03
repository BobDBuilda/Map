const socket = io();
let Markers = new Array();

const map = L.map('map').setView([13.13455, -59.62983], 20);

socket.on('connect', ()=>{
    console.log("connected with socket id: ", socket.id);
    //const map = L.map('map').setView([13.13455, -59.62983], 12);
});


document.addEventListener('DOMContentLoaded', async () => {
    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(lat, lon);
            userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You");
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

    let place = L.marker([lat, lon]);
    addMarker(place);
    Markers.unshift(place);
    addMarker(place);
    if(Markers.length > 1){
        let marker = Markers[1];
        removeMarker(marker);
    }

    map.setView([lat, lon], 25);
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  const menu = document.getElementById('menu-content');
  menu.classList.toggle('menu-visible');
});


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

const addMarker = (place) => {
    place.addTo(map);
};


const removeMarker = (place) => {
    //data has to be a L.marker element
    place.remove();
};

const loadEvents = () => {
    //pull from a database table of events on campus
    //and populate the map based on the geolocation of the event

};

