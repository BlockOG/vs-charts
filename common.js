const game_version = "3.4.0.1";
const version = "1.0.2";

async function cachedImageFetch(url) {
  const imgWidthData = localStorage.getItem(url);
  if (imgWidthData) {
    const firstComma = imgWidthData.indexOf(",");
    const width = parseInt(imgWidthData.slice(0, firstComma));

    const imgDataString = imgWidthData.slice(firstComma + 1);
    const data = new Uint8ClampedArray(imgDataString.length);
    for (let i in imgDataString) data[i] = imgDataString.charCodeAt(i);

    const imgData = new ImageData(data, width);
    return await createImageBitmap(imgData);
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const image = await createImageBitmap(blob);

    const canv = new OffscreenCanvas(image.width, image.height);
    const ctx = canv.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, image.width, image.height);
    try {
      localStorage.setItem(
        url,
        `${image.width},${Array.from(imgData.data)
          .map((i) => String.fromCharCode(i))
          .join("")}`,
      );
    } catch (e) {
      window.location.reload();
    }
    delete imgData;
    delete ctx;
    delete canv;

    return image;
  }
}

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
  console.log("clearing outdated cache");
  localStorage.clear();
  localStorage.setItem("version", version);
  localStorage.setItem("game_version", game_version);
}
