let stateCount = 0
console.log('beep boop')
const sortedCarbonData = {}
fetch('https://datas.carbonmonitor.org/API/downloadFullDataset.php?source=carbon_us')
    .then(res => res.text())
    .then(data => {
        Papa.parse(data, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                results.data.forEach(({
                    state,
                    sector,
                    ...data
                }) => {
                    // console.log(state, sector, data)
                    if (sortedCarbonData[state]) {
                        if (sortedCarbonData[state][sector]) {
                            sortedCarbonData[state][sector].push(data)
                        } else {
                            sortedCarbonData[state][sector] = [data]
                        }
                    } else {
                        sortedCarbonData[state] = {
                            [sector]: [data]
                        }
                    }
                })
            }
        })
    })



const generateStateChart = (state) => {
    const dataSeries = []
    for(field in sortedCarbonData[state]){
        dataSeries.push({
            name: field,
            data: sortedCarbonData[state][field].map(datum => {
                const dateArr = datum.date.split('/')
                const newDate = `${dateArr[1]}/${dateArr[0]}/${dateArr[2]}`
                return {y:datum.value, x:new Date(newDate).getTime()}
            })
        })
        console.log(dataSeries)
    }
    $('body').append(`<figure class="highcharts-figure"> <div id="${state}"></div></figure>`)
    Highcharts.chart(`carbon-graph`, {

        title: {
            text: `Carbon Chart ${state}`
        },
    
        subtitle: {
            text: 'Source: thesolarfoundation.com'
        },
    
        yAxis: {
            title: {
                text: 'Carbon Emissions'
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