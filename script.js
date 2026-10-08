/* =========================================================
   WEATHER APP
   Location Search:
   OpenStreetMap / Nominatim

   Weather:
   WeatherAPI
========================================================= */


/* =========================================================
   WEATHER API KEY
========================================================= */



const API_KEY = "a8ad54291a67441380924955260810";
/* =========================================================
   HTML ELEMENTS
========================================================= */

const locationInput =
    document.getElementById("locationInput");

const searchBtn =
    document.getElementById("searchBtn");

const suggestions =
    document.getElementById("suggestions");

const error =
    document.getElementById("error");

const weatherCard =
    document.getElementById("weatherCard");


let searchTimer;


/* =========================================================
   LOCATION INPUT
========================================================= */

locationInput.addEventListener(
    "input",
    function () {

        const query =
            locationInput.value.trim();

        clearTimeout(searchTimer);

        /*
        At least 2 characters
        */

        if (query.length < 2) {

            suggestions.innerHTML = "";

            return;
        }


        /*
        Wait 500ms before searching
        */

        searchTimer =
            setTimeout(
                () => searchLocations(query),
                500
            );
    }
);


/* =========================================================
   SEARCH LOCATION
   OPENSTREETMAP NOMINATIM
========================================================= */

async function searchLocations(query) {

    try {

        suggestions.innerHTML =
            `<div class="suggestion">
                Searching locations...
            </div>`;


        const url =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}` +
            `&format=json` +
            `&addressdetails=1` +
            `&limit=10`;


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Location search failed"
            );
        }


        const locations =
            await response.json();


        showSuggestions(locations);


    } catch (err) {

        console.error(err);

        suggestions.innerHTML =
            `<div class="suggestion">
                ❌ Location search failed
            </div>`;
    }
}


/* =========================================================
   SHOW LOCATION SUGGESTIONS
========================================================= */

function showSuggestions(locations) {

    suggestions.innerHTML = "";


    if (
        !locations ||
        locations.length === 0
    ) {

        suggestions.innerHTML =
            `<div class="suggestion">
                ❌ No location found
            </div>`;

        return;
    }


    locations.forEach(
        function (location) {

            const div =
                document.createElement("div");


            div.className =
                "suggestion";


            /*
            Address information
            */

            const address =
                location.address || {};


            const village =
                address.village ||
                address.hamlet ||
                address.suburb ||
                address.town ||
                address.city ||
                location.name;


            const district =
                address.county ||
                address.state_district ||
                "";


            const state =
                address.state ||
                "";


            const country =
                address.country ||
                "";


            /*
            Display location
            */

            div.innerHTML = `

                <strong>
                    ${escapeHTML(village)}
                </strong>

                <small>
                    ${escapeHTML(
                        buildLocationText(
                            district,
                            state,
                            country
                        )
                    )}
                </small>

            `;


            /*
            Click suggestion
            */

            div.addEventListener(
                "click",
                function () {

                    /*
                    Put selected location
                    name inside input
                    */

                    locationInput.value =
                        village;


                    /*
                    Clear suggestions
                    */

                    suggestions.innerHTML =
                        "";


                    /*
                    Get exact coordinates
                    */

                    getWeather(
                        location.lat,
                        location.lon,
                        village
                    );
                }
            );


            suggestions.appendChild(div);
        }
    );
}


/* =========================================================
   BUILD LOCATION TEXT
========================================================= */

function buildLocationText(
    district,
    state,
    country
) {

    const parts = [];


    if (district)
        parts.push(district);


    if (state)
        parts.push(state);


    if (country)
        parts.push(country);


    return parts.join(", ");
}


/* =========================================================
   SEARCH BUTTON
========================================================= */

searchBtn.addEventListener(
    "click",
    function () {

        const query =
            locationInput.value.trim();


        if (query === "") {

            error.textContent =
                "Please enter a location.";

            return;
        }


        /*
        Search exact location
        */

        getWeatherByName(query);
    }
);


/* =========================================================
   ENTER KEY
========================================================= */

locationInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchBtn.click();
        }
    }
);


/* =========================================================
   WEATHER BY LOCATION NAME
========================================================= */

async function getWeatherByName(
    location
) {

    try {

        error.textContent =
            "Searching location...";


        /*
        First search location using
        OpenStreetMap
        */

        const searchURL =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(location)}` +
            `&format=json` +
            `&addressdetails=1` +
            `&limit=1`;


        const searchResponse =
            await fetch(
                searchURL,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!searchResponse.ok) {

            throw new Error(
                "Location search failed"
            );
        }


        const locations =
            await searchResponse.json();


        if (
            !locations ||
            locations.length === 0
        ) {

            throw new Error(
                "Location not found"
            );
        }


        /*
        Take first matching location
        */

        const locationData =
            locations[0];


        /*
        Get exact coordinates
        */

        const lat =
            locationData.lat;


        const lon =
            locationData.lon;


        /*
        Get WeatherAPI weather
        */

        await getWeather(
            lat,
            lon,
            locationData.display_name
        );


    } catch (err) {

        weatherCard.classList.add(
            "hidden"
        );


        error.textContent =
            "❌ " + err.message;


        console.error(err);
    }
}


