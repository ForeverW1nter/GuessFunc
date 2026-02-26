/**
 * Utilities for Level Generation and Sharing
 */

const Utils = {
    /**
     * Generate a random level with a rich set of functions
     */
    generateRandomLevel: function() {
        const basics = ['x', 'x^2', 'x^3', 'abs(x)', 'sin(x)', 'cos(x)', 'tan(x)'];
        const advanced = ['sqrt(abs(x))', 'exp(x)', 'ln(abs(x)+0.1)', 'asin(sin(x))', 'atan(x)'];
        
        const allFuncs = [...basics, ...advanced];
        const operators = ['+', '-', '*'];

        let expr = '';
        let isValid = false;
        let attempts = 0;

        while (!isValid && attempts < 15) {
            attempts++;
            const numTerms = 2;
            let terms = [];

            for (let i = 0; i < numTerms; i++) {
                let term = allFuncs[Math.floor(Math.random() * allFuncs.length)];
                const coeff = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
                
                if (coeff !== 1) {
                    term = coeff === -1 ? `-${term}` : `${coeff}*(${term})`;
                }

                if (Math.random() > 0.8) {
                    const inner = ['x+1', 'x-1', '2*x'][Math.floor(Math.random() * 3)];
                    term = term.replace('(x)', `(${inner})`);
                }
                terms.push(term);
            }

            expr = terms[0];
            const op = operators[Math.floor(Math.random() * operators.length)];
            expr = `(${expr})${op}(${terms[1]})`;

            try {
                // Verify with mathjs first
                const node = math.parse(expr);
                const code = node.compile();
                
                // CRITICAL: Verify the function has real values in our range
                let realValueCount = 0;
                const samplePoints = [-5, -2, 0, 2, 5];
                for (let p of samplePoints) {
                    const v = code.evaluate({x: p});
                    if (typeof v === 'number' && isFinite(v) && !isNaN(v)) {
                        realValueCount++;
                    }
                }
                
                // Only accept if at least 3 points have real values
                if (realValueCount >= 3) {
                    isValid = true;
                }
            } catch (e) {}
        }

        return { targetFuncStr: expr };
    },

    /**
     * Fixed Key for encryption
     */
    _SECRET_KEY: "GUESS_FUNC_PRO_2024",

    /**
     * Encode a level object using XOR encryption + Base64
     */
    encodeLevel: function(level) {
        try {
            const json = JSON.stringify(level);
            const utf8Json = unescape(encodeURIComponent(json));
            
            // XOR Encryption
            let encrypted = "";
            for (let i = 0; i < utf8Json.length; i++) {
                const charCode = utf8Json.charCodeAt(i) ^ this._SECRET_KEY.charCodeAt(i % this._SECRET_KEY.length);
                encrypted += String.fromCharCode(charCode);
            }
            
            return btoa(encrypted);
        } catch (e) {
            console.error("Encoding Error:", e);
            return null;
        }
    },

    /**
     * Decode a level string using Base64 + XOR decryption
     */
    decodeLevel: function(encoded) {
        try {
            const encrypted = atob(encoded);
            
            // XOR Decryption (same as encryption)
            let decrypted = "";
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i) ^ this._SECRET_KEY.charCodeAt(i % this._SECRET_KEY.length);
                decrypted += String.fromCharCode(charCode);
            }
            
            const json = decodeURIComponent(escape(decrypted));
            return JSON.parse(json);
        } catch (e) {
            console.error("Decoding Error:", e);
            return null;
        }
    },

    /**
     * Get level from URL if it exists
     */
    getLevelFromURL: function() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('level');
        if (encoded) {
            return this.decodeLevel(encoded);
        }
        return null;
    },

    /**
     * Update URL with encoded level
     */
    updateURLWithLevel: function(level) {
        const encoded = this.encodeLevel(level);
        const newURL = window.location.origin + window.location.pathname + '?level=' + encoded;
        window.history.pushState({ path: newURL }, '', newURL);
        return newURL;
    }
};
