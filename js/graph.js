/**
 * Graph Rendering for Guess the Function
 * Uses function-plot to display mathematical functions.
 */

const Graph = {
    instance: null,
    targetFunction: null,
    userFunctions: [],
    range: { x: [-5, 5], y: [-5, 5] },
    
    /**
     * Initialize or update the plot
     * @param {string} targetFunc - The target function string
     * @param {Object} range - {xMin, xMax}
     */
    init: function(targetFunc, range) {
        this.targetFunction = targetFunc;
        this.range.x = [range.xMin, range.xMax];
        this.userFunctions = [];
        // No immediate render, let the caller decide or call clearUserFunctions
        this.render();
    },

    /**
     * Add a user function to the plot
     * @param {string} originalInput - Original user input string
     * @param {string} substitutedFuncStr - Substituted and simplified function string
     */
    addUserFunction: function(originalInput, substitutedFuncStr) {
        this.userFunctions.push({
            fn: substitutedFuncStr,
            label: originalInput,
            color: this._getRandomColor()
        });
        this.render();
    },

    /**
     * Render the plot using function-plot
     */
    render: function() {
        const data = [];

        // 1. Add target function
        if (this.targetFunction) {
            data.push({
                fn: this.targetFunction,
                title: '目标函数',
                color: '#333',
                graphType: 'polyline',
                sampler: 'builtIn',
                attr: {
                    'stroke-width': 2
                },
                nSamples: 500 // Moderate number of samples for performance
            });
        }

        // 2. Add user functions
        // Show only the last 10 guesses to maintain performance
        const recentGuesses = this.userFunctions.slice(-10);
        recentGuesses.forEach(uf => {
            data.push({
                fn: uf.fn,
                title: uf.label,
                color: uf.color,
                graphType: 'polyline',
                sampler: 'builtIn',
                nSamples: 400
            });
        });

        try {
            const plotEl = document.getElementById('plot');
            if (!plotEl) return;

            this.instance = functionPlot({
                target: '#plot',
                width: plotEl.clientWidth,
                height: plotEl.clientHeight,
                grid: true,
                xAxis: { domain: this.range.x },
                yAxis: { domain: [-10, 10] },
                data: data,
                disableZoom: false
            });
        } catch (e) {
            console.error("Plotting Error:", e);
        }
    },

    _getRandomColor: function() {
        const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf'];
        return colors[this.userFunctions.length % colors.length];
    },

    /**
     * Clear all user functions from the plot
     */
    clearUserFunctions: function() {
        this.userFunctions = [];
        this.render();
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    if (Graph.instance) {
        Graph.render();
    }
});
