// Admin Dashboard Charts

document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initTransactionChart();
    initStatusChart();
});

// Transaction Trends Chart
function initTransactionChart() {
    const ctx = document.getElementById('transactionChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'],
            datasets: [
                {
                    label: 'Completed',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Pending',
                    data: [8, 11, 13, 9, 12, 15, 10],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Cancelled',
                    data: [2, 3, 1, 4, 2, 1, 3],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + ' txn';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Store chart instance for later use
    window.transactionChart = chart;
}

// Status Distribution Chart
function initStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'In Progress', 'Cancelled'],
            datasets: [{
                data: [189, 45, 23, 12],
                backgroundColor: [
                    '#28a745',
                    '#ffc107',
                    '#17a2b8',
                    '#dc3545'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Store chart instance
    window.statusChart = chart;
}

// Update chart time range
document.querySelectorAll('.btn-group .btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        this.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        const range = this.textContent.trim();
        updateChartData(range);
    });
});

// Update chart data based on time range
function updateChartData(range) {
    if (!window.transactionChart) return;
    
    let labels, data1, data2, data3;
    
    switch(range) {
        case 'Week':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            data1 = [8, 12, 10, 14, 16, 11, 9];
            data2 = [4, 6, 5, 7, 8, 6, 4];
            data3 = [1, 2, 1, 2, 1, 1, 2];
            break;
        case 'Month':
            labels = ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'];
            data1 = [12, 19, 15, 25, 22, 30, 28];
            data2 = [8, 11, 13, 9, 12, 15, 10];
            data3 = [2, 3, 1, 4, 2, 1, 3];
            break;
        case 'Year':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            data1 = [120, 150, 180, 220, 280, 320, 310, 350, 380, 360, 400, 420];
            data2 = [80, 90, 110, 130, 140, 160, 150, 170, 180, 160, 190, 200];
            data3 = [20, 25, 30, 35, 40, 45, 40, 50, 55, 50, 60, 65];
            break;
    }
    
    // Update chart
    window.transactionChart.data.labels = labels;
    window.transactionChart.data.datasets[0].data = data1;
    window.transactionChart.data.datasets[1].data = data2;
    window.transactionChart.data.datasets[2].data = data3;
    window.transactionChart.update();
}

// Real-time updates simulation
setInterval(() => {
    // Update status chart with random variations
    if (window.statusChart) {
        const currentData = window.statusChart.data.datasets[0].data;
        const newData = currentData.map(val => {
            const change = Math.floor(Math.random() * 5) - 2; // Random change between -2 and 2
            return Math.max(0, val + change);
        });
        window.statusChart.data.datasets[0].data = newData;
        window.statusChart.update('none'); // Update without animation
    }
}, 30000); // Update every 30 seconds