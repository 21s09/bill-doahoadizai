// Dữ liệu mặc định
let defaultData = {
  subTitle: "Foodtruck chú Thơm",
  discountName: "Giảm giá cho chú Thơm",
  discountType: "fixed",
  discountVal: 800000,
  depositVal: 0,
  items: [
    { name: "Standee 80x180cm", qty: 2, price: 0 },
    { name: "Bạt trên", qty: 1, price: 0 },
    { name: "Bạt dưới", qty: 1, price: 0 },
    { name: "Typo con cá Thơm", qty: 1, price: 0 },
    { name: "Bảng ký tên", qty: 1, price: 0 },
    { name: "Social post", qty: 3, price: 0 }
  ]
};

// Khôi phục dữ liệu từ LocalStorage (Lần export mới nhất)
let savedData = localStorage.getItem("last_invoice_data");
let state = savedData ? JSON.parse(savedData) : defaultData;

function formatMoney(num) {
  if (!num || num === 0) return "0";
  return num.toLocaleString('vi-VN');
}

function renderInputs() {
  document.getElementById("in-sub-title").value = state.subTitle;
  document.getElementById("in-discount-name").value = state.discountName;
  document.getElementById("in-discount-val").value = state.discountVal;
  document.getElementById("in-deposit-val").value = state.depositVal;

  const radios = document.getElementsByName("discount-type");
  for (let r of radios) {
    if (r.value === (state.discountType || "fixed")) r.checked = true;
  }

  const tbody = document.getElementById("input-items-body");
  tbody.innerHTML = "";
  state.items.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td><input type="text" value="${item.name}" oninput="updateItem(${index}, 'name', this.value)"></td>
        <td><input type="number" value="${item.qty}" oninput="updateItem(${index}, 'qty', this.value)"></td>
        <td><input type="number" value="${item.price || ''}" placeholder="0" oninput="updateItem(${index}, 'price', this.value)"></td>
        <td><button class="btn btn-remove" onclick="removeItem(${index})">X</button></td>
      </tr>
    `;
  });
}

function addItem() {
  state.items.push({ name: "", qty: 1, price: 0 });
  renderInputs();
  updateInvoice();
}

function removeItem(index) {
  state.items.splice(index, 1);
  renderInputs();
  updateInvoice();
}

function updateItem(index, key, value) {
  if (key === 'qty' || key === 'price') {
    state.items[index][key] = Number(value) || 0;
  } else {
    state.items[index][key] = value;
  }
  updateInvoice();
}

function updateInvoice() {
  state.subTitle = document.getElementById("in-sub-title").value;
  state.discountName = document.getElementById("in-discount-name").value;
  state.discountVal = Number(document.getElementById("in-discount-val").value) || 0;
  state.depositVal = Number(document.getElementById("in-deposit-val").value) || 0;

  const radios = document.getElementsByName("discount-type");
  for (let r of radios) {
    if (r.checked) state.discountType = r.value;
  }

  document.getElementById("out-sub-title").innerText = state.subTitle;

  const outBody = document.getElementById("out-items-body");
  outBody.innerHTML = "";
  let total = 0;

  state.items.forEach(item => {
    // Tự động nhân 1.000 đối với đơn giá nhập vào
    let realPrice = (item.price || 0) * 1000;
    let itemTotal = realPrice * (item.qty || 1);
    total += itemTotal;

    outBody.innerHTML += `
      <tr>
        <td class="col-item">${item.name}</td>
        <td class="col-qty">${item.qty}</td>
        <td class="col-price">${item.price ? formatMoney(realPrice) : ''}</td>
      </tr>
    `;
  });

  // Tính toán giảm giá (Số tiền cố định hoặc %)
  let discountCalculated = 0;
  if (state.discountType === 'percent') {
    discountCalculated = (total * state.discountVal) / 100;
  } else {
    discountCalculated = state.discountVal;
  }

  let deposit = state.depositVal;
  let balance = total - discountCalculated - deposit;

  document.getElementById("out-total").innerText = formatMoney(total);
  
  document.getElementById("out-discount-name").innerText = state.discountName + (state.discountType === 'percent' ? ` (${state.discountVal}%)` : '');
  document.getElementById("out-discount-val").innerText = formatMoney(discountCalculated);
  document.getElementById("out-deposit-val").innerText = formatMoney(deposit);
  document.getElementById("out-balance").innerText = formatMoney(balance > 0 ? balance : 0);
}

// Hàm 1: Tải ảnh về máy
function exportImage() {
  localStorage.setItem("last_invoice_data", JSON.stringify(state));
  const element = document.getElementById("invoice");
  const targetScale = 1200 / element.offsetWidth;

  html2canvas(element, { scale: targetScale }).then(canvas => {
    const link = document.createElement("a");
    link.download = `Bao_Gia_${state.subTitle.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

// Hàm 2: Sao chép ảnh trực tiếp vào Clipboard
async function copyImageToClipboard() {
  localStorage.setItem("last_invoice_data", JSON.stringify(state));
  const element = document.getElementById("invoice");
  const targetScale = 1200 / element.offsetWidth;

  try {
    const canvas = await html2canvas(element, { scale: targetScale });
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Có lỗi xảy ra khi tạo ảnh!");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert("Đã sao chép ảnh hóa đơn vào Clipboard! Bạn có thể Ctrl+V để dán ngay.");
    });
  } catch (err) {
    console.error(err);
    alert("Trình duyệt không hỗ trợ hoặc lỗi khi sao chép ảnh.");
  }
}

// Khởi chạy ban đầu
renderInputs();
updateInvoice();