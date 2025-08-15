const { a, button, div, img, input, link, span, title } = van.tags;

const url = new URL(window.location);
if (!url.searchParams.has("chart")) window.location.href = "/vividstasis/charts";

const chart = url.searchParams.get("chart");
fetch("/vividstasis/charts/song_data.json").then((data) => {
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

            const chart_duration = van.derive(() => (difficulty.val === 3 && song.backstage && song.backstage.duration) || song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val));
            const scaled_chart_height = van.derive(() => Math.floor(chart_height.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            const show_bpm = van.savedState("show-bpm", false, (v) => v === "true");

            const upscroll = van.savedState("upscroll", false, (v) => v === "true");

            const column_split = van.savedState("column-split", false, (v) => v === "true");
            const column_split_reverse = van.savedState("column-split-reverse", false, (v) => v === "true");

            const score_rating_switch_selection = van.state(true);

            const score_rating_score = van.state(0);
            const score_rating_selection = van.state(0);

            const rating_score_rating = van.state(0);

            const getURL = (save_time) => {
                const url = new URL(window.location);
                url.search = "";
                url.searchParams.set("chart", chart);
                url.searchParams.set("diff", difficulty.val);
                if (save_time) url.searchParams.set("time", current_time.val.toFixed(2));

                return url;
            };

            van.add(
                document.head,
                title(
                    () =>
                        `${(difficulty.val === 3 && song.backstage && song.backstage.name) || song.name} ${
                            difficulty_names[difficulty.val + (difficulty.val === 3 && song.backstage !== undefined)]
                        } ${song.difficulties[difficulty.val].toFixed(1)}`
                ),
                link({
                    rel: "icon",
                    type: "image/png",
                    href: () => `/vividstasis/charts/jackets/${chart}${difficulty.val === 3 && song.backstage ? "_backstage" : ""}.png`,
                })
            );
            van.add(
                document.body,
                () => {
                    const get_chart_segments = () =>
                        Array.from({ length: Math.ceil(chart_height.val / 65535) }, (_, j) =>
                            img({
                                src: `/vividstasis/charts/charts/${song.file_name}/${difficulty_names[difficulty.val]}${show_bpm.val ? "-bpm" : ""}-${j}.png`,
                            })
                        );

                    window_height.val;
                    if (column_split.val) {
                        let bpm = song.bpm;
                        let bpm_index = 0;
                        let time_in = 0;
                        let curr_height = 0;
                        let max_height = 0;
                        const images = [];
                        const image_times = [];

                        while (time_in < chart_duration.val) {
                            while (
                                bpm_index < song.bpm_changes[difficulty.val].length &&
                                time_in + curr_height / pixels_per_second.val + 0.0001 >= song.bpm_changes[difficulty.val][bpm_index][0]
                            ) {
                                if (curr_height > 0) {
                                    if (curr_height > max_height) max_height = Math.floor(curr_height);

                                    const split_height =
                                        Math.floor(
                                            Math.min(
                                                curr_height,
                                                chart_height.val - time_in * pixels_per_second.val,
                                                (song.bpm_changes[difficulty.val][bpm_index][0] - time_in) * pixels_per_second.val
                                            )
                                        ) * scale.val;

                                    image_times.push(time_in);
                                    images.push(
                                        div(
                                            {
                                                style: `margin-left: auto; margin-right: auto; width: ${93 * scale.val}px; height: ${split_height}px; rotate: ${
                                                    upscroll.val * 180
                                                }deg; overflow: hidden;`,
                                            },
                                            div(
                                                {
                                                    style: `display: flex; flex-direction: column; gap: 0px; transform: translateY(${
                                                        Math.floor(time_in * pixels_per_second.val) * scale.val - scaled_chart_height.val + split_height
                                                    }px)`,
                                                },
                                                get_chart_segments()
                                            )
                                        )
                                    );

                                    curr_height = 0;
                                }

                                time_in = song.bpm_changes[difficulty.val][bpm_index][0];
                                bpm = song.bpm_changes[difficulty.val][bpm_index++][1];
                            }

                            const ppb = (pixels_per_second.val / bpm) * 60;
                            if (curr_height + ppb >= html.clientHeight / scale.val) {
                                if (curr_height > max_height) max_height = Math.floor(curr_height);

                                const split_height = Math.floor(Math.min(curr_height, chart_height.val - time_in * pixels_per_second.val)) * scale.val;

                                image_times.push(time_in);
                                images.push(
                                    div(
                                        {
                                            style: `margin-left: auto; margin-right: auto; width: ${93 * scale.val}px; height: ${split_height}px; rotate: ${
                                                upscroll.val * 180
                                            }deg; overflow: hidden;`,
                                        },
                                        div(
                                            {
                                                style: `display: flex; flex-direction: column; gap: 0px; transform: translateY(${
                                                    Math.floor(time_in * pixels_per_second.val) * scale.val - scaled_chart_height.val + split_height
                                                }px)`,
                                            },
                                            get_chart_segments()
                                        )
                                    )
                                );

                                time_in += curr_height / pixels_per_second.val;
                                curr_height = 0;
                            }

                            curr_height += ppb;
                        }

                        image_times.push(Math.min(time_in, chart_duration.val));

                        const image_width = 93 * scale.val + 2 * Math.max(1, scale.val);
                        const width = (image_width + 50) * (images.length - 1);

                        if (column_split_reverse.val) images.reverse();

                        const scroll_div = div(
                            {
                                style: "max-width: 100dvw; overflow-x: auto",
                                onscroll: (v) => {
                                    const scroll = column_split_reverse.val ? width - v.target.scrollLeft : v.target.scrollLeft;
                                    const i = Math.floor(scroll / (image_width + 50));
                                    const t = (scroll % (image_width + 50)) / (image_width + 50);
                                    current_time.val = image_times[i] + t * (image_times[i + 1] - image_times[i]);
                                },
                            },
                            div(
                                {
                                    class: "row",
                                    style: `width: ${width + image_width}px; gap: 50px; padding: calc(50dvh - ${(max_height * scale.val) / 2}px) calc(50dvw - ${
                                        image_width / 2
                                    }px); align-items: ${upscroll.val ? "start" : "end"}`,
                                },
                                images
                            )
                        );

                        van.derive(() => {
                            current_time.val, chart_duration.val, scale.val, column_split_reverse.val;
                            requestAnimationFrame(() => {
                                for (let i = 0; i < image_times.length - 1; i++) {
                                    if (image_times[i] <= current_time.val && current_time.val < image_times[i + 1]) {
                                        const t = (current_time.val - image_times[i]) / (image_times[i + 1] - image_times[i]);
                                        const scroll = (i + t) * (image_width + 50);
                                        scroll_div.scrollLeft = column_split_reverse.val ? width - scroll : scroll;

                                        break;
                                    }
                                }
                            });
                        });

                        return scroll_div;
                    } else {
                        const height = scaled_chart_height.val - html.clientHeight;

                        const scroll_div = div(
                            {
                                style: `height: 100dvh; overflow-y: auto`,
                                onscroll: (v) => {
                                    current_time.val = (upscroll.val ? v.target.scrollTop : height - v.target.scrollTop) / scale.val / pixels_per_second.val;
                                },
                            },
                            div(
                                {
                                    style: `display: flex; flex-direction: column; gap: 0px; margin-left: auto; margin-right: auto; width: ${93 * scale.val}px; height: ${
                                        scaled_chart_height.val
                                    }px; rotate: ${upscroll.val * 180}deg`,
                                },
                                get_chart_segments()
                            )
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
                    { class: "column", style: "position: fixed; left: 8px; top: 8px;" },
                    div(a({ href: "/vividstasis/charts" }, "All charts")),
                    div(() => `Name: ${(difficulty.val === 3 && song.backstage && song.backstage.name) || song.name}`),
                    div(
                        () => `BPM: ${(difficulty.val === 3 && song.backstage && song.backstage.bpm) || song.bpm} `,
                        input({
                            type: "checkbox",
                            checked: show_bpm,
                            oninput: (v) => (show_bpm.val = v.target.checked),
                        })
                    ),
                    div("Scroll speed: ", input({ type: "number", style: "text-align: right; width: 26px", value: scroll_speed, disabled: true })),
                    div(
                        "Scale: ",
                        nonInterferingInput({
                            type: "number",
                            style: "text-align: right; width: 26px",
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
                            style: "text-align: right; width: 40px",
                            value: () => current_time.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, v.target.value));
                            },
                        }),
                        () => `/${chart_duration.val.toFixed(2)} (`,
                        nonInterferingInput({
                            type: "number",
                            style: "text-align: right; width: 40px",
                            value: () => current_percentage.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, (v.target.value / 100) * chart_duration.val));
                            },
                        }),
                        "%)"
                    ),
                    div(
                        button(
                            {
                                onclick: () => navigator.clipboard.writeText(getURL(true).href),
                            },
                            "Copy link at time"
                        )
                    ),
                    div(
                        { class: "row" },
                        song.difficulties.map((_, i) =>
                            button(
                                {
                                    onclick: () => {
                                        difficulty.val = i;
                                        window.history.replaceState(null, null, getURL());
                                    },
                                    disabled: () => difficulty.val === i,
                                },
                                ["OP", "MD", "FN", song.backstage ? "BS" : "EN"][i]
                            )
                        )
                    ),
                    div(
                        "Level: ",
                        span({ class: () => `${difficulty_names[difficulty.val + (difficulty.val === 3 && song.backstage !== undefined)]}-text` }, () =>
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
                            () => `${ratingFromScore(song.difficulties[difficulty.val], score_rating_score.val, score_rating_selection.val).toFixed(2)} rating`
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
                                    style: () => (scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i) === undefined ? "display: none" : ""),
                                },
                                () => `${v}: ${scoreFromRating(song.difficulties[difficulty.val], rating_score_rating.val, i)} score`
                            )
                        )
                    )
                ),
                div(
                    { class: "column", style: "position: fixed; right: 8px; top: 8px;" },
                    div(a({ href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214" }, "This tool was permitted by Cheryl."))
                )
            );

            window.history.replaceState(null, null, getURL());

            window.addEventListener("resize", () => {
                window_height.val = html.clientHeight;
            });

            return;
        }

        window.location.href = "/vividstasis/charts";
    });
});
