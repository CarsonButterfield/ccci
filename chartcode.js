let stateCount = 0
const sortedCarbonData = {}
let graphInterval;
fetch('https://datas.carbonmonitor.org/API/downloadFullDataset.php?source=carbon_us')
    .then(res => res.text())
    .then(async data => {
        Papa.parse(data, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                for(let i = 0; i < results.data.length; i++) {
                    if (sortedCarbonData[results.data[i].state]) {
                        if (sortedCarbonData[results.data[i].state][results.data[i].sector]) {
                            sortedCarbonData[results.data[i].state][results.data[i].sector].push({
                                date: results.data[i].date,
                                timestamp: results.data[i].timestamp,
                                value: results.data[i].value,
                            })
                        } else {
                            sortedCarbonData[results.data[i].state][results.data[i].sector] = [{
                                date: results.data[i].date,
                                timestamp: results.data[i].timestamp,
                                value: results.data[i].value,
                            }]
                        }
                    } else {
                        sortedCarbonData[results.data[i].state] = {
                            [results.data[i].sector]: [{
                                date: results.data[i].date,
                                timestamp: results.data[i].timestamp,
                                value: results.data[i].value,
                            }]
                        }
                    }
                }
            }
        })
    })

const awaitChart = state => {
    clearInterval(graphInterval)
    graphInterval = setInterval(() => {
    if(sortedCarbonData[state]) {
        $('.lds-ring').remove()
        clearInterval(graphInterval)
        generateStateChart(state)
    }
    },500)
}
const generateStateChart = async (state) => {
    const dataSeries = []
    for(field in sortedCarbonData[state]){
        dataSeries.push({
            name: field,
            turboThreshold: 0,
            data: sortedCarbonData[state][field].map(datum => {
                const dateArr = datum.date.split('/')
                const newDate = `${dateArr[1]}/${dateArr[0]}/${dateArr[2]}`
                return {y:datum.value, x:new Date(newDate).getTime()}
            })
        })
    }
    if(dataSeries.length > 0){

        Highcharts.chart(`carbon-graph`, {
            title: {
                text: ``,
            },
        
            yAxis: {
                title: {
                    text: 'Carbon Emissions (MtCO<span>&#8322;</span>)'
                }
            },
        
            xAxis: {
                type: 'datetime',
                labels: {
                    format: '{value:%e-%b-%Y}'
                  },
                accessibility: {
                    rangeDescription: 'Range: 2010 to 2017'
                }
            },
            colors: ['#FDB515','#003262','#584f29', '#888888', '#3B7EA1', '#C4820E'],
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
        
            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                }
            },
        
            series: dataSeries,
        
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        
        });
    }
    else {
        $('#carbon-graph').append(`<div id="${state}"><div class="lds-ring"><div></div><div></div><div></div><div></div></div></div>`)
        awaitChart(state)
    }
}