(function () {
  var node = document.getElementById("dashboard-chart-data");
  var canvas = document.getElementById("dash-chart");
  if (!node || !canvas || typeof Chart === "undefined") return;

  var data;
  try {
    data = JSON.parse(node.textContent || "{}");
  } catch (error) {
    return;
  }

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels || [],
      datasets: [
        {
          label: "Nhập",
          data: data.imports || [],
          backgroundColor: "#7c6cf0",
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.6,
        },
        {
          label: "Xuất",
          data: data.exports || [],
          backgroundColor: "#67e8f9",
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#8a8d9a" },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f0f1f6" },
          ticks: { color: "#8a8d9a" },
        },
      },
    },
  });
})();
