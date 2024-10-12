const difficulty_colors = [0x1aff55, 0x1ab9ff, 0xff1a4a, 0xc342ff];
const difficulty_names = ["opening", "middle", "finale", "encore"];

function ratingFromScore(cc, score, bonus) {
    let res = -Infinity;
    if (1008000 < score) res = 2000;
    else if (1000000 < score) res = 1500 + (500 * (score - 1000000)) / 8000;
    else if (980000 < score) res = 1000 + (500 * (score - 980000)) / 20000;
    else if (950000 < score) res = (1000 * (score - 950000)) / 30000;
    else if (600000 < score) res = -7000 + (7000 * (score - 600000)) / 350000;

    return Math.max(0, cc * 1000 + res - 500) + bonus * 250;
}

function scoreFromRating(cc, rating, bonus) {
    if (rating < 0) return;
    else if (rating == 0) return 0;

    rating -= Math.max(0, cc * 1000 - 500) + bonus * 250;

    let res = 0;
    if (2000 < rating) return;
    else if (1500 < rating) res = 1000000 + (8000 * (rating - 1500)) / 500;
    else if (1000 < rating) res = 980000 + (20000 * (rating - 1000)) / 500;
    else if (0 < rating) res = 950000 + (30000 * rating) / 1000;
    else if (-7000 < rating) res = 600000 + (350000 * (rating - -7000)) / 7000;
    else return;

    return res;
}
