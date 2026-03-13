const cryptoObj = require('node:crypto');
globalThis.crypto = cryptoObj.webcrypto;

// Loading source files directly.
// Since they are not ES modules or CommonJS, we can execute them with `eval`.
// This is not the cleanest way but common for simple browser-based JS projects.
const fs = require('fs');
const path = require('path');

function loadScript(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    // Forcing functions/variables into global scope
    const vm = require('vm');
    vm.runInNewContext(code, global);
}

loadScript(path.resolve(__dirname, '..', 'crypto.js'));

// seed mnemonic:
// spice rapid hub ten face funny boil hope future rhythm scheme movie
SEED = 4457419962331937427314377610565619035271n;

function loadTestData() {
    const csvPath = path.resolve(__dirname, path.resolve(__dirname, 'tests_data.csv'));
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');

    // Skip header row and parse data rows
    return lines.slice(1).map(line => {
        const [seed, passphrase, service, year, quarter, mode, shouldResult] = line.slice(1, -2).split('","');
        return [
            BigInt(seed.trim()),
            passphrase.trim(),
            service.trim(),
            year.trim(),
            quarter.trim(),
            mode.trim(),
            shouldResult.trim()
        ];
    });
}

test('simple test', async () => {
    const seed = SEED;
    const passPhrase = 'qwerty';
    const service = 'yahoomail';
    const year = '2026';
    const quarter = '1';
    const mode = 'STRONG';

    const shouldResult = '8JtjfMGoCJpwaXnNrCQ4Ww--'

    const password = await generate_password(seed, passPhrase, service, year, quarter, mode);

    expect(password).toBe(shouldResult);
});

test('empty test', async () => {
    const seed = SEED;
    const passPhrase = '';
    const service = '';
    const year = '';
    const quarter = '';
    const mode = 'STRONG';

    const shouldResult = 'do2ohZKfpN4*FMEMk2mAwA--'

    const password = await generate_password(seed, passPhrase, service, year, quarter, mode);

    expect(password).toBe(shouldResult);
});

test('ultra mode test', async () => {
    const seed = SEED;
    const passPhrase = 'qwerty';
    const service = 'yahoomail';
    const year = '2026';
    const quarter = '1';
    const mode = 'ULTRA';

    const shouldResult = '79qVCnqeFBIoqsNevcgJzPWxkmV1PT5pejbV_OXX2D1A8o89tVS0xAYdn6*UXW1p3pp_AKDaZFvvfdxyOEwa*cjwkJhmGcBRa88HOW4KHynicVB5QkM*hQ--'

    const password = await generate_password(seed, passPhrase, service, year, quarter, mode);

    expect(password).toBe(shouldResult);
});

test('zero seed test', async () => {
    // seed: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about [0,0,0,0,0,0,0,0,0,0,0,3]
    const seed = 3n;
    const passPhrase = 'qwerty';
    const service = 'yahoomail';
    const year = '2026';
    const quarter = '1';
    const mode = 'STRONG';

    const shouldResult = '1lGD7kiYenIoRkmz5mr2vA--'

    const password = await generate_password(seed, passPhrase, service, year, quarter, mode);

    expect(password).toBe(shouldResult);
});

test('unicode test', async () => {
    const seed = SEED;
    const passPhrase = '🍎ΝЯ个ÓÿК🍕Δыq😎ل';
    const service = 'yahoomail';
    const year = '2026';
    const quarter = '1';
    const mode = 'STRONG';

    const shouldResult = '7txBXbHjOZFR3DfgdkwuTQ--'

    const password = await generate_password(seed, passPhrase, service, year, quarter, mode);

    expect(password).toBe(shouldResult);
});

test.each(loadTestData())(
    'generates password for service=%s year=%s quarter=%s mode=%s',
    async (seed, passphrase, service, year, quarter, mode, shouldResult) => {
        const password = await generate_password(
            seed,
            passphrase,
            service,
            year,
            quarter,
            mode,
            null,
            10
        );

        expect(password).toBe(shouldResult);
    }
)