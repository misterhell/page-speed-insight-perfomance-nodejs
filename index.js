require('dotenv').config();

const axios = require('axios')

const config = {
    key:  process.env.PAGE_SPPED_INSIGHT_KEY,

    serviceUrl: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?category=PERFORMANCE',

    strategies: { desktop: 'DESKTOP', mobile: 'MOBILE' },

    createUrl: (pageUrl, strategy) => {
        return `${config.serviceUrl}&url=${pageUrl}&key=${config.key}&strategy=${strategy}`
    },
}

const landings = [
    'https://google.com/'
]


const checkTimes = 5

const createArrayOfPromices = (landings, strategy) => {
    const arrayOfPromices = []

    for (let i = 0; i < checkTimes; i++) {
        for (landing of landings) {
            const requestUri = config.createUrl(landing, strategy)
            const axiosPromice = axios.get(requestUri)
            arrayOfPromices.push(axiosPromice)
        }
    }

    return arrayOfPromices
}

const fillLandingDataByStrategy = (promiceResolve, s) => {
    const data = promiceResolve.value.data
    const site = data.id
    const perfomance = data.lighthouseResult.categories.performance.score

    if (landingsPerfomance[site] === undefined) {
        landingsPerfomance[site] = {}
    }

    if (landingsPerfomance[site][s] === undefined) {
        landingsPerfomance[site][s] = []
    }

    landingsPerfomance[site][s].push(perfomance)
}

const landingsPerfomance = {}

Promise.allSettled(createArrayOfPromices(landings, config.strategies.desktop))
    .then(promicesDesktop => {        
        for (promice of promicesDesktop) {

            if (promice.status == 'fulfilled') {
                fillLandingDataByStrategy(promice, config.strategies.desktop)
            }
        }

        Promise.allSettled(createArrayOfPromices(landings, config.strategies.mobile))
            .then(promicesMobile => {
                for (promice of promicesMobile) {
                    if (promice.status == 'fulfilled') {
                        fillLandingDataByStrategy(promice, config.strategies.mobile)
                    }
                }


                /**
                 * 
                 * @param {array} arr 
                 * @returns 
                 */
                const reduceStrategyResults = arr => {
                    return parseFloat(arr.reduce((acc, val) => acc + val, 0) / checkTimes).toFixed(2)
                }
                
                for (let i in landingsPerfomance) {
                    landingsPerfomance[i][config.strategies.desktop] = reduceStrategyResults(landingsPerfomance[i][config.strategies.desktop])
                    landingsPerfomance[i][config.strategies.mobile] = reduceStrategyResults(landingsPerfomance[i][config.strategies.mobile])
                }

                console.log(landingsPerfomance)
            })

    }) 