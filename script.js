import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

/* === Firebase cấu hình === */
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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* === Các phần tử HTML === */
const tempEl = document.getElementById("temp-value");
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const energyEl = document.getElementById("energy");
const fireBadge = document.getElementById("fire-badge");
const fireLogList = document.getElementById("fire-log-list");

/* === Khởi tạo biểu đồ === */
const ctx = document.getElementById("barChart").getContext("2d");
const barChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Nhiệt độ", "Điện áp", "Dòng điện", "Công suất", "Năng lượng"],
    datasets: [{
      label: "Giá trị hiện tại",
      data: [0, 0, 0, 0, 0],
      backgroundColor: [
        "rgba(255,99,71,0.9)",
        "rgba(11,118,255,0.85)",
        "rgba(0,200,150,0.85)",
        "rgba(255,193,7,0.9)",
        "rgba(160,32,240,0.85)"
      ]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Giá trị" }
      }
    }
  }
});

/* === Cập nhật dữ liệu tức thời từ Firebase === */
const sensorRef = ref(db, "sensors");
onValue(sensorRef, (snapshot) => {
  const d = snapshot.val();
  if (!d) return;

  const temp = parseFloat(d.temperature) || 0;
  const voltage = parseFloat(d.voltage) || 0;
  const current = parseFloat(d.current) || 0;
  const power = parseFloat(d.power) || (voltage * current);
  const energy = parseFloat(d.energy) || 0;

  tempEl.textContent = `${temp} °C`;
  voltageEl.textContent = voltage.toFixed(1);
  currentEl.textContent = current.toFixed(2);
  powerEl.textContent = power.toFixed(1);
  energyEl.textContent = energy.toFixed(2);

  // Cập nhật biểu đồ
  barChart.data.datasets[0].data = [temp, voltage, current, power, energy];
  barChart.update();
});

/* === Báo cháy (boolean) === */
const fireRef = ref(db, "fireStatus");
onValue(fireRef, (snap) => {
  const fire = snap.val();
  if (fire === true) {
    fireBadge.textContent = "🔥 CẢNH BÁO CHÁY";
    fireBadge.classList.remove("normal");
    fireBadge.classList.add("alert");
  } else {
    fireBadge.textContent = "Bình thường";
    fireBadge.classList.remove("alert");
    fireBadge.classList.add("normal");
  }
});

/* === Nhật ký báo cháy === */
const fireLogRef = ref(db, "fireLog");
onValue(fireLogRef, (snap) => {
  const logs = snap.val();
  fireLogList.innerHTML = "";
  if (logs) {
    Object.values(logs).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      fireLogList.prepend(li);
    });
  }
});
