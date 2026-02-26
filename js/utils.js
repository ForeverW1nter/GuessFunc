/**
 * Utilities for Level Generation and Sharing
 */

const Utils = {
    /**
     * Generate a random level
     * @returns {Object} {targetFuncStr, xMin, xMax}
     */
    generateRandomLevel: function() {
        // 1. Basic building blocks
        const functions = ['x', 'x^2', 'x^3', 'sin(x)', 'cos(x)', 'tan(x)', 'exp(x)', 'log(x)'];
        const operators = ['+', '-', '*', '/'];

        // 2. Build a random expression (simple for now)
        // Let's combine 2-3 functions
        const numParts = 2 + Math.floor(Math.random() * 2);
        let expr = '';

        for (let i = 0; i < numParts; i++) {
            let part = functions[Math.floor(Math.random() * functions.length)];
            
            // Add some coefficients (small integers)
            const coeff = 1 + Math.floor(Math.random() * 5);
            if (coeff > 1) part = `${coeff}*${part}`;
            
            // Randomly shift sin/cos
            if (part.includes('sin') || part.includes('cos')) {
                const shift = Math.floor(Math.random() * 3);
                if (shift > 0) part = part.replace('(x)', `(x + ${shift})`);
            }

            if (i > 0) {
                expr += ` ${operators[Math.floor(Math.random() * operators.length)]} `;
            }
            expr += part;
        }

        // 3. Determine a good display range
        // For elementary functions, we can look for roots or extrema
        // but a simpler heuristic is to ensure the range covers where the function changes most
        let xMin = -5;
        let xMax = 5;

        try {
            const node = math.parse(expr);
            const code = node.compile();
            
            // Sample points to find where the function is "interesting"
            // We'll keep it simple: [-5, 5] is a good default for these basic combinations.
            // If the function grows too fast (like exp), we might want to shrink the range.
            const y0 = code.evaluate({x: 0});
            if (Math.abs(y0) > 100) {
                // Shift range if it's way off at x=0
            }
        } catch (e) {}

        return {
            targetFuncStr: expr,
            xMin: xMin,
            xMax: xMax
        };
    },

    /**
     * Encode a level into a URL parameter
     * @param {Object} level - {targetFuncStr, xMin, xMax}
     * @returns {string} - Base64 encoded JSON string
     */
    encodeLevel: function(level) {
        const json = JSON.stringify(level);
        return btoa(unescape(encodeURIComponent(json)));
    },

    /**
     * Decode a level from a URL parameter
     * @param {string} encoded - Base64 encoded JSON string
     * @returns {Object} - {targetFuncStr, xMin, xMax}
     */
    decodeLevel: function(encoded) {
        try {
            const json = decodeURIComponent(escape(atob(encoded)));
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
