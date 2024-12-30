// let scroll_speed = parseFloat(localStorage.getItem("scroll_speed")) || 10.0;
// localStorage.setItem("scroll_speed", scroll_speed);
const scroll_speed = 10.0;
let pixels_per_second = 100 + 20 * scroll_speed;

const title = document.getElementById("title");
const icon = document.getElementById("icon");

const scroll_speed_range = document.getElementById("scroll-speed-range");
const scroll_speed_text = document.getElementById("scroll-speed-text");

scroll_speed_range.value = scroll_speed;
scroll_speed_text.value = scroll_speed.toFixed(1);

let parsed_scale = parseFloat(localStorage.getItem("scale")) || 1;
const scale_text = document.getElementById("scale-text");

scale_text.value = parsed_scale;

let parsed_current_time = 0.0;
let chart_duration = 1.0;
const current_time = document.getElementById("current-time");
const total_time = document.getElementById("total-time");
const current_percentage = document.getElementById("current-percentage");

let chart;
let height = 0;
const chart_scroller = document.getElementById("chart-scroller");
const chart_image = document.getElementById("chart-image");

const chart_name = document.getElementById("chart-name");

let song_data = {};
let difficulty;

function updateTimes() {
    total_time.innerHTML = chart_duration = song_data.duration.toFixed(2);
    height = chart_duration * pixels_per_second;

    chart_scroller.scrollTop =
        (height - chart_scroller.clientHeight / parsed_scale - parsed_current_time * pixels_per_second) * parsed_scale;
    parsed_current_time =
        (height - chart_scroller.scrollTop / parsed_scale - chart_scroller.clientHeight / parsed_scale) / pixels_per_second;

    if (document.activeElement != current_time || !document.hasFocus()) current_time.value = parsed_current_time.toFixed(2);
    if (document.activeElement != current_percentage || !document.hasFocus())
        current_percentage.value = ((parsed_current_time * 100) / chart_duration).toFixed(2);
}

function diffChanged() {
    title.innerHTML = `${song_data.name} ${difficulty}`;

    chart_image.innerHTML = "";

    let segments = Math.ceil(height / 65535);
    for (let i = 0; i < segments; i++) {
        chart_image.innerHTML += `<img src="/vs-charts/hidden/charts/${song_data.file_name}/${difficulty}-${i}.png">`;
    }
}

let url = new URL(window.location);

if (url.searchParams.has("chart")) {
    chart = url.searchParams.get("chart");
    icon.href = `/vs-charts/hidden/jackets/${chart}.png`;

    fetch("/vs-charts/hidden/other_song_data.json").then((data) => {
        data.json().then((data) => {
            if (url.searchParams.has("diff")) {
                difficulty = url.searchParams.get("diff");
            } else {
                window.location.href = "/vs-charts/hidden/others";
            }

            for (let song of data) {
                if (song.file_name == chart && song.difficulty == difficulty) {
                    song_data = song;
                    chart_name.innerHTML = song_data.name;

                    height = song_data.duration * pixels_per_second;
                    diffChanged();
                    chart_image.style = `width: ${
                        91 * parsed_scale
                    }px; border-left-width: ${parsed_scale}px; border-right-width: ${parsed_scale}px`;

                    if (url.searchParams.has("time")) {
                        parsed_current_time = parseFloat(url.searchParams.get("time")) || 0;
                    }

                    let segments = Math.ceil(height / 65535);
                    let num_complete = 0;
                    for (let img of chart_image.children) {
                        num_complete += img.complete;
                        img.addEventListener("load", () => {
                            num_complete++;
                            if (num_complete == segments) updateTimes();
                        });
                    }
                    if (num_complete == segments) updateTimes();
                    window.addEventListener("resize", updateTimes);

                    let update_search_time_timeout;
                    addEventListener("scroll", () => {
                        parsed_current_time =
                            (height - chart_scroller.scrollTop / parsed_scale - chart_scroller.clientHeight / parsed_scale) /
                            pixels_per_second;

                        if (document.activeElement != current_time || !document.hasFocus())
                            current_time.value = parsed_current_time.toFixed(2);
                        if (document.activeElement != current_percentage || !document.hasFocus())
                            current_percentage.value = ((parsed_current_time * 100) / chart_duration).toFixed(2);

                        if (update_search_time_timeout) clearTimeout(update_search_time_timeout);
                        update_search_time_timeout = setTimeout(() => {
                            update_search_time_timeout = undefined;
                            let url = new URL(window.location);
                            url.searchParams.set("time", parsed_current_time.toFixed(2));
                            window.history.replaceState(null, null, url);
                        }, 100);
                    });

                    // scroll_speed_range.addEventListener("input", () => {
                    //     scroll_speed = parseFloat(scroll_speed_range.value);
                    //     localStorage.setItem("scroll_speed", scroll_speed);
                    //     pixels_per_second = 100 + 20 * scroll_speed;
                    //     scroll_speed_text.value = scroll_speed.toFixed(1);

                    //     diffChanged();
                    //     updateTimes();
                    // });

                    // scroll_speed_text.addEventListener("input", () => {
                    //     let new_scroll_speed = parseFloat(scroll_speed_text.value);
                    //     if (!isNaN(new_scroll_speed) && 1 <= new_scroll_speed && new_scroll_speed <= 20) {
                    //         scroll_speed = Math.round(new_scroll_speed * 10) / 10;
                    //         localStorage.setItem("scroll_speed", scroll_speed);
                    //         pixels_per_second = 100 + 20 * scroll_speed;
                    //         scroll_speed_range.value = scroll_speed;

                    //         diffChanged();
                    //         updateTimes();
                    //     }
                    // });

                    scale_text.addEventListener("input", () => {
                        let new_scale = parseFloat(scale_text.value);
                        if (!isNaN(new_scale) && new_scale > 0) {
                            parsed_scale = new_scale;
                            localStorage.setItem("scale", parsed_scale);

                            chart_image.style = `width: ${
                                91 * parsed_scale
                            }px; border-left-width: ${parsed_scale}px; border-right-width: ${parsed_scale}px`;
                            updateTimes();
                        }
                    });

                    current_time.addEventListener("input", () => {
                        let new_value = parseFloat(current_time.value);
                        if (!isNaN(new_value)) parsed_current_time = new_value;
                        updateTimes();
                    });

                    current_percentage.addEventListener("input", () => {
                        let new_value = (parseFloat(current_percentage.value) / 100) * chart_duration;
                        if (!isNaN(new_value)) parsed_current_time = new_value;
                        updateTimes();
                    });

                    url.search = "";
                    url.searchParams.set("chart", chart);
                    url.searchParams.set("diff", difficulty);
                    url.searchParams.set("time", parsed_current_time.toFixed(2));
                    window.history.replaceState(null, null, url);
                    return;
                }
            }

            window.location.href = "/vs-charts/hidden";
        });
    });
} else {
    window.location.href = "/vs-charts/hidden";
}
