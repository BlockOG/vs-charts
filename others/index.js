let jackets_display = document.getElementById("jackets-display");

const level_search = document.getElementById("level-search");

let song_data;

function renderResult() {
    if (!song_data) return;

    let diff_to_charts = {};
    for (let i in song_data) {
        let song = song_data[i];
        if (
            !song.name.toLowerCase().includes(level_search.value.toLowerCase()) &&
            !song.file_name.includes(level_search.value.toLowerCase())
        )
            continue;

        diff_to_charts[song.difficulty] = diff_to_charts[song.difficulty] || [];
        diff_to_charts[song.difficulty].push(song);
    }

    let new_jackets_display = document.createElement("div");
    new_jackets_display.id = "jackets-display";

    let level_column = document.createElement("div");
    level_column.className = "column level-column";

    let jacket_column = document.createElement("div");
    jacket_column.className = "column";

    for (let i in diff_to_charts) {
        let i_fall = difficulty_names.includes(i) ? i : "fallback";
        let i_titled = i[0].toUpperCase() + i.slice(1);

        let level_div = document.createElement("div");

        let level_elem = document.createElement("span");
        level_elem.className = `${i_fall}-text`;
        level_elem.innerHTML = i_titled;

        level_div.appendChild(level_elem);
        level_column.appendChild(level_div);

        let jacket_row = document.createElement("div");
        jacket_row.className = "jacket-row";

        for (let chart of diff_to_charts[i]) {
            let link = document.createElement("a");
            let img = document.createElement("img");
            img.src = `/vs-charts/jackets/${chart.file_name}.png`;
            img.title = `${chart.name} ${i}`;

            link.className = `${i_fall}-link`;
            link.href = `/vs-charts/others/chart?chart=${chart.file_name}&diff=${i}`;
            link.appendChild(img);

            jacket_row.appendChild(link);
        }

        jacket_column.appendChild(jacket_row);
    }

    new_jackets_display.appendChild(level_column);
    new_jackets_display.appendChild(jacket_column);
    jackets_display.replaceWith(new_jackets_display);
    jackets_display = new_jackets_display;
}

function setSearchParams() {
    let url = new URL(window.location);
    url.search = "";

    window.history.replaceState(null, null, url);
}

function updateState() {
    setSearchParams();
    renderResult();
}

let url = new URL(window.location);

updateState();

level_search.addEventListener("input", updateState);

fetch("/vs-charts/other_song_data.json").then((data) => {
    data.json().then((data) => {
        song_data = data;
        renderResult();
    });
});
