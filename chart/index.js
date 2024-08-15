const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];
const difficulty_names = ["opening", "middle", "finale", "encore"];

const scroll_speed = 10.0;
const pixels_per_second = 100 + 20 * scroll_speed;

const title = document.getElementById("title");
const icon = document.getElementById("icon");

let parsed_current_time = 0.0;
const current_time = document.getElementById("current-time");
const total_time = document.getElementById("total-time");

const chart_scroller = document.getElementById("chart-scroller");
const chart_image = document.getElementById("chart-image");

const difficulty_buttons = [
  document.getElementById("opening"),
  document.getElementById("middle"),
  document.getElementById("finale"),
  document.getElementById("encore"),
];
const difficulty_level = document.getElementById("difficulty-level");

let song_data;
let difficulty;

function updateTimes() {
  if (difficulty == 3) total_time.innerHTML = (song_data.encore_duration || song_data.duration).toFixed(2);
  else total_time.innerHTML = song_data.duration.toFixed(2);
  chart_scroller.scrollTop = chart_image.height - chart_scroller.clientHeight - parsed_current_time * pixels_per_second;
  parsed_current_time = (chart_image.height - chart_scroller.scrollTop - chart_scroller.clientHeight) / pixels_per_second;

  if (document.activeElement != current_time || !document.hasFocus()) current_time.value = parsed_current_time.toFixed(2);
}

let url = new URL(window.location);

if (url.searchParams.has("chart")) {
  let chart = url.searchParams.get("chart");
  icon.href = `/vs-charts/jackets/${chart}.png`;

  cachedJsonFetch("/vs-charts/song_data.json").then((data) => {
    for (let song of data) {
      if (song.file_name == chart) {
        song_data = song;

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

            difficulty_level.innerHTML = song_data.difficulties[difficulty].toFixed(1);
            title.innerHTML = `${song_data.name} ${difficulty_names[difficulty]} ${difficulty_level.innerHTML}`;
            chart_image.src = `/vs-charts/charts/${chart}/${difficulty_names[difficulty]}.png`;

            let url = new URL(window.location);
            url.searchParams.set("diff", difficulty);
            window.history.replaceState(null, null, url);
          });
        }

        difficulty_level.innerHTML = song_data.difficulties[difficulty].toFixed(1);
        title.innerHTML = `${song_data.name} ${difficulty_names[difficulty]} ${difficulty_level.innerHTML}`;
        chart_image.src = `/vs-charts/charts/${chart}/${difficulty_names[difficulty]}.png`;
        chart_image.style = "display: block; margin-left: auto; margin-right: auto";

        if (url.searchParams.has("time")) {
          parsed_current_time = parseFloat(url.searchParams.get("time")) || 0;
        }

        if (chart_image.complete) updateTimes();
        chart_image.addEventListener("load", updateTimes);
        window.addEventListener("resize", updateTimes);

        let update_search_time_timeout;
        addEventListener("scroll", () => {
          parsed_current_time = (chart_image.height - chart_scroller.scrollTop - chart_scroller.clientHeight) / pixels_per_second;

          if (document.activeElement != current_time || !document.hasFocus()) current_time.value = parsed_current_time.toFixed(2);

          if (update_search_time_timeout) clearTimeout(update_search_time_timeout);
          update_search_time_timeout = setTimeout(() => {
            update_search_time_timeout = undefined;
            let url = new URL(window.location);
            url.searchParams.set("time", parsed_current_time.toFixed(2));
            window.history.replaceState(null, null, url);
          }, 100);
        });

        current_time.addEventListener("input", () => {
          parsed_current_time = parseFloat(current_time.value) || parsed_current_time;
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

    window.location.href = "/vs-charts";
  });
} else {
  window.location.href = "/vs-charts";
}
