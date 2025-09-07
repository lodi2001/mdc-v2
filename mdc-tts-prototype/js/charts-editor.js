// Charts for Editor Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initTaskStatusChart();
});

// Initialize Task Status Chart
function initTaskStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Check if Arabic is selected
    const isArabic = document.documentElement.lang === 'ar' || localStorage.getItem('language') === 'ar';
    
    // Set labels based on language
    const labels = isArabic ? 
        ['مكتمل', 'معلق', 'قيد التنفيذ', 'مسودة'] :
        ['Completed', 'Pending', 'In Progress', 'Draft'];
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: [28, 12, 5, 5],
                backgroundColor: [
                    '#28a745',  // Success (green)
                    '#ffc107',  // Warning (yellow)
                    '#17a2b8',  // Info (cyan)
                    '#6c757d'   // Secondary (gray)
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
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
            }
        }
    });
    
    // Store chart instance for later updates
    window.taskStatusChart = chart;
}

// Update chart language when language changes
window.addEventListener('languageChanged', function(e) {
    if (window.taskStatusChart) {
        const isArabic = e.detail.lang === 'ar';
        const labels = isArabic ? 
            ['مكتمل', 'معلق', 'قيد التنفيذ', 'مسودة'] :
            ['Completed', 'Pending', 'In Progress', 'Draft'];
        
        window.taskStatusChart.data.labels = labels;
        window.taskStatusChart.update();
    }
});