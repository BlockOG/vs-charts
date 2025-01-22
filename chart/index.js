const { a, button, div, img, input, link, span, title } = van.tags;

const url = new URL(window.location);
if (!url.searchParams.has("chart")) window.location.href = "/vs-charts";

const chart = url.searchParams.get("chart");
fetch("/vs-charts/song_data.json").then((data) => {
    data.json().then((data) => {
        for (const song of data) {
            if (song.file_name !== chart) continue;

            const difficulty = van.state(parseInt(url.searchParams.get("diff")) || 0);

            const scroll_speed = van.state(10.0);
            const pixels_per_second = van.derive(() => 100 + 20 * scroll_speed.val);

            const html = document.getElementById("html");
            const window_height = van.state(html.clientHeight);

            const scale = van.savedState("scale", 1, parseFloat);
            if (scale.val <= 0) scale.val = 1;

            const chart_duration = van.derive(() => (difficulty.val === 3 && song.encore_duration) || song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            const upscroll = van.savedState("upscroll", false, (v) => v === "true");

            const column_split = van.savedState("column-split", false, (v) => v === "true");
            const column_split_reverse = van.savedState("column-split-reverse", false, (v) => v === "true");

            const score_rating_switch_selection = van.state(true);

            const score_rating_score = van.state(0);
            const score_rating_selection = van.state(0);

            const rating_score_rating = van.state(0);

            van.add(
                document.head,
                title(() => `${song.name} ${difficulty_names[difficulty.val]} ${song.difficulties[difficulty.val].toFixed(1)}`),
                link({ rel: "icon", type: "image/png", href: `/vs-charts/jackets/${chart}.png` })
            );
            van.add(
                document.body,
                () => {
                    window_height.val;
                    if (column_split.val) {
                        const ppb = (pixels_per_second.val / song.bpm) * 60;
                        const split_height = Math.max(Math.floor(html.clientHeight / ppb), 1) * ppb;
                        const num_splits = Math.ceil(chart_height.val / split_height);
                        const width = (93 * scale.val + 50) * (num_splits - 1);

                        const images = Array.from({ length: num_splits }, (_, i) =>
                            img({
                                class: "chart-image",
                                style: `width: ${91 * scale.val}px; height: ${split_height}px; rotate: ${
                                    upscroll.val * 180
                                }deg; border-left-width: ${scale.val}px; border-right-width: ${
                                    scale.val
                                }px; object-fit: cover; object-position: left 0px bottom ${-split_height * i}px; aspect-ratio: ${
                                    (91 * scale.val) / scale.val
                                }`,
                                src: `/vs-charts/charts/${chart}/${difficulty_names[difficulty.val]}.png`,
                            })
                        );

                        if (column_split_reverse.val) images.reverse();

                        const scroll_div = div(
                            {
                                style: "max-width: 100dvw; overflow-x: auto",
                                onscroll: (v) => {
                                    current_time.val =
                                        (column_split_reverse.val ? 1 - v.target.scrollLeft / width : v.target.scrollLeft / width) *
                                        chart_duration.val;
                                },
                            },
                            div(
                                {
                                    class: "row",
                                    style: `width: ${width + 93 * scale.val}px; gap: 50px; padding: calc(50dvh - ${
                                        split_height / 2
                                    }px) calc(50dvw - ${(93 * scale.val) / 2}px)`,
                                },
                                images
                            )
                        );

                        van.derive(() => {
                            current_time.val, chart_duration.val, scale.val, column_split_reverse.val;
                            requestAnimationFrame(() => {
                                const scroll = (current_time.val / chart_duration.val) * width;
                                scroll_div.scrollLeft = column_split_reverse.val ? width - scroll : scroll;
                            });
                        });

                        return scroll_div;
                    } else {
                        const height = chart_height.val * scale.val - html.clientHeight;

                        const scroll_div = div(
                            {
                                style: `height: 100dvh; overflow-y: auto`,
                                onscroll: (v) => {
                                    current_time.val =
                                        (upscroll.val ? v.target.scrollTop : height - v.target.scrollTop) /
                                        scale.val /
                                        pixels_per_second.val;
                                },
                            },
                            img({
                                class: "chart-image",
                                style: `width: ${91 * scale.val}px; height: ${chart_height.val}px; rotate: ${
                                    upscroll.val * 180
                                }deg; border-left-width: ${scale.val}px; border-right-width: ${scale.val}px`,
                                src: `/vs-charts/charts/${chart}/${difficulty_names[difficulty.val]}.png`,
                            })
                        );

                        van.derive(() => {
                            current_time.val, pixels_per_second.val, scale.val, upscroll.val;
                            requestAnimationFrame(() => {
                                const scroll = current_time.val * pixels_per_second.val * scale.val;
                                scroll_div.scrollTop = upscroll.val ? scroll : height - scroll;
                            });
                        });

                        return scroll_div;
                    }
                },
                div(
                    { class: "top-left column" },
                    div(a({ href: "/vs-charts" }, "All charts")),
                    div(`Name: ${song.name}`),
                    div(`BPM: ${song.bpm}`),
                    div(
                        "Scroll speed: ",
                        input({ type: "number", class: "right-aligned", style: "width: 26px", value: scroll_speed, disabled: true })
                    ),
                    div(
                        "Scale: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 26px",
                            value: scale,
                            oninput: (v) => {
                                if (v.target.value > 0) scale.val = v.target.value;
                            },
                        })
                    ),
                    div(
                        "Upscroll: ",
                        input({
                            type: "checkbox",
                            checked: upscroll,
                            oninput: (v) => (upscroll.val = v.target.checked),
                        })
                    ),
                    () =>
                        div(
                            "Column split: ",
                            input({
                                type: "checkbox",
                                checked: column_split,
                                oninput: (v) => (column_split.val = v.target.checked),
                            }),
                            column_split.val ? " Reverse: " : undefined,
                            column_split.val
                                ? input({
                                      type: "checkbox",
                                      checked: column_split_reverse,
                                      oninput: (v) => (column_split_reverse.val = v.target.checked),
                                  })
                                : undefined
                        ),
                    div(
                        "Time: ",
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 40px",
                            value: () => current_time.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, v.target.value));
                            },
                        }),
                        () => `/${chart_duration.val.toFixed(2)} (`,
                        nonInterferingInput({
                            type: "number",
                            class: "right-aligned",
                            style: "width: 40px",
                            value: () => current_percentage.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "")
                                    current_time.val = Math.max(
                                        0,
                                        Math.min(chart_duration.val, (v.target.value / 100) * chart_duration.val)
                                    );
                            },
                        }),
                        "%)"
                    ),
                    div(
                        { class: "row" },
                        song.difficulties.map((_, i) =>
                            button(
                                {
                                    onclick: () => {
                                        difficulty.val = i;
                                    },
                                    disabled: () => difficulty.val === i,
                                },
                                ["OP", "MD", "FN", "EN"][i]
                            )
                        )
                    ),
                    div(
                        "Level: ",
                        span({ class: () => `${difficulty_names[difficulty.val]}-text` }, () =>
                            song.difficulties[difficulty.val].toFixed(1)
                        )
                    ),
                    div(
                        "Score ",
                        button(
                            {
                                id: "score-rating-switch",
                                onclick: () => (score_rating_switch_selection.val = !score_rating_switch_selection.val),
                            },
                            () => (score_rating_switch_selection.val ? "->" : "<-")
                        ),
                        " Rating"
                    ),
                    div(
                        {
                            id: "score-rating",
                            class: "column",
                            style: () => (score_rating_switch_selection.val ? "" : "display: none"),
                        },
                        div(
                            { class: "row" },
                            input({
                                type: "number",
                                class: "right-aligned",
                                style: "width: 51px",
                                value: score_rating_score,
                                oninput: (v) => (score_rating_score.val = v.target.value),
                            }),
                            ["NA", "FC", "AC"].map((v, i) =>
                                button(
                                    {
                                        onclick: () => (score_rating_selection.val = i),
                                        disabled: () => score_rating_selection.val === i,
                                    },
                                    v
                                )
                            )
                        ),
                        div(
                            { class: "row" },
                            () =>
                                `${ratingFromScore(
                                    song.difficulties[difficulty.val],
                                    score_rating_score.val,
                                    score_rating_selection.val
                                ).toFixed(2)} rating`
                        )
                    ),
                    div(
                        {
                            id: "rating-score",
                            class: "column",
                            style: () => (score_rating_switch_selection.val ? "display: none" : ""),
                        },
                        div(
                            { class: "row" },
                            input({
                                type: "number",
                                class: "right-aligned",
                                style: "width: 37px",
                                value: rating_score_rating,
                                oninput: (v) => (rating_score_rating.val = v.target.value),
                            })
                        ),
                        ["NA", "FC", "AC"].map((v, i) =>
                            div(
                                {
                                    class: "row",
                                    style: () =>
                                        scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i) === undefined
                                            ? "display: none"
                                            : "",
                                },
                                () => `${v}: ${scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i)} score`
                            )
                        )
                    )
                ),
                div(
                    { class: "top-right column" },
                    div(
                        a(
                            { href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214" },
                            "This tool was permitted by Cheryl."
                        )
                    )
                )
            );

            function changeURL() {
                const url = new URL(window.location);
                url.search = "";
                url.searchParams.set("chart", chart);
                url.searchParams.set("diff", difficulty.val);
                url.searchParams.set("time", current_time.val.toFixed(2));
                window.history.replaceState(null, null, url);

                setTimeout(changeURL, 200);
            }

            changeURL();

            window.addEventListener("resize", () => {
                window_height.val = html.clientHeight;
            });

            return;
        }

        window.location.href = "/vs-charts";
    });
});
