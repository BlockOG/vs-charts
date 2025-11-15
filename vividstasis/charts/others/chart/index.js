const { a, div, img, input, link, title, button } = van.tags;

const url = new URL(window.location);
if (!url.searchParams.has("chart") || !url.searchParams.has("diff")) window.location.href = "/vividstasis/charts/others";

const chart = url.searchParams.get("chart");
const difficulty = van.state(url.searchParams.get("diff"));
fetch("/vividstasis/charts/other_song_data.json").then((data) => {
    data.json().then((data) => {
        for (const song of data) {
            if (song.file_name !== chart || song.difficulty !== difficulty.val) continue;

            const scroll_speed = van.savedState("scroll-speed", 10.0, parseFloat);
            const pixels_per_second = van.derive(() => 100 + 20 * scroll_speed.val);

            const html = document.getElementById("html");
            const window_height = van.state(html.clientHeight);

            const scale = van.savedState("scale", 1, parseFloat);
            if (scale.val <= 0) scale.val = 1;

            const chart_duration = van.derive(() => song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val));
            const segments = van.derive(() => Math.ceil(chart_height.val / 65535));
            const scaled_chart_height = van.derive(() => Math.floor(chart_height.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            const show_bpm = van.savedState("show-bpm", false, (v) => v === "true");
            const bpm_splits = van.savedState("bpm-splits", 1, parseInt);
            const bpm_colors = van.savedState(
                "bpm-colors",
                ["7F7F7F7F", "FEFEFE7F", "E00B017F", "9A51DF7F", "0586E47F", , "BA6BD87F", , "E8B6367F", , , , "D24B8B7F", , , , "FEE66B7F"],
                JSON.parse,
                JSON.stringify
            );
            const bpm_image_url = van.state("");
            van.derive(() => {
                let flat_pixels = Array(chart_height.val).fill("00000000");

                for (let bpm_index = -1; bpm_index < song.bpm_changes.length; bpm_index++) {
                    let seconds_per_beat = 60 / (bpm_index < 0 ? song.bpm : song.bpm_changes[bpm_index][1]);
                    let start = bpm_index < 0 ? 0 : song.bpm_changes[bpm_index][0];
                    let end = bpm_index + 1 < song.bpm_changes.length ? song.bpm_changes[bpm_index + 1][0] : chart_duration.val;

                    for (let bpm_split = bpm_splits.val; bpm_split >= 1; bpm_split--) {
                        if (bpm_splits.val % bpm_split !== 0) continue;

                        let color = bpm_colors.val[bpm_split] ?? bpm_colors.val[0];
                        for (let time = start; time - 0.0001 <= end; time += seconds_per_beat / bpm_split) {
                            let pixel = Math.round(time * pixels_per_second.val);
                            if (pixel < 0 || pixel >= flat_pixels.length) continue;
                            flat_pixels[pixel] = color;
                        }
                    }
                }

                let pixels = Array.from({ length: 65535 }, () => []);
                for (let i = 0; i < flat_pixels.length; i++) {
                    pixels[i % 65535].push(flat_pixels[flat_pixels.length - 1 - i]);
                }

                fetch(createBMPDataUrl(pixels)).then((res) => res.blob().then((blob) => (bpm_image_url.val = URL.createObjectURL(blob))));
            });

            const upscroll = van.savedState("upscroll", false, (v) => v === "true");

            const column_split = van.savedState("column-split", false, (v) => v === "true");
            const column_split_reverse = van.savedState("column-split-reverse", false, (v) => v === "true");

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
                title(() => `${song.name} ${difficulty.val}`),
                link({ rel: "icon", type: "image/png", href: `/vividstasis/charts/jackets/${chart}.png` })
            );
            van.add(
                document.body,
                () => {
                    const get_chart = (height, offset) =>
                        div(
                            {
                                style: `display: flex; flex-direction: column; gap: 0px; margin-left: auto; margin-right: auto; width: ${93 * scale.val}px; height: ${
                                    height || scaled_chart_height.val
                                }px; rotate: ${upscroll.val * 180}deg; overflow: hidden; background: url(/vividstasis/charts/background.png); background-size: ${
                                    93 * scale.val
                                }px`,
                            },
                            Array.from({ length: segments.val }, (_, j) =>
                                div(
                                    {
                                        style: () => `transform: translate(${j * -93 * scale.val}px, ${offset || 0}px)`,
                                    },
                                    div(
                                        { style: () => `position: relative; height: ${65535 * scale.val}px` },
                                        img({
                                            style: () => `transform-origin: 0px 0px; transform: scale(${scale.val}); position: absolute`,
                                            src: `https://vividstasis-charts.blockog.net/${song.file_name}/${difficulty.val}-${scroll_speed.val.toFixed(1)}.png`,
                                        }),
                                        img({
                                            style: () =>
                                                `${show_bpm.val ? "" : "display: none; "}transform-origin: 0px 0px; transform: scaleX(93) scale(${
                                                    scale.val
                                                }); position: absolute`,
                                            src: bpm_image_url.val,
                                        })
                                    )
                                )
                            )
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
                            while (bpm_index < song.bpm_changes.length && time_in + curr_height / pixels_per_second.val + 0.0001 >= song.bpm_changes[bpm_index][0]) {
                                if (curr_height > 0) {
                                    if (curr_height > max_height) max_height = Math.round(curr_height);

                                    const split_height =
                                        Math.round(
                                            Math.min(
                                                curr_height,
                                                chart_height.val - time_in * pixels_per_second.val,
                                                (song.bpm_changes[bpm_index][0] - time_in) * pixels_per_second.val
                                            )
                                        ) * scale.val;

                                    image_times.push(time_in);
                                    images.push(
                                        div(get_chart(split_height, Math.round(time_in * pixels_per_second.val) * scale.val - scaled_chart_height.val + split_height))
                                    );

                                    curr_height = 0;
                                }

                                time_in = song.bpm_changes[bpm_index][0];
                                bpm = song.bpm_changes[bpm_index++][1];
                            }

                            const ppb = (pixels_per_second.val / bpm) * 60;
                            if (curr_height + ppb >= html.clientHeight / scale.val) {
                                if (curr_height > max_height) max_height = Math.round(curr_height);

                                const split_height = Math.round(Math.min(curr_height, chart_height.val - time_in * pixels_per_second.val)) * scale.val;

                                image_times.push(time_in);
                                images.push(
                                    div(get_chart(split_height, Math.round(time_in * pixels_per_second.val) * scale.val - scaled_chart_height.val + split_height))
                                );

                                time_in += curr_height / pixels_per_second.val;
                                curr_height = 0;
                            }

                            curr_height += ppb;
                        }

                        image_times.push(Math.min(time_in, chart_duration.val));

                        const image_width = 93 * scale.val;
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
                                style: () => `height: 100dvh; overflow-y: auto`,
                                onscroll: (v) => {
                                    current_time.val = (upscroll.val ? v.target.scrollTop : height - v.target.scrollTop) / scale.val / pixels_per_second.val;
                                },
                            },
                            get_chart()
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
                    { class: "column", style: "position: fixed; left: 8px; top: 8px" },
                    div(a({ href: "/vividstasis/charts/others" }, "Boundary Shatter charts")),
                    div(`Name: ${song.name}`),
                    () =>
                        div(
                            `BPM: ${(difficulty.val === 3 && song.backstage && song.backstage.bpm) || song.bpm} `,
                            input({
                                type: "checkbox",
                                checked: show_bpm,
                                oninput: (v) => (show_bpm.val = v.target.checked),
                            }),
                            show_bpm.val ? " Splits: " : undefined,
                            show_bpm.val
                                ? nonInterferingInput({
                                      type: "number",
                                      style: "text-align: right; width: 26px",
                                      value: () => bpm_splits.val,
                                      oninput: (v) => {
                                          v = parseInt(v.target.value);
                                          if (1 <= v) bpm_splits.val = v;
                                      },
                                  })
                                : undefined
                        ),
                    div(
                        "Scroll speed: ",
                        nonInterferingInput({
                            type: "number",
                            style: "text-align: right; width: 26px",
                            value: () => scroll_speed.val.toFixed(1),
                            oninput: (v) => {
                                v = Math.round(parseFloat(v.target.value) * 10) / 10;
                                if (1 <= v && v <= 20) scroll_speed.val = v;
                            },
                        })
                    ),
                    div(
                        "Scale: ",
                        nonInterferingInput({
                            type: "number",
                            style: "text-align: right; width: 26px",
                            value: scale,
                            oninput: (v) => {
                                if (parseFloat(v.target.value) > 0) scale.val = parseFloat(v.target.value);
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
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, parseFloat(v.target.value)));
                            },
                        }),
                        () => `/${chart_duration.val.toFixed(2)} (`,
                        nonInterferingInput({
                            type: "number",
                            style: "text-align: right; width: 40px",
                            value: () => current_percentage.val.toFixed(2),
                            oninput: (v) => {
                                if (v.target.value !== "")
                                    current_time.val = Math.max(0, Math.min(chart_duration.val, (parseFloat(v.target.value) / 100) * chart_duration.val));
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
                    )
                ),
                div(
                    { class: "column", style: "position: fixed; right: 8px; top: 8px" },
                    div(a({ href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214" }, "This tool was permitted by Cheryl."))
                )
            );

            window.history.replaceState(null, null, getURL());

            addEventListener("resize", () => {
                window_height.val = html.clientHeight;
            });

            return;
        }

        window.location.href = "/vividstasis/charts/others";
    });
});
