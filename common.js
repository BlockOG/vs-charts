const game_version = "3.5.0";
const version = "1.0.4";

const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];
const difficulty_names = ["opening", "middle", "finale", "encore"];

async function cachedJsonFetch(url) {
  const cachedJson = localStorage.getItem(url);
  if (cachedJson) {
    return JSON.parse(cachedJson);
  } else {
    const response = await fetch(url);
    const json = await response.json();
    localStorage.setItem(url, JSON.stringify(json));
    return json;
  }
}

if (localStorage.getItem("version") != version || localStorage.getItem("game_version") != game_version) {
  localStorage.clear();
  localStorage.setItem("version", version);
  localStorage.setItem("game_version", game_version);
}
