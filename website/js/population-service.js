/**
 * Frontend World Population Service
 * Fetches real-time world population data for the frontend
 */

class PopulationService {
    constructor() {
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 5 * 60 * 1000 // 5 minutes cache
        };
        
        this.fallbackData = {
            basePopulation: 8100000000,
            growthRate: 0.0087,
            lastUpdate: '2024-01-01'
        };
    }

    /**
     * Get current world population with caching
     */
    async getCurrentPopulation() {
        // Check cache first
        if (this.cache.data && 
            this.cache.timestamp && 
            Date.now() - this.cache.timestamp < this.cache.ttl) {
            return this.cache.data;
        }

        try {
            // Try multiple APIs for real-time data
            let populationData = await this.fetchFromAPIs();
            
            if (!populationData) {
                // Fallback to calculation
                populationData = this.calculateCurrentPopulation();
            }

            // Cache the result
            this.cache.data = populationData;
            this.cache.timestamp = Date.now();
            
            return populationData;
        } catch (error) {
            console.error('Population fetch error:', error);
            
            // Return cached data or fallback
            if (this.cache.data) {
                return this.cache.data;
            } else {
                return this.calculateCurrentPopulation();
            }
        }
    }

    /**
     * Try to fetch from multiple population APIs
     */
    async fetchFromAPIs() {
        try {
            // Try REST Countries API (has some population data)
            const restCountriesData = await this.fetchFromRestCountries();
            if (restCountriesData) {
                return restCountriesData;
            }

            // Try World Bank API
            const worldBankData = await this.fetchFromWorldBank();
            if (worldBankData) {
                return worldBankData;
            }

            return null;
        } catch (error) {
            console.error('API fetch error:', error);
            return null;
        }
    }

    /**
     * Fetch from REST Countries API and estimate global population
     */
    async fetchFromRestCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=population');
            if (!response.ok) return null;
            
            const countries = await response.json();
            const totalPopulation = countries.reduce((sum, country) => sum + (country.population || 0), 0);
            
            // REST Countries data might be outdated, so we apply growth
            const adjustedPopulation = this.applyGrowthAdjustment(totalPopulation);
            
            return {
                population: adjustedPopulation,
                formatted: this.formatPopulation(adjustedPopulation),
                source: 'rest-countries-adjusted',
                timestamp: new Date().toISOString(),
                confidence: 'medium'
            };
        } catch (error) {
            console.error('REST Countries fetch error:', error);
            return null;
        }
    }

    /**
     * Try World Bank API (may have CORS issues)
     */
    async fetchFromWorldBank() {
        try {
            // World Bank API often has CORS issues from browser
            // This is here for potential proxy or server-side usage
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Calculate current population based on growth rate
     */
    calculateCurrentPopulation() {
        const now = new Date();
        const baseDate = new Date(this.fallbackData.lastUpdate);
        const yearsPassed = (now - baseDate) / (1000 * 60 * 60 * 24 * 365.25);
        
        // Apply compound growth
        const currentPopulation = Math.floor(
            this.fallbackData.basePopulation * Math.pow(1 + this.fallbackData.growthRate, yearsPassed)
        );
        
        return {
            population: currentPopulation,
            formatted: this.formatPopulation(currentPopulation),
            source: 'calculated',
            timestamp: new Date().toISOString(),
            confidence: 'high',
            growthRate: this.fallbackData.growthRate,
            baseYear: '2024'
        };
    }

    /**
     * Apply growth adjustment to older data
     */
    applyGrowthAdjustment(basePopulation, dataYear = 2023) {
        const currentYear = new Date().getFullYear();
        const yearsDiff = currentYear - dataYear;
        
        if (yearsDiff <= 0) return basePopulation;
        
        return Math.floor(basePopulation * Math.pow(1 + this.fallbackData.growthRate, yearsDiff));
    }

    /**
     * Format population number for display
     */
    formatPopulation(population) {
        if (population >= 1e9) {
            return (population / 1e9).toFixed(2) + 'B';
        } else if (population >= 1e6) {
            return (population / 1e6).toFixed(1) + 'M';
        } else {
            return population.toLocaleString();
        }
    }

    /**
     * Get population growth statistics
     */
    async getGrowthStats() {
        const populationData = await this.getCurrentPopulation();
        const population = populationData.population;
        const growthRate = populationData.growthRate || this.fallbackData.growthRate;
        
        const annualGrowth = Math.floor(population * growthRate);
        const dailyGrowth = Math.floor(annualGrowth / 365.25);
        const hourlyGrowth = Math.floor(dailyGrowth / 24);
        const minuteGrowth = Math.floor(hourlyGrowth / 60);

        return {
            current: population,
            growthRate: growthRate,
            annualGrowth,
            dailyGrowth,
            hourlyGrowth,
            minuteGrowth,
            formatted: {
                current: populationData.formatted,
                annualGrowth: annualGrowth.toLocaleString(),
                dailyGrowth: dailyGrowth.toLocaleString(),
                hourlyGrowth: hourlyGrowth.toLocaleString(),
                minuteGrowth: minuteGrowth.toLocaleString()
            }
        };
    }

    /**
     * Get token economics based on current population
     */
    async getTokenEconomics() {
        const populationData = await this.getCurrentPopulation();
        const tokensPerPerson = 1000;
        
        return {
            totalSupply: populationData.population,
            totalSupplyFormatted: populationData.formatted,
            freeTokenPool: Math.floor(populationData.population * 0.1), // 10% available for free distribution
            tokensPerClaim: tokensPerPerson,
            maxClaimants: Math.floor(populationData.population * 0.1 / tokensPerPerson),
            populationSource: populationData.source,
            lastUpdate: populationData.timestamp
        };
    }
}

// Export for use in other scripts
window.PopulationService = PopulationService;