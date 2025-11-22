const $ = (s) => document.querySelector(s);

const seedInput = $('#seed');
const passInput = $('#passphrase');
const pass2Input = $('#passphraseConfirm');
const yearInput = $('#year');
const generateBtn = $('#generate');
const confirmHint = $('#confirm-hint');

// Enable/disable Generate button based on simple validation
async function validate() {
    let ok = true;

    // Seed: must be 12 valid words (BIP39 list via is_seed_valid)
    const seedValue = seedInput ? seedInput.value.trim().toLocaleLowerCase() : '';
    const seedTouched = seedValue.length > 0;
    const seedValid = seedInput ? seedTouched && is_seed_valid(seedValue) : true;
    const seedChecksumValid = seedInput ? seedValid && await is_checksum_valid(seedValue) : true;
    ok = ok && seedValid && seedChecksumValid;

    // Pass phrase confirmation must match and not be empty
    const passTouched = (passInput && passInput.value.length > 0) || (pass2Input && pass2Input.value.length > 0);
    const passMatch = passInput && pass2Input ? (passInput.value === pass2Input.value) : true;
    ok = ok && passMatch;

    // Update universal confirm hint (covers seed + pass states)
    if (confirmHint) {
        const problems = [];
        if (seedTouched && !seedValid) problems.push('Seed phrase must be 12 valid words.');
        if (seedTouched && seedValid && !seedChecksumValid) problems.push('Seed phrase is invalid (checksum mismatch).');
        if (passTouched && !passMatch) problems.push('Pass phrase confirmation must match.');

        if (problems.length === 0) {
            if (!seedTouched && !passTouched)
                confirmHint.textContent = 'Enter seed phrase and passphrase';
            // else if (seedTouched && !passTouched)
            //     confirmHint.textContent = 'Enter passphrase';
            else if (!seedTouched && passTouched)
                confirmHint.textContent = 'Enter seed phrase';
            else
                confirmHint.textContent = 'Enter Passphrase, Service name, Year and Quarter. Then click Generate.';
            confirmHint.style.color = 'var(--muted)';
        } else {
            confirmHint.textContent = problems.join(' ');
            confirmHint.style.color = 'var(--danger)';
        }
    }

    // Year sanity
    if (yearInput && yearInput.value.length > 0) {
        const y = Number(yearInput.value);
        ok = ok && Number.isInteger(y) && y >= 1970 && y <= 2999;
    }

    if (generateBtn) generateBtn.disabled = !ok;
}