(async function () {
    const $ = (s) => document.querySelector(s);

    const seed = $('#seed');
    const pass = $('#passphrase');
    const pass2 = $('#passphraseConfirm');
    const year = $('#year');
    const quarterRadios = document.querySelectorAll('input[name="quarter"]');
    const generateBtn = $('#generate');
    const genMnemonicBtn = $('#gen-mnemonic');

    // Default year to current year if empty
    const now = new Date();
    const nowYear = now.getFullYear();
    if (year && !year.value) {
        year.value = String(nowYear);
    }

    // Default quarter to current quarter if currently "leave empty" is selected
    if (quarterRadios && quarterRadios.length > 0) {
        const month = now.getMonth(); // 0..11
        const qIndex = Math.floor(month / 3) + 1; // 1..4
        const targetVal = `q${qIndex}`;
        const target = Array.from(quarterRadios).find(r => r.value === targetVal);
            target.checked = true;
    }


    ['input', 'change'].forEach((evt) => {
        [seed, pass, pass2, year].forEach((el) => el && el.addEventListener(evt, validate));
        // Also listen on quarter radios so any change re-validates (even though quarter isn't validated now)
        if (quarterRadios && quarterRadios.forEach) {
            quarterRadios.forEach((el) => el && el.addEventListener(evt, validate));
        }
    });

    validate();

    // Generate and display the derived result
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const resultEl = document.querySelector('#result');
            const prevText = generateBtn.textContent;
            try {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating…';
                const out = await generate();
                if (resultEl) {
                    resultEl.value = out || '';
                }
            } catch (e) {
                console.error(e);
                if (resultEl) resultEl.value = 'Error: ' + (e && e.message ? e.message : String(e));
            } finally {
                generateBtn.textContent = prevText;
                // Re-run validate to restore enabled state according to inputs
                try { await validate(); } catch {}
            }
        });
    }

    if (genMnemonicBtn) {
        genMnemonicBtn.addEventListener('click', async () => {
            const prev = genMnemonicBtn.textContent;
            try {
                genMnemonicBtn.disabled = true;
                genMnemonicBtn.textContent = 'Generating…';
                const phrase = await generate_mnemonic_12();
                if (seed) {
                    seed.value = phrase;
                    seed.focus();
                }
            } catch (e) {
                console.error(e);
                alert('Failed to generate mnemonic: ' + (e && e.message ? e.message : String(e)));
            } finally {
                genMnemonicBtn.textContent = prev;
                genMnemonicBtn.disabled = false;
                try { await validate(); } catch {}
            }
        });
    }
})();
