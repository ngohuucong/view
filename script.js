// === Cấu hình Firebase ===
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === Lấy tham chiếu các thẻ HTML ===
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const energyEl = document.getElementById("energy");
const tempEl = document.getElementById("temperature");
const fireStatusEl = document.getElementById("fireStatus");
const fireLogEl = document.getElementById("fireLog");

// === Biểu đồ Chart.js ===
const ctx = document.getElementById("realtimeChart").getContext("2d");
let chart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Điện áp (V)", "Dòng điện (A)", "Công suất (W)", "Năng lượng (Wh)", "Nhiệt độ (°C)"],
    datasets: [{
      label: "Giá trị tức thời",
      data: [0, 0, 0, 0, 0],
      backgroundColor: ["#4B9CD3", "#76D7C4", "#F7DC6F", "#E59866", "#CD6155"]
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// === Hàm cập nhật dữ liệu hiển thị ===
function updateDisplay(data) {
  voltageEl.textContent = data.voltage ? data.voltage.toFixed(2) : "--";
  currentEl.textContent = data.current ? data.current.toFixed(2) : "--";
  powerEl.textContent = data.power ? data.power.toFixed(2) : "--";
  energyEl.textContent = data.energy ? data.energy.toFixed(2) : "--";
  tempEl.textContent = data.temperature ? data.temperature.toFixed(1) : "--";

  // Cập nhật biểu đồ
  chart.data.datasets[0].data = [
    data.voltage || 0,
    data.current || 0,
    data.power || 0,
    data.energy || 0,
    data.temperature || 0
  ];
  chart.update();
}

// === Lắng nghe dữ liệu từ Firebase ===
const sensorRef = db.ref("sensors"); // node sensors chứa dữ liệu PZEM & nhiệt độ
sensorRef.on("value", (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    updateDisplay(data);
  }
});

// === Báo cháy (boolean + nhật ký) ===
const fireRef = db.ref("fireAlarm");
fireRef.on("value", (snapshot) => {
  const fireData = snapshot.val();
  if (fireData) {
    const isFire = fireData.status === true;
    fireStatusEl.textContent = isFire ? "🔥 Có cháy!" : "✅ Bình thường";
    fireStatusEl.style.color = isFire ? "red" : "green";

    // Ghi nhật ký báo cháy (có timestamp)
    if (fireData.log) {
      fireLogEl.innerHTML = "";
      Object.keys(fireData.log).forEach((key) => {
        const log = fireData.log[key];
        const li = document.createElement("li");
        li.textContent = `${log.time} - ${log.message}`;
        fireLogEl.appendChild(li);
      });
    }
  }
});
