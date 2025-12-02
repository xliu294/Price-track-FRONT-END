// 是否使用假数据（后端 API 完成后可以改 false）
const USE_MOCK = true;

// Azure 后端 API URL
const AZURE_API_URL = "https://price-api-project.azurewebsites.net/api/AddVendorItem";

// 我们要展示的 4 个商品
const PRODUCTS = ["Spam", "Eggs", "Milk", "Bread"];

// 对应的 UI 展示名称
const PRODUCT_LABELS = {
  Spam: "SPAM Classic",
  Eggs: "Large Eggs (Dozen)",
  Milk: "Whole Milk (1 Gallon)",
  Bread: "White Bread Loaf",
};

// 商品图片（可以以后换成你自己的）
const PRODUCT_IMAGES = {
  Spam: "https://www.spam.com/wp-content/uploads/2019/08/image-product_spam-classic-7oz.png",
  Eggs: "https://media.istockphoto.com/id/104121932/photo/dozen-eggs.jpg?s=612x612&w=0&k=20&c=4V9zUEtMF3CtYH0WsyjYlAXVyyyjFIk9YWel2Eul-WU=",
  Milk: "https://i5.walmartimages.com/asr/274213e9-d32e-4d87-ba4f-fc22e08bfea4_1.81c26ad2bb3ab0ca92ba1add575f61f4.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF",
  Bread: "https://heartscontentfarmhouse.com/wp-content/uploads/2023/01/recipe-card-amish-white-bread.jpg",
};

// 初始价格：4 个商品 × 2 个网站
let basePrices = {
  "amazon.com": {
    Spam: 3.5,
    Eggs: 4.99,
    Milk: 4.29,
    Bread: 2.49,
  },
  "walmart.com": {
    Spam: 2.98,
    Eggs: 5.24,
    Milk: 3.98,
    Bread: 2.19,
  },
};

// 历史记录
let mockData = [];

// 随机波动生成新价格
function generateFakeData() {
  const now = new Date().toISOString();
  const rows = [];

  Object.keys(basePrices).forEach((site) => {
    PRODUCTS.forEach((product) => {
      const currentPrice = basePrices[site][product];
      const change = Math.random() * 0.06 - 0.03; // -3% ~ +3%
      const newPrice = parseFloat((currentPrice * (1 + change)).toFixed(2));

      basePrices[site][product] = newPrice;

      rows.push({
        itemName: product,
        price: newPrice,
        website: site,
        timestamp: now,
      });
    });
  });

  return rows; // 每次 8 条
}

// 把一条记录发给 Azure 后端
async function uploadPriceToAzure(item) {
  try {
    const response = await fetch(AZURE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: item.itemName,
        price: item.price,
        store: item.website,
      }),
    });

    if (response.ok) {
      console.log(`✅ Saved ${item.website} ${item.itemName} ($${item.price}) to Azure DB`);
    } else {
      console.warn(`⚠️ Failed to save to DB: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("❌ Error connecting to Azure API:", error);
  }
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

async function loadPrices() {
  // Step 1: 生成新价格
  const newRows = generateFakeData();
  mockData = mockData.concat(newRows);

  // 把新生成的记录发到后端
  newRows.forEach((row) => uploadPriceToAzure(row));

  // 历史记录最多保留 80 条
  if (mockData.length > 80) {
    mockData = mockData.slice(mockData.length - 80);
  }

  const data = mockData;

  // Step 2: 填历史价格表
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";

  data
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((row) => {
      const tr = document.createElement("tr");
      const storeBadgeClass =
        row.website === "amazon.com" ? "pt-badge-amazon" : "pt-badge-walmart";
      tr.innerHTML = `
        <td>${formatTime(row.timestamp)}</td>
        <td><span class="${storeBadgeClass} px-2 py-1">${row.website.includes("amazon") ? "Amazon" : "Walmart"}</span></td>
        <td>${PRODUCT_LABELS[row.itemName] || row.itemName}</td>
        <td class="text-end">$${row.price.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

  // Step 3: 找“每个网站 × 每个商品”的最新记录
  const latestByKey = {};
  data.forEach((row) => {
    const key = `${row.website}-${row.itemName}`;
    if (!latestByKey[key] || new Date(row.timestamp) > new Date(latestByKey[key].timestamp)) {
      latestByKey[key] = row;
    }
  });

  // 按商品汇总
  const groupedByItem = {};
  Object.values(latestByKey).forEach((row) => {
    if (!groupedByItem[row.itemName]) groupedByItem[row.itemName] = [];
    groupedByItem[row.itemName].push(row);
  });

  // Step 4: 渲染商品卡片
  const currentDiv = document.getElementById("current-prices");
  currentDiv.innerHTML = "";

  PRODUCTS.forEach((productKey) => {
    const rowsForItem = groupedByItem[productKey] || [];
    if (rowsForItem.length === 0) return;

    const displayName = PRODUCT_LABELS[productKey] || productKey;
    const imageUrl = PRODUCT_IMAGES[productKey];

    const latestTime = rowsForItem[0].timestamp;

    const amazonRow = rowsForItem.find((r) => r.website === "amazon.com");
    const walmartRow = rowsForItem.find((r) => r.website === "walmart.com");

    const amazonPrice = amazonRow ? `$${amazonRow.price.toFixed(2)}` : "--";
    const walmartPrice = walmartRow ? `$${walmartRow.price.toFixed(2)}` : "--";

    currentDiv.innerHTML += `
      <div class="pt-product-card">
        <div class="pt-product-image-wrapper">
          <img src="${imageUrl}" alt="${displayName}">
        </div>
        <div class="pt-product-content">
          <div>
            <div class="pt-product-header">
              <h3 class="pt-product-name">${displayName}</h3>
              <span class="pt-trend-icon">↗</span>
            </div>
            <div class="pt-store-row">
              <span>amazon.com</span>
              <span class="pt-store-price">${amazonPrice}</span>
            </div>
            <div class="pt-store-row">
              <span>walmart.com</span>
              <span class="pt-store-price">${walmartPrice}</span>
            </div>
          </div>
          <p class="pt-product-updated">Last updated: ${formatTime(latestTime)}</p >
        </div>
      </div>
    `;
  });

  // Step 5: 顶部“Dashboard refreshed at …”
  document.getElementById("last-updated").textContent =
    "Dashboard refreshed at: " + new Date().toISOString();
}

// 页面加载后自动运行 & 每 20 秒刷新
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");
  loadPrices();
  setInterval(loadPrices, 20000);
});