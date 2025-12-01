// 是否使用假数据（后端 API 完成后可以改 false）
const USE_MOCK = true;


// 初始价格
let basePrices = {
  "amazon.com": 3.50,
  "walmart.com": 3.40
};

// 历史记录（开始为空）
let mockData = [];
// 每次生成新的价格（随机上涨或下跌）
function generateFakeData() {
  const now = new Date().toISOString();

  // 让每个网站价格上下浮动 3%
  Object.keys(basePrices).forEach(site => {
    const change = Math.random() * 0.06 - 0.03; // -3% ~ +3%
    basePrices[site] = parseFloat((basePrices[site] * (1 + change)).toFixed(2));
  });

  return [
    { itemName: "Spam", price: basePrices["amazon.com"], website: "amazon.com", timestamp: now },
    { itemName: "Spam", price: basePrices["walmart.com"], website: "walmart.com", timestamp: now }
  ];
}


async function loadPrices() {

  // Step 1: 每次生成新的价格并加入历史
const newRows = generateFakeData();   // 本次最新价格（2条）
mockData = mockData.concat(newRows);  // 添加到历史记录中

// 可选：最多保留最近 50 条数据（避免太长）
if (mockData.length > 50) {
  mockData = mockData.slice(mockData.length - 50);
}

let data = mockData;  // 用全部历史记录渲染界面


  // Step 2: 填充历史价格表格
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = ""; // 清空旧内容

  data
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // 按时间从新到旧排序
    .forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.timestamp}</td>
        <td>${row.website}</td>
        <td>$${row.price.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

  // Step 3: 找每个网站“最新价格”
  const latestBySite = {};
  data.forEach(row => {
    const site = row.website;
    if (!latestBySite[site] || new Date(row.timestamp) > new Date(latestBySite[site].timestamp)) {
      latestBySite[site] = row;
    }
  });

  // Step 4: 显示当前价格卡片
  const currentDiv = document.getElementById("current-prices");
  currentDiv.innerHTML = "";

  Object.values(latestBySite).forEach(row => {
    currentDiv.innerHTML += `
      <div class="col-md-6 mb-3">
        <div class="card p-3 shadow-sm">
          <h5 class="card-title">${row.website}</h5>
          <p class="card-text fs-4 mb-1">$${row.price.toFixed(2)}</p>
          <p class="text-muted small mb-0">Last updated: ${row.timestamp}</p>
        </div>
      </div>
    `;
  });

  // Step 5: 刷新时间
  document.getElementById("last-updated").textContent =
    "Dashboard refreshed at: " + new Date().toISOString();
}

document.addEventListener("DOMContentLoaded", () => {
  loadPrices();                      // 先跑一次
  setInterval(loadPrices, 20000);    // 之后每 20 秒跑一次
});


