let jackets_display = document.getElementById("jackets-display");

const level_range_start = document.getElementById("level-range-start");
const level_range_end = document.getElementById("level-range-end");

const level_search = document.getElementById("level-search");

const difficulties = [
    document.getElementById("difficulty-opening"),
    document.getElementById("difficulty-middle"),
    document.getElementById("difficulty-finale"),
    document.getElementById("difficulty-encore"),
];

const copy_link = document.getElementById("copy-link");

let song_data;

function verifyLevel(level) {
    let dot = false;
    for (let i of level) {
        if (i == ".") {
            if (dot) return false;
            dot = true;
        } else if (!"0123456789".includes(i)) {
            return false;
        }
    }

    return true;
}

function renderResult() {
    if (!song_data) return;

    let level_range = [
        level_range_start.value == "" ? -Infinity : parseFloat(level_range_start.value) || 0,
        level_range_end.value == "" ? Infinity : parseFloat(level_range_end.value) || 0,
    ];

    let levels = {};
    for (let i in song_data) {
        let song = song_data[i];
        if (
            !song.name.toLowerCase().includes(level_search.value.toLowerCase()) &&
            !song.file_name.includes(level_search.value.toLowerCase())
        )
            continue;

        i = parseInt(i);
        let song_difficulties = song.difficulties;
        for (let j in song_difficulties) {
            if (!difficulties[j].checked) continue;
            let level = song_difficulties[j];
            if (level_range[0] > level || level > level_range[1]) continue;

            let level_string = level.toFixed(1);
            if (!levels[level_string]) levels[level_string] = [];
            levels[level_string].push([song.file_name, parseInt(j), i, song.name]);
        }
    }

    let sorted_levels = [];
    for (let level in levels) {
        let level_charts = levels[level];
        level_charts.sort((a, b) => (a[1] == b[1] ? a[2] - b[2] : a[1] - b[1]));
        sorted_levels.push([level, parseFloat(level)]);
    }

    sorted_levels.sort((a, b) => a[1] - b[1]);

    let new_jackets_display = document.createElement("div");
    new_jackets_display.id = "jackets-display";

    let level_column = document.createElement("div");
    level_column.className = "column level-column";

    let jacket_column = document.createElement("div");
    jacket_column.className = "column";

    for (let i in sorted_levels) {
        let level = sorted_levels[i][0];

        let level_div = document.createElement("div");

        let level_elem = document.createElement("span");
        level_elem.className = `${difficulty_names[levels[level][0][1]]}-text`;
        level_elem.innerHTML = level;

        if (level[level.length - 1] == "1") level_elem.style = "padding-right: 15px";

        level_div.appendChild(level_elem);
        level_column.appendChild(level_div);

        let jacket_row = document.createElement("div");
        jacket_row.className = "jacket-row";

        for (let chart of levels[level]) {
            let link = document.createElement("a");
            let img = document.createElement("img");
            img.src = `/vs-charts/jackets/${chart[0]}.png`;
            img.title = `${chart[3]} ${difficulty_names[chart[1]]} ${level}`;

            link.className = `${difficulty_names[chart[1]]}-link`;
            link.href = `/vs-charts/chart?chart=${chart[0]}&diff=${chart[1]}`;
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

    let level_range = level_range_start.value + "-" + level_range_end.value;
    if (level_range != "-") {
        url.searchParams.set("level-range", level_range);
    }

    if (level_search.value != "") {
        url.searchParams.set("level-search", level_search.value);
    }

    let disabled = difficulties.map((i) => 1 - i.checked).join("");
    if (disabled != "0000") {
        url.searchParams.set("disabled", disabled);
    }

    window.history.replaceState(null, null, url);
}

function updateState() {
    setSearchParams();
    renderResult();
}

let url = new URL(window.location);

if (url.searchParams.has("level-range")) {
    let level_range = url.searchParams.get("level-range").split("-");
    if (level_range.length >= 2) {
        if (verifyLevel(level_range[0])) level_range_start.value = level_range[0];
        if (verifyLevel(level_range[1])) level_range_end.value = level_range[1];
    }
}

if (url.searchParams.has("level-search")) {
    level_search.value = url.searchParams.get("level-search");
}

if (url.searchParams.has("disabled")) {
    let disabled = url.searchParams.get("disabled");
    if (disabled.length >= 4) {
        for (let i = 0; i < 4; i++) {
            if (disabled[i] == "1") {
                difficulties[i].checked = false;
            }
        }
    }
}

let old_level_range_start = level_range_start.value;
let old_level_range_end = level_range_end.value;

updateState();

level_range_start.addEventListener("input", () => {
    if (verifyLevel(level_range_start.value)) {
        old_level_range_start = level_range_start.value;
        updateState();
    } else level_range_start.value = old_level_range_start;
});
level_range_end.addEventListener("input", () => {
    if (verifyLevel(level_range_end.value)) {
        old_level_range_end = level_range_end.value;
        updateState();
    } else level_range_end.value = old_level_range_end;
});
level_search.addEventListener("input", updateState);
difficulties.forEach((diff) => diff.addEventListener("input", updateState));

copy_link.addEventListener("click", () => navigator.clipboard.writeText(window.location.href));

fetch("/vs-charts/song_data.json").then((data) => {
    data.json().then((data) => {
        song_data = data;
        renderResult();
    });
});
