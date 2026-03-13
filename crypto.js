const MODES = {
    'STRONG': {
        'hash-key-size': 16,
        'password-length': 24,
        'iterations': 1_000_000
    },
    'ULTRA': {
        'hash-key-size': 88,
        'password-length': 120,
        'iterations': 5_000_000
    }
}


async function generate_mnemonic_12(){
    const crypto = get_crypto();
    const entropy = new Uint8Array(16);
    crypto.getRandomValues(entropy);
    const hashed = await sha256Bytes(entropy);
    const checksum = hashed[0] >> 4;

    let bits = '';
    for (const b of entropy)
        bits += b.toString(2).padStart(8, '0');
    bits += checksum.toString(2).padStart(4, '0');

    // split into 12 indexes, each is 11 bits
    const words = new Array(12);
    for (let i = 0; i < 12; i++) {
        const slice = bits.slice(i * 11, i * 11 + 11);
        const idx = parseInt(slice, 2);
        words[i] = WORDLIST[idx];
    }
    return words.join(' ');
}


function is_seed_valid(seed) {
    // Length is ok
    if ((seed.match(/\s/g) || []).length !== 11)
        return false;
    const words = seed.split(/\s+/);
    if (words.length !== 12)
        return false;
    // Words are eligible
    return words.every(word => word in INDEXED_WORDLIST);
}

function get_crypto(){
    const cryptoObj = (globalThis && (globalThis.crypto || globalThis.msCrypto));
    if (!cryptoObj || !cryptoObj.subtle || !cryptoObj.subtle.digest) {
        throw new Error('Web Crypto API not available: crypto.subtle.digest is required for SHA-256');
    }
    return cryptoObj;
}

// --- SHA-256 helpers (browser-safe via Web Crypto) ---
// Compute SHA-256 digest of input and return bytes (Uint8Array)
async function sha256Bytes(data) {
    const cryptoObj = get_crypto();
    const digest = await cryptoObj.subtle.digest('SHA-256', data.buffer ? data.buffer : data);
    return new Uint8Array(digest);
}

// Convert 132-bit integer to 17-byte big-endian array
function bigintToBytesBE(n, length) {
    const out = new Uint8Array(length);
    for (let i = length - 1; i >= 0; i--) {
        out[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return out;
}

function mnemonic_to_integer(seed) {
    /*
        Convert a 12-word BIP-39 seed phrase to its 16-byte entropy +
        1-byte checksum = 17-byte vector.
     */
    const indices = seed.split(/\s+/).map(word => INDEXED_WORDLIST[word]);
    if (indices.length !== 12)
        throw new Error("Exactly 12 words required");
    
    // 132-bit concatenation
    const bit_str = indices.map(i => i.toString(2).padStart(11, '0')).join('');  // 132 bits
    return BigInt('0b' + bit_str);
    // return bigintToBytesBE(entropy_int, 17);
}

async function is_checksum_valid(seed) {
    const seed_int = mnemonic_to_integer(seed);
    const checksum = seed_int & 0xfn;
    const entropy_int = seed_int >> 4n;

    const entropy = bigintToBytesBE(entropy_int, 16);
    return BigInt((await sha256Bytes(entropy))[0]) >> 4n === checksum;
}


/**
 * @param {Uint8Array<ArrayBuffer>} key
 * @param {Uint8Array<ArrayBuffer>} salt
 * @param {number} keySize
 * @param {number} iterations
 * @returns {Promise<ArrayBuffer>}
 */
async function generate_key(key, salt, keySize, iterations){
    const cryptoObj = get_crypto();
    const keyMaterial = await cryptoObj.subtle.importKey(
        "raw",
        key,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
    );

    return await cryptoObj.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-512",
        },
        keyMaterial,
        keySize
    );
}

/**
 *
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function humanize(buffer){
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    let password = btoa(binary);
    password = password.replace(/\+/g, '*').replace(/\//g, '_').replace(/=/g, '-');
    return password;
}

/**
 * @param {bigint} seed
 * @param {string} passphrase
 * @param {string} service
 * @param {string} year
 * @param {string} quarter
 * @param {string} mode
 * @param {number|null} key_size_override
 * @param {number|null} iterations_override
 * @returns {Promise<string>}
 */
async function generate_password(seed, passphrase, service, year, quarter, mode, key_size_override=null, iterations_override=null){
    const enc = new TextEncoder();
    const seedBytes = bigintToBytesBE(seed, 17);
    quarter = quarter === '' ? quarter : `q${quarter}`;
    const meta = `${service}${year}${quarter}`;
    const salt = enc.encode((passphrase+meta).padEnd(16, '*'));

    const key_size = key_size_override ?? MODES[mode]['hash-key-size'] * 8;
    const iterations = iterations_override ?? MODES[mode]['iterations'];

    const derived = await generate_key(seedBytes, salt, key_size, iterations);
    const password = humanize(derived);

    return password;
}

async function generate_clicked(){
    const $ = (s) => document.querySelector(s);

    const seedPhrase = $('#seed').value.trim().toLocaleLowerCase();
    const passPhrase = $('#passphrase').value.trim();
    const year = $('#year').value.trim();
    const quarter = $('input[name="quarter"]:checked').value.trim();
    const mode = $('input[name="mode"]:checked').value;
    const service = $('#service').value.trim();

    const seedInt = mnemonic_to_integer(seedPhrase);

    return await generate_password(seedInt, passPhrase, service, year, quarter, mode);
}