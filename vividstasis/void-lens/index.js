const { div, img } = van.tags;

const locations = ["melody_room", "mountain_long_corridor", "fishing_area", "sentinel_room", "layer_2_south", "layer_2_west", "grotto"];

function void_lens_location(vtc) {
    vtc = BigInt(vtc);
    const rand_state = [];
    for (let i = 0; i < 16; i++) {
        vtc = ((vtc * 214013n + 2531011n) & 0xffffffffn) >> 16n;
        rand_state[i] = vtc;
    }

    let a, b, c, rand_a, rand_b;

    a = ((((rand_state[0] * 2n) ^ rand_state[13]) << 15n) ^ rand_state[13] ^ rand_state[0]) & 0xffffffffn;
    b = rand_state[9];
    b = b ^ (b >> 11n);
    c = a ^ b;
    rand_a = (rand_state[15] ^ (((((b << 10n) ^ a) << 16n) ^ rand_state[15]) << 2n) ^ ((c & 4275183977n) << 5n) ^ c ^ a) & 0xffffffffn;

    rand_state[0] = c;
    rand_state[15] = rand_a;

    a = ((((rand_state[15] * 2n) ^ rand_state[12]) << 15n) ^ rand_state[12] ^ rand_state[15]) & 0xffffffffn;
    b = rand_state[8];
    b = b ^ (b >> 11n);
    c = a ^ b;
    rand_b = (rand_state[14] ^ (((((b << 10n) ^ a) << 16n) ^ rand_state[14]) << 2n) ^ ((c & 4275183977n) << 5n) ^ c ^ a) & 0xffffffffn;

    rand_state[15] = c;
    rand_state[14] = rand_b;

    return (((rand_b << 32n) | rand_a) & 0x7fffffffffffffffn) % 7n;
}

const VTC_EPOCH = new Date("2000-01-01T00:00:00Z").getTime();
const VTC_DUR = 1850 * 1000;

function vtc_from_time(time) {
    return Math.floor((time - VTC_EPOCH) / VTC_DUR);
}

function time_from_vtc(vtc) {
    return VTC_EPOCH + VTC_DUR * vtc;
}

const time = van.state(new Date());
const vtc = van.derive(() => vtc_from_time(time.val));
const next_vtc_time = van.derive(() => new Date(time_from_vtc(vtc.val + 1)));
const void_lens_location_img = van.derive(() => `locations/${locations[void_lens_location(vtc.val)]}.png`);

van.add(
    document.body,
    div(() => `Current time: ${time.val}`),
    div(() => `Current VTC: ${vtc.val}`),
    div(() => `Next VTC at: ${next_vtc_time.val}`),
    img({ style: "border: 1px solid white", src: () => void_lens_location_img.val })
);

function update() {
    time.val = new Date();
    setTimeout(update, 100);
}

update();
