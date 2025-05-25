document.addEventListener('DOMContentLoaded', ()=>{
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search--button");
    const searchResults = document.getElementById("search-results");

    function performSearch(){
        const searchTerm = searchInput.value.trim();

        if(searchTerm === ''){
            searchResults.innerHTML = '<p>Please enter a search term</p>';
            return;
        }

    }

    searchButton.addEventListener('click', performSearch);

    //should apply if the search bar is selected
    //will come back to that
    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter'){
            performSearch();
        }
    })

    function parseCSV(csv){
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        const result = [];

        for(let i = 1; i < lines.length; i++){
            if(!lines[i]) continue;
            const obj = {};
            const currentLine = lines[i].split(',');

            for(let j = 0; j < headers.length; j++){
                obj[headers[j].trim()] = currentLine[j] ? currentLine[j].trim() : '';

            }

            result.push(obj);
        }

        return result;
    }

    function searchLocations(query, locations){
        if(!query) return [];

        return locations.filter(location => {
            return location['Building Name'].toLowerCase().includes(query.toLowerCase());
        })
    }

    function displayLocation(){
        
    }
})