/* =========================================================
   WEATHER USING LATITUDE + LONGITUDE
========================================================= */

async function getWeather(
    lat,
    lon,
    selectedName = ""
) {

    try {

        error.textContent =
            "Loading weather...";


        /*
        Exact coordinates
        */

        const coordinates =
            `${lat},${lon}`;


        /*
        WeatherAPI request
        */

        const url =
            `https://api.weatherapi.com/v1/current.json` +
            `?key=${API_KEY}` +
            `&q=${encodeURIComponent(coordinates)}` +
            `&aqi=yes`;


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error?.message ||
                "Weather not found"
            );
        }


        /*
        Display weather
        */

        displayWeather(data);


    } catch (err) {

        weatherCard.classList.add(
            "hidden"
        );


        error.textContent =
            "❌ " + err.message;


        console.error(err);
    }
}


/* =========================================================
   DISPLAY WEATHER
========================================================= */

function displayWeather(data) {

    error.textContent = "";


    weatherCard.classList.remove(
        "hidden"
    );


    /* =====================================================
       LOCATION
    ===================================================== */

    document.getElementById(
        "locationName"
    ).textContent =
        data.location.name;


    document.getElementById(
        "locationDetails"
    ).textContent =
        `${data.location.region || ""}
        ${data.location.region ? ", " : ""}
        ${data.location.country}`;


    /* =====================================================
       TEMPERATURE
    ===================================================== */

    document.getElementById(
        "temperature"
    ).textContent =
        `${data.current.temp_c}°C`;


    /* =====================================================
       CONDITION
    ===================================================== */

    document.getElementById(
        "condition"
    ).textContent =
        data.current.condition.text;


    /* =====================================================
       WEATHER ICON
    ===================================================== */

    document.getElementById(
        "weatherIcon"
    ).src =
        "https:" +
        data.current.condition.icon;


    /* =====================================================
       FEELS LIKE
    ===================================================== */

    document.getElementById(
        "feelsLike"
    ).textContent =
        `${data.current.feelslike_c}°C`;


    /* =====================================================
       HUMIDITY
    ===================================================== */

    document.getElementById(
        "humidity"
    ).textContent =
        `${data.current.humidity}%`;


    /* =====================================================
       WIND
    ===================================================== */

    document.getElementById(
        "wind"
    ).textContent =
        `${data.current.wind_kph} km/h`;


    /* =====================================================
       CLOUD
    ===================================================== */

    document.getElementById(
        "cloud"
    ).textContent =
        `${data.current.cloud}%`;


    /* =====================================================
       VISIBILITY
    ===================================================== */

    document.getElementById(
        "visibility"
    ).textContent =
        `${data.current.vis_km} km`;


    /* =====================================================
       UV
    ===================================================== */

    document.getElementById(
        "uv"
    ).textContent =
        data.current.uv;


    /* =====================================================
       LAST UPDATED
    ===================================================== */

    document.getElementById(
        "updated"
    ).textContent =
        data.current.last_updated;
}


/* =========================================================
   HTML SECURITY
   Prevent HTML injection in location suggestions
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}