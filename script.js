// ⚡ Firebase config của bạn
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM elements
const tempEl = document.getElementById("tempValue");
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const energyEl = document.getElementById("energy");
const fireEl = document.getElementById("fireStatus");
const fireCard = document.getElementById("fireCard");
const fireLog = document.getElementById("fireLog");

// Chart setup
const ctx = document.getElementById('realtimeChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Điện áp', 'Dòng điện', 'Công suất', 'Năng lượng', 'Nhiệt độ'],
    datasets: [{
      label: 'Giá trị tức thời',
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#4f8ef7', '#00c6ff', '#ffce56', '#ffa600', '#ff4d4d']
    }]
  },
  options: { scales: { y: { beginAtZero: true } } }
});

// Lấy dữ liệu realtime từ Firebase
db.ref("sensors").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  tempEl.textContent = `${data.temperature} °C`;
  voltageEl.textContent = `${data.voltage} V`;
  currentEl.textContent = `${data.current} A`;
  powerEl.textContent = `${data.power} W`;
  energyEl.textContent = `${data.energy} Wh`;

  // Cập nhật chart
  chart.data.datasets[0].data = [
    data.voltage, data.current, data.power, data.energy, data.temperature
  ];
  chart.update();
});

// Báo cháy
db.ref("fire").on("value", snap => {
  const fire = snap.val();
  if (fire === true) {
    fireEl.textContent = "🔥 CẢNH BÁO CHÁY";
    fireEl.className = "danger";
    fireCard.style.background = "#ffe5e5";
  } else {
    fireEl.textContent = "An toàn 🔵";
    fireEl.className = "safe";
    fireCard.style.background = "white";
  }
});

// Nhật ký báo cháy
db.ref("fire_logs").limitToLast(10).on("child_added", snap => {
  const log = snap.val();
  const li = document.createElement("li");
  li.textContent = `${log.time} - ${log.message}`;
  fireLog.prepend(li);
});
