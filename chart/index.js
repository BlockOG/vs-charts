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
const chart_scroller = document.getElementById("chart-scroller");
const chart_image = document.getElementById("chart-image");

const difficulty_buttons = [
    document.getElementById("opening"),
    document.getElementById("middle"),
    document.getElementById("finale"),
    document.getElementById("encore"),
];
const chart_name = document.getElementById("chart-name");
const difficulty_level = document.getElementById("difficulty-level");

const score_rating_switch = document.getElementById("score-rating-switch");
let score_rating_switch_selection = true;

const score_rating = document.getElementById("score-rating");
let parsed_score_rating_score = 0;
const score_rating_score = document.getElementById("score-rating-score");
const score_rating_buttons = [
    document.getElementById("score-rating-na"),
    document.getElementById("score-rating-fc"),
    document.getElementById("score-rating-ac"),
];
let score_rating_selection = 0;
const score_rating_rating = document.getElementById("score-rating-rating");

const rating_score = document.getElementById("rating-score");
const rating_score_rating = document.getElementById("rating-score-rating");
let parsed_rating_score_rating = 0;
const rating_score_score_texts = [
    document.getElementById("rating-score-score-na"),
    document.getElementById("rating-score-score-fc"),
    document.getElementById("rating-score-score-ac"),
];

let song_data;
let difficulty;

function updateTimes() {
    if (difficulty == 3) total_time.innerHTML = chart_duration = (song_data.encore_duration || song_data.duration).toFixed(2);
    else total_time.innerHTML = chart_duration = song_data.duration.toFixed(2);
    chart_scroller.scrollTop =
        (chart_image.height / parsed_scale - chart_scroller.clientHeight / parsed_scale - parsed_current_time * pixels_per_second) *
        parsed_scale;
    parsed_current_time =
        (chart_image.height / parsed_scale - chart_scroller.scrollTop / parsed_scale - chart_scroller.clientHeight / parsed_scale) /
        pixels_per_second;

    if (document.activeElement != current_time || !document.hasFocus()) current_time.value = parsed_current_time.toFixed(2);
    if (document.activeElement != current_percentage || !document.hasFocus())
        current_percentage.value = ((parsed_current_time * 100) / chart_duration).toFixed(2);
}

function setScoreRatingCalc() {
    if (score_rating_switch_selection) {
        score_rating_switch.innerHTML = "->";
        rating_score.style = "display: none";
        score_rating.style = "";

        score_rating_rating.innerHTML = ratingFromScore(parsed_score_rating_score, score_rating_selection).toFixed(2);
    } else {
        score_rating_switch.innerHTML = "<-";
        score_rating.style = "display: none";
        rating_score.style = "";

        for (let i in rating_score_score_texts) {
            i = parseInt(i);

            let score = scoreFromRating(parsed_rating_score_rating, i);

            if (score != undefined) {
                rating_score_score_texts[i].innerHTML = score.toFixed(2);
                rating_score_score_texts[i].parentElement.style = "";
            } else {
                rating_score_score_texts[i].parentElement.style = "display: none";
            }
        }
    }
}

function diffChanged() {
    difficulty_level.innerHTML = song_data.difficulties[difficulty].toFixed(1);
    difficulty_level.className = `${difficulty_names[difficulty]}-text`;
    title.innerHTML = `${song_data.name} ${difficulty_names[difficulty]} ${difficulty_level.innerHTML}`;
    // chart_image.src = `/vs-charts/charts/${chart}/${difficulty_names[difficulty]}-${scroll_speed.toFixed(1)}.png`;
    chart_image.src = `/vs-charts/charts/${chart}/${difficulty_names[difficulty]}.png`;
}

let url = new URL(window.location);

if (url.searchParams.has("chart")) {
    chart = url.searchParams.get("chart");
    icon.href = `/vs-charts/jackets/${chart}.png`;

    fetch("/vs-charts/song_data.json").then((data) => {
        data.json().then((data) => {
            for (let song of data) {
                if (song.file_name == chart) {
                    song_data = song;
                    chart_name.innerHTML = song_data.name;

                    if (url.searchParams.has("diff")) {
                        difficulty = parseInt(url.searchParams.get("diff"));
                        if (!difficulty || 0 > difficulty || difficulty >= song_data.difficulties.length) difficulty = 0;
                    } else {
                        difficulty = 0;
                    }

                    if (song_data.difficulties.length == 4) difficulty_buttons[3].style = "";

                    difficulty_buttons[difficulty].disabled = true;

                    for (let diff in song_data.difficulties) {
                        diff = parseInt(diff);
                        difficulty_buttons[diff].addEventListener("click", () => {
                            difficulty_buttons[difficulty].disabled = false;
                            difficulty = diff;
                            difficulty_buttons[difficulty].disabled = true;

                            diffChanged();

                            let url = new URL(window.location);
                            url.searchParams.set("diff", difficulty);
                            window.history.replaceState(null, null, url);
                        });
                    }

                    for (let i in score_rating_buttons) {
                        i = parseInt(i);
                        score_rating_buttons[i].addEventListener("click", () => {
                            score_rating_buttons[score_rating_selection].disabled = false;
                            score_rating_selection = i;
                            score_rating_buttons[score_rating_selection].disabled = true;

                            setScoreRatingCalc();
                        });
                    }

                    diffChanged();
                    chart_image.style = `width: ${91 * parsed_scale}px; outline-width: ${parsed_scale}px`;

                    if (url.searchParams.has("time")) {
                        parsed_current_time = parseFloat(url.searchParams.get("time")) || 0;
                    }

                    if (chart_image.complete) updateTimes();
                    chart_image.addEventListener("load", updateTimes);
                    window.addEventListener("resize", updateTimes);

                    let update_search_time_timeout;
                    addEventListener("scroll", () => {
                        parsed_current_time =
                            (chart_image.height / parsed_scale -
                                chart_scroller.scrollTop / parsed_scale -
                                chart_scroller.clientHeight / parsed_scale) /
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
                        if (!isNaN(new_scale)) {
                            parsed_scale = new_scale;
                            localStorage.setItem("scale", parsed_scale);

                            chart_image.style = `width: ${91 * parsed_scale}px; outline-width: ${parsed_scale}px`;
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

                    score_rating_switch.addEventListener("click", () => {
                        score_rating_switch_selection = !score_rating_switch_selection;
                        setScoreRatingCalc();
                    });

                    score_rating_score.addEventListener("input", () => {
                        let new_value = parseFloat(score_rating_score.value);
                        if (!isNaN(new_value)) parsed_score_rating_score = new_value;
                        setScoreRatingCalc();
                    });

                    rating_score_rating.addEventListener("input", () => {
                        let new_value = parseFloat(rating_score_rating.value);
                        if (!isNaN(new_value)) parsed_rating_score_rating = new_value;
                        setScoreRatingCalc();
                    });

                    url.search = "";
                    url.searchParams.set("chart", chart);
                    url.searchParams.set("diff", difficulty);
                    url.searchParams.set("time", parsed_current_time.toFixed(2));
                    window.history.replaceState(null, null, url);
                    return;
                }
            }

            window.location.href = "/vs-charts";
        });
    });
} else {
    window.location.href = "/vs-charts";
}
