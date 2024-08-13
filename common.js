const version = "3.4.0.1";

function convertBlobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function cachedImageFetch(url) {
  const base64CachedImg = localStorage.getItem(url);
  if (base64CachedImg) {
    const response = await fetch(base64CachedImg);
    const blob = await response.blob();
    return await createImageBitmap(blob);
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    const base64String = await convertBlobToBase64(blob);
    localStorage.setItem(url, base64String);
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

if (localStorage.getItem("version") != version) {
  console.log("clearing outdated cache");
  localStorage.clear();
  localStorage.setItem("version", version);
}
