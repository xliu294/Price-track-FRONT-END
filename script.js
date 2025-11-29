// 是否使用假数据（后端 API 完成后可以改 false）
const USE_MOCK = true;

// 假数据，模拟后端返回的结构
const mockData = [
  { itemName: "Spam", price: 3.50, website: "amazon.com",  timestamp: "2025-11-18T12:00:00Z" },
  { itemName: "Spam", price: 3.40, website: "walmart.com", timestamp: "2025-11-18T12:05:00Z" },
  { itemName: "Spam", price: 3.60, website: "amazon.com",  timestamp: "2025-11-18T06:00:00Z" },
  { itemName: "Spam", price: 3.55, website: "walmart.com", timestamp: "2025-11-18T06:00:00Z" }
];

async function loadPrices() {

  // Step 1: 选择数据来源（现在用 mock）
  let data = mockData;

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

// 页面加载后自动运行 loadPrices()
document.addEventListener("DOMContentLoaded", loadPrices);
