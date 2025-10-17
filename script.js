// script.js (module)
// Lưu ý: chạy trang qua http://localhost (Live Server / python -m http.server ...)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

/* ====== 1) Cấu hình Firebase - thay bằng thông tin của bạn ====== */
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
/* ================================================================ */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM
const tempEl = document.getElementById("temp-value");
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const energyEl = document.getElementById("energy");
const fireBadge = document.getElementById("fire-badge");
const fireLogList = document.getElementById("fire-log-list");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");

// Cấu hình báo cháy
const FIRE_THRESHOLD = 60; // °C
let fireEvents = [];

// Lưu dữ liệu tại client (mảng các object: {ts: timestamp, timeStr: "HH:MM", temp, voltage, current, power, energy})
let history = [];

// Hàm format giờ: HH:MM
function hhmm(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Chart.js - nhóm cột (grouped bar)
const ctx = document.getElementById("multiBarChart").getContext("2d");
const chartConfig = {
  type: "bar",
  data: {
    labels: [], // time strings
    datasets: [
      { label: "Điện áp (V)", data: [], backgroundColor: "rgba(11,118,255,0.85)" },
      { label: "Dòng (A)", data: [], backgroundColor: "rgba(0,200,150,0.85)" },
      { label: "Nhiệt độ (°C)", data: [], backgroundColor: "rgba(255,99,71,0.9)" },
      { label: "Năng lượng (Wh)", data: [], backgroundColor: "rgba(160,32,240,0.85)" },
      { label: "Công suất (W)", data: [], backgroundColor: "rgba(255,193,7,0.9)" },
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: {
        stacked: false,
        ticks: { maxRotation: 45, minRotation: 0 }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Giá trị" }
      }
    }
  }
};
const multiBarChart = new Chart(ctx, chartConfig);

// Giữ dữ liệu trong 24 giờ (milliseconds)
const DAY_MS = 24 * 60 * 60 * 1000;
// Hàm cập nhật history và chart (giữ window 24h)
function pushDataPoint(point) {
  history.push(point);

  // lọc chỉ giữ 24h
  const cutoff = Date.now() - DAY_MS;
  history = history.filter(p => p.ts >= cutoff);

  // cập nhật chart labels & datasets (sắp theo thời gian)
  const labels = history.map(p => p.timeStr);
  const ds0 = history.map(p => p.voltage);
  const ds1 = history.map(p => p.current);
  const ds2 = history.map(p => p.temp);
  const ds3 = history.map(p => p.energy);
  const ds4 = history.map(p => p.power);

  multiBarChart.data.labels = labels;
  multiBarChart.data.datasets[0].data = ds0;
  multiBarChart.data.datasets[1].data = ds1;
  multiBarChart.data.datasets[2].data = ds2;
  multiBarChart.data.datasets[3].data = ds3;
  multiBarChart.data.datasets[4].data = ds4;
  multiBarChart.update();
}

// Cập nhật giao diện hiển thị chính
function updateUI(latest) {
  tempEl.textContent = `${latest.temp} °C`;
  voltageEl.textContent = latest.voltage;
  currentEl.textContent = latest.current;
  powerEl.textContent = latest.power;
  energyEl.textContent = latest.energy;

  if (latest.temp > FIRE_THRESHOLD) {
    fireBadge.textContent = "🔥 NGUY CƠ CHÁY";
    fireBadge.classList.remove("normal");
    fireBadge.classList.add("alert");
  } else {
    fireBadge.textContent = "Bình thường";
    fireBadge.classList.remove("alert");
    fireBadge.classList.add("normal");
  }
}

// Lắng nghe dữ liệu realtime từ Firebase
// Giả định dữ liệu nằm ở /sensors như trước, hoặc bạn có thể thay path
const sensorsRef = ref(db, "sensors");
onValue(sensorsRef, (snap) => {
  const data = snap.val();
  if (!data) return;

  // Chuyển giá trị an toàn
  const temp = parseFloat(data.temperature) || 0;
  const voltage = parseFloat(data.voltage) || 0;
  const current = parseFloat(data.current) || 0;
  const power = parseFloat(data.power) || (voltage * current) || 0;
  const energy = parseFloat(data.energy) || 0;

  const ts = Date.now();
  const timeStr = hhmm(ts);

  // cập nhật UI
  updateUI({ temp, voltage, current, power, energy });

  // nếu cháy -> lưu event
  if (temp > FIRE_THRESHOLD) {
    const ev = `${new Date(ts).toLocaleString()} - ${temp} °C`;
    fireEvents.push(ev);
    const li = document.createElement("li");
    li.textContent = ev;
    fireLogList.prepend(li);
  }

  // push dữ liệu vào history
  pushDataPoint({ ts, timeStr, temp, voltage, current, power, energy });
});

// Lưu file .txt (dữ liệu history hiện có)
saveBtn.addEventListener("click", () => {
  if (history.length === 0) {
    alert("Không có dữ liệu để lưu.");
    return;
  }
  const lines = history.map(h => {
    // CSV: timestamp_iso,HH:MM,temp,voltage,current,power,energy
    return `${new Date(h.ts).toISOString()},${h.timeStr},${h.temp},${h.voltage},${h.current},${h.power},${h.energy}`;
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `data_log_${new Date().toISOString().slice(0,10)}.txt`;
  link.click();
});

// Xóa dữ liệu cục bộ
clearBtn.addEventListener("click", () => {
  if (!confirm("Xóa dữ liệu cục bộ (chỉ xóa trên trình duyệt)?")) return;
  history = [];
  fireEvents = [];
  fireLogList.innerHTML = "";
  multiBarChart.data.labels = [];
  multiBarChart.data.datasets.forEach(ds => ds.data = []);
  multiBarChart.update();
});

