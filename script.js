import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// 🔥 Cấu hình Firebase (THAY THẾ bằng thông tin của bạn)
const firebaseConfig = {
  apiKey: "AIzaSyB5O8Z0X4PFC3qf6QNRsnyww34bBKKNP_E",
  authDomain: "alarm-90538.firebaseapp.com",
  databaseURL: "https://alarm-90538-default-rtdb.firebaseio.com",
  projectId: "alarm-90538",
  storageBucket: "alarm-90538.firebasestorage.app",
  messagingSenderId: "142730344071",
  appId: "1:142730344071:web:96e1cb18f1c849e04b2a22",
  measurementId: "G-2DMVXWG95V"
};


// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Các phần tử DOM
const tempEl = document.getElementById("temp-value");
const fireAlert = document.getElementById("fire-alert");
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const energyEl = document.getElementById("energy");
const saveBtn = document.getElementById("saveBtn");

// Biểu đồ
const chartData = {
  labels: [],
  datasets: [
    {
      label: "Nhiệt độ (°C)",
      data: [],
      borderColor: "red",
      fill: false,
    },
    {
      label: "Công suất (W)",
      data: [],
      borderColor: "blue",
      fill: false,
    },
  ],
};

const ctx = document.getElementById("dataChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: chartData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "Thời gian" } },
      y: { title: { display: true, text: "Giá trị" } },
    },
  },
});

let dataLog = [];

// Hàm cập nhật giao diện
function updateDisplay(temp, voltage, current, power, energy) {
  tempEl.textContent = `${temp} °C`;
  voltageEl.textContent = voltage;
  currentEl.textContent = current;
  powerEl.textContent = power;
  energyEl.textContent = energy;

  if (temp > 60) fireAlert.classList.remove("hidden");
  else fireAlert.classList.add("hidden");

  const now = new Date().toLocaleTimeString();
  chartData.labels.push(now);
  chartData.datasets[0].data.push(temp);
  chartData.datasets[1].data.push(power);
  if (chartData.labels.length > 20) {
    chartData.labels.shift();
    chartData.datasets.forEach(ds => ds.data.shift());
  }
  chart.update();

  dataLog.push(`${now},${temp},${voltage},${current},${power},${energy}`);
}

// 🔄 Lắng nghe dữ liệu từ Firebase
const refPath = ref(db, "sensors"); // đường dẫn trong Firebase
onValue(refPath, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const { temperature, voltage, current, power, energy } = data;
    updateDisplay(
      parseFloat(temperature) || 0,
      parseFloat(voltage) || 0,
      parseFloat(current) || 0,
      parseFloat(power) || 0,
      parseFloat(energy) || 0
    );
  }
});

// 💾 Lưu file text
saveBtn.addEventListener("click", () => {
  const blob = new Blob([dataLog.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data_log.txt";
  link.click();
});