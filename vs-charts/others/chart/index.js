const { a, div, img, input, link, title } = van.tags;

const url = new URL(window.location);
if (!url.searchParams.has("chart") || !url.searchParams.has("diff")) window.location.href = "/vs-charts/others";

const chart = url.searchParams.get("chart");
const difficulty = van.state(url.searchParams.get("diff"));
fetch("/vs-charts/other_song_data.json").then((data) => {
    data.json().then((data) => {
        for (const song of data) {
            if (song.file_name !== chart || song.difficulty !== difficulty.val) continue;

            const scroll_speed = van.state(10.0);
            const pixels_per_second = van.derive(() => 100 + 20 * scroll_speed.val);

            const html = document.getElementById("html");
            const window_height = van.state(html.clientHeight);

            const scale = van.savedState("scale", 1, parseFloat);
            if (scale.val <= 0) scale.val = 1;

            const chart_duration = van.derive(() => song.duration);
            const chart_height = van.derive(() => Math.floor(chart_duration.val * pixels_per_second.val * scale.val));
            const current_time = van.state(parseFloat(url.searchParams.get("time")) || 0);
            const current_percentage = van.derive(() => (current_time.val / chart_duration.val) * 100);

            const upscroll = van.savedState("upscroll", false, (v) => v === "true");

            const column_split = van.savedState("column-split", false, (v) => v === "true");
            const column_split_reverse = van.savedState("column-split-reverse", false, (v) => v === "true");

            van.add(
                document.head,
                title(() => `${song.name} ${difficulty.val}`),
                link({ rel: "icon", type: "image/png", href: `/vs-charts/jackets/${chart}.png` })
            );
            van.add(
                document.body,
                () => {
                    window_height.val;
                    if (column_split.val) {
                        const ppb = (pixels_per_second.val / song.bpm) * 60;
                        const split_height = Math.max(Math.floor((html.clientHeight - 20) / ppb), 1) * ppb;
                        const num_splits = Math.ceil(chart_height.val / split_height);
                        const width = (93 * scale.val + 50) * (num_splits - 1);

                        const images = Array.from({ length: num_splits }, (_, i) =>
                            div(
                                {
                                    class: "chart-image",
                                    style: `width: ${91 * scale.val}px; height: ${split_height}px; rotate: ${upscroll.val * 180}deg; border-left-width: ${
                                        scale.val
                                    }px; border-right-width: ${scale.val}px; overflow: vs-charts;`,
                                },
                                Array.from({ length: Math.ceil(chart_height.val / 65535) }, (_, j) =>
                                    img({
                                        style: `transform: translate(0px, ${split_height * (i + 1) - chart_height.val}px)`,
                                        src: `/vs-charts/charts/${song.file_name}/${difficulty.val}-${j}.png`,
                                    })
                                )
                            )
                        );

                        if (column_split_reverse.val) images.reverse();

                        let scroll_div = div(
                            {
                                style: "max-width: 100dvw; overflow-x: auto",
                                onscroll: (v) => {
                                    current_time.val = (column_split_reverse.val ? 1 - v.target.scrollLeft / width : v.target.scrollLeft / width) * chart_duration.val;
                                },
                            },
                            div(
                                {
                                    class: "row",
                                    style: `width: ${width + 93 * scale.val}px; gap: 50px; padding: calc(50dvh - ${split_height / 2}px) calc(50dvw - ${
                                        (93 * scale.val) / 2
                                    }px)`,
                                },
                                images
                            )
                        );

                        van.derive(() => {
                            current_time.val, chart_duration.val, scale.val, column_split_reverse.val;
                            requestAnimationFrame(() => {
                                let scroll = (current_time.val / chart_duration.val) * width;
                                scroll_div.scrollLeft = column_split_reverse.val ? width - scroll : scroll;
                            });
                        });

                        return scroll_div;
                    } else {
                        const height = chart_height.val * scale.val - html.clientHeight;

                        const scroll_div = div(
                            {
                                style: "height: 100dvh; overflow: auto",
                                onscroll: (v) => {
                                    current_time.val = (upscroll.val ? v.target.scrollTop : height - v.target.scrollTop) / scale.val / pixels_per_second.val;
                                },
                            },
                            div(
                                {
                                    class: "chart-image",
                                    style: `width: ${91 * scale.val}px; height: ${chart_height.val}px; rotate: ${upscroll.val * 180}deg; border-left-width: ${
                                        scale.val
                                    }px; border-right-width: ${scale.val}px`,
                                },
                                Array.from({ length: Math.ceil(chart_height.val / 65535) }, (_, i) =>
                                    img({ src: `/vs-charts/charts/${song.file_name}/${difficulty.val}-${i}.png` })
                                )
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
                    { class: "top-left column" },
                    div(a({ href: "/vs-charts/others" }, "Boundary Shatter charts")),
                    div(`Name: ${song.name}`),
                    div(`BPM: ${song.bpm}`),
                    div("Scroll speed: ", input({ type: "number", class: "right-aligned", style: "width: 26px", value: scroll_speed, disabled: true })),
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
                                if (v.target.value !== "") current_time.val = Math.max(0, Math.min(chart_duration.val, (v.target.value / 100) * chart_duration.val));
                            },
                        }),
                        "%)"
                    )
                ),
                div(
                    { class: "top-right column" },
                    div(a({ href: "https://discord.com/channels/828252123154219028/954952378132611114/1272585937183965214" }, "This tool was permitted by Cheryl."))
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

            addEventListener("resize", () => {
                window_height.val = html.clientHeight;
            });

            return;
        }

        window.location.href = "/vs-charts/others";
    });
});
