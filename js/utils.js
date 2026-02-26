/**
 * Utilities for Level Generation and Sharing
 */

const Utils = {
    /**
     * Generate a random level with a rich set of functions
     */
    generateRandomLevel: function() {
        const basics = ['x', 'x^2', 'x^3', 'abs(x)', 'sin(x)', 'cos(x)'];
        const advanced = ['sqrt(abs(x))', 'exp(x)', 'log10(abs(x)+0.1)', 'asin(sin(x))', 'atan(x)'];
        
        const allFuncs = [...basics, ...advanced];
        const operators = ['+', '-', '*'];

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

        let expr = terms[0];
        const op = operators[Math.floor(Math.random() * operators.length)];
        expr = `(${expr})${op}(${terms[1]})`;

        return { targetFuncStr: expr };
    },

    /**
     * Encode a level object using Base64
     */
    encodeLevel: function(level) {
        try {
            const json = JSON.stringify(level);
            return btoa(encodeURIComponent(json));
        } catch (e) {
            console.error("Encoding Error:", e);
            return null;
        }
    },

    /**
     * Decode a level string using Base64
     */
    decodeLevel: function(encoded) {
        try {
            const json = decodeURIComponent(atob(encoded));
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
            const level = this.decodeLevel(encoded);
            if (level && typeof level.targetFuncStr === 'string' && level.targetFuncStr.trim().length > 0) {
                return level;
            }
            console.warn('Invalid level data from URL, falling back to random level.');
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
