function connectWebSocket() {
  const ws = new WebSocket(`ws://${window.location.host}/ws`);

  ws.onopen = () => {
    console.log("WebSocket connection established.");
    // Optional: Clear any previous error messages
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) errorDiv.remove();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("Received error from server:", data.error);
        return;
      }
      updateUI(data);
    } catch (e) {
      console.error("Error parsing message data:", e);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed. Reconnecting in 2 seconds...");
    displayConnectionError();
    setTimeout(connectWebSocket, 2000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    ws.close(); // This will trigger the onclose handler
  };
}

function updateUI(data) {
  const now = new Date();
  const label = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

  // Update CPU Load Chart
  if (cpuLoadChart && data.cpu) {
    updateChart(cpuLoadChart, label, data.cpu.load, 100); // CPU load is typically 0-100%
  }

  // Update Memory Chart
  if (memChart && data.mem) {
    const usedMem = (data.mem.used / 1024 / 1024 / 1024).toFixed(2);

    const memTotal = (data.mem.total / 1024 / 1024 / 1024).toFixed(2);
    updateChart(memChart, label, usedMem, memTotal);
  }

  // Filesystem Info (remains the same)
  const fsInfoContainer = document.getElementById("fs-info-container");
  if (fsInfoContainer && data.fs && data.fs.length > 0) {
    fsInfoContainer.innerHTML = ''; // Clear previous content
    data.fs.forEach(fs => {
      const totalFs = (fs.size / 1024 / 1024 / 1024).toFixed(2);
      const usedFs = (fs.used / 1024 / 1024 / 1024).toFixed(2);
      const fsUsage = fs.use;

      const fsDiv = document.createElement('div');
      fsDiv.className = 'fs-item'; // Add a class for styling if needed
      fsDiv.innerHTML = `
        <p><span class="label">Disk:</span> ${fs.fs}</p>
        <p><span class="label">Total Size:</span> ${totalFs} GB</p>
        <p><span class="label">Used:</span> ${usedFs} GB</p>
        <p><span class="label">Free:</span> ${(totalFs - usedFs).toFixed(2)} GB</p>
        <div class="progress-bar">
            <div class="progress" style="width: ${fsUsage}%"></div>
        </div>
      `;
      fsInfoContainer.appendChild(fsDiv);
    });
  }

  // Update Network Chart
  if (networkChart && data.networkStats && data.networkStats.length > 0) {
    const net = data.networkStats[0]; // Assuming the first network interface
    const rx_sec = (net.rx_sec / 1024).toFixed(2); // KB/s
    const tx_sec = (net.tx_sec / 1024).toFixed(2); // KB/s
    updateChart(networkChart, label, [rx_sec, tx_sec], null);
  }
}

function displayConnectionError() {
  let errorDiv = document.getElementById("error-message");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "error-message";
    errorDiv.style.cssText =
      "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background-color: #ff4d4d; color: white; padding: 10px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 1000;";
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = "Connection lost. Attempting to reconnect...";
}

let cpuLoadChart, memChart, networkChart;
const MAX_DATA_POINTS = 15; // Show last 15 data points (30 seconds)

function createLineChart(canvasId, labels, yAxisLabel) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const datasets = labels.map((label, index) => ({
    label: label,
    data: [],
    borderColor: index === 0 ? "#1877f2" : "#28a745", // Blue for first, green for second
    backgroundColor: index === 0 ? "rgba(24, 119, 242, 0.1)" : "rgba(40, 167, 69, 0.1)",
    fill: true,
    tension: 0.4,
    pointRadius: 0,
  }));

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            display: false,
          },
          grid: {
            display: true,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yAxisLabel,
          },
        },
      },
      plugins: {
        legend: {
          display: labels.length > 1, // Show legend if multiple datasets
        },
      },
    },
  });
}

function updateChart(chart, label, values, maxY) {
  chart.data.labels.push(label);

  // Ensure values is an array, even for single-dataset charts
  const valuesArray = Array.isArray(values) ? values : [values];

  valuesArray.forEach((value, index) => {
    chart.data.datasets[index].data.push(value);
  });

  if (chart.data.labels.length > MAX_DATA_POINTS) {
    chart.data.labels.shift();
    valuesArray.forEach((value, index) => {
      chart.data.datasets[index].data.shift();
    });
  }

  if (maxY) {
    chart.options.scales.y.max = maxY;
  }

  chart.update("quiet");
}

// Initial connection
connectWebSocket();
cpuLoadChart = createLineChart("cpu-load-chart", ["CPU Load (%)"], "%");
memChart = createLineChart("mem-chart", ["Memory Usage (GB)"], "GB");
networkChart = createLineChart("network-chart", ["Received (KB/s)", "Transmitted (KB/s)"], "KB/s");
