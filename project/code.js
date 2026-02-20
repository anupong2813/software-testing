const ss = SpreadsheetApp.getActiveSpreadsheet();
const menuSheet = ss.getSheetByName("MenuItems");
const orderSheet = ss.getSheetByName("Orders");
const navSheet = ss.getSheetByName("NavbarButtons");
const tableSheet = ss.getSheetByName("Tables");

function doGet(e) {
  if (e.parameter.v === 'manifest') {
    return getManifest();
  }
  let template = HtmlService.createTemplateFromFile('Index');
  template.navbarButtons = getNavbarButtons();
  template.availableTables = getAvailableTables();
  
  return template.evaluate()
    .setTitle("Restaurant OS")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getNavbarButtons() {
  const data = navSheet.getDataRange().getValues();
  data.shift();
  return data.map(row => ({ name: row[0], icon: row[1] }));
}

function getMenuItems() {
  const data = menuSheet.getDataRange().getValues();
  data.shift();
  return data.map(row => ({
    name: row[0],
    description: row[1],
    price: parseFloat(row[2]),
    extraPrice: row[3] ? parseFloat(row[3]) : null,
    category: row[4],
    imageUrl: row[5],
    status: row[6] || 'Available',
    trackSales: row[7] ? row[7].trim().toLowerCase() === 'yes' : false // อ่านคอลัมน์ที่ 8 (index 7) ถ้าเป็น 'Yes' จะได้ true
  }));
}

function getAvailableTables() {
  const allTables = tableSheet.getDataRange().getValues();
  allTables.shift();
  const available = allTables.filter(row => row[1] === 'Available' || row[0] === 'Takeaway');
  const uniqueTableNames = [...new Set(available.map(row => row[0]))];
  return uniqueTableNames;
}

function updateTableStatus(tableName, newStatus) {
  const data = tableSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == tableName) {
      tableSheet.getRange(i + 1, 2).setValue(newStatus);
      break;
    }
  }
}


function processOrder(orderDetails) {
  try {
    const { tableNumber, customerCount, items, discount } = orderDetails;
    const timestamp = new Date();
    const status = "Waiting";

    const scriptTimeZone = Session.getScriptTimeZone();
    const formattedDate = Utilities.formatDate(timestamp, scriptTimeZone, "yyMMddHHmmSS");
    const orderNumber = "ORD-" + formattedDate;

    const headers = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0];

    let orderGrandTotal = 0;
    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      let finalPrice = itemSubtotal;
      if (discount && discount.value > 0) {
        finalPrice = itemSubtotal * (1 - discount.value);
      }
      orderGrandTotal += finalPrice;
    });

    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      let finalPrice = itemSubtotal;

      if (discount && discount.value > 0) {
        finalPrice = itemSubtotal * (1 - discount.value);
      }
      
      const newRow = new Array(headers.length).fill(""); // สร้าง Array ว่างขนาดเท่าจำนวนคอลัมน์

      // เติมข้อมูลลงใน Array ตาม Index ที่ได้จาก Header
      newRow[headers.indexOf("Timestamp")] = timestamp;
      newRow[headers.indexOf("OrderNumber")] = orderNumber;
      newRow[headers.indexOf("CustomerCount")] = customerCount;
      newRow[headers.indexOf("TableNumber")] = tableNumber;
      newRow[headers.indexOf("ItemName")] = item.name;
      newRow[headers.indexOf("ItemNote")] = item.note || "";
      newRow[headers.indexOf("Quantity")] = item.quantity;
      newRow[headers.indexOf("PricePerItem")] = item.price;
      newRow[headers.indexOf("DiscountName")] = discount ? discount.name : "";
      newRow[headers.indexOf("DiscountValue")] = discount ? discount.value : "";
      newRow[headers.indexOf("ItemSubtotal")] = itemSubtotal;
      newRow[headers.indexOf("TotalPrice")] = finalPrice;
      newRow[headers.indexOf("Status")] = status;
      newRow[headers.indexOf("OrderGrandTotal")] = orderGrandTotal;

      
      orderSheet.appendRow(newRow);
    });

    if (tableNumber !== 'Takeaway') {
      updateTableStatus(tableNumber, 'Occupied');
    }

    return { success: true, orderNumber: orderNumber, tableNumber: tableNumber };
  } catch (error) {
    Logger.log("Error in processOrder: " + error.toString());
    return { success: false, message: "Error in processOrder: " + error.message };
  }
}

function getOrderHistory(dateString) {
  try {
    if (!dateString) {
      Logger.log("No dateString provided to getOrderHistory.");
      return {};
    }

    const orderData = orderSheet.getDataRange().getValues();
    if (orderData.length < 2) return {};

    const headers = orderData.shift();
    const timestampIndex = headers.indexOf("Timestamp");
    
    // --- NEW: Filter the rows by the selected date BEFORE grouping ---
    const scriptTimeZone = Session.getScriptTimeZone();
    const filteredData = orderData.filter(row => {
      const rowTimestamp = new Date(row[timestampIndex]);
      if (isNaN(rowTimestamp.getTime())) return false; // Skip invalid dates
      
      // Format the timestamp from the sheet to 'yyyy-MM-dd' to compare with the input
      const rowDateString = Utilities.formatDate(rowTimestamp, scriptTimeZone, 'yyyy-MM-dd');
      return rowDateString === dateString;
    });

    if (filteredData.length === 0) {
      Logger.log(`No orders found for date: ${dateString}`);
      return {}; // Return empty if no orders match the date
    }

    // The rest of the function now groups the PRE-FILTERED data
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const tableNumberIndex = headers.indexOf("TableNumber");
    const statusIndex = headers.indexOf("Status");
    const itemNameIndex = headers.indexOf("ItemName");
    const quantityIndex = headers.indexOf("Quantity");

    const groupedOrders = filteredData.reduce((acc, row) => {
      // ... (The grouping logic inside reduce is exactly the same as before) ...
      const orderNumber = row[orderNumberIndex];
      if (!acc[orderNumber]) {
        const dateObject = new Date(row[timestampIndex]);
        acc[orderNumber] = {
          orderNumber: orderNumber,
          tableNumber: row[tableNumberIndex],
          status: row[statusIndex],
          timestampForDisplay: dateObject.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
          isoTimestamp: dateObject.toISOString(),
          items: []
        };
      }
      acc[orderNumber].items.push({
        name: row[itemNameIndex],
        quantity: row[quantityIndex]
      });
      return acc;
    }, {});

    return groupedOrders;

  } catch (e) {
    Logger.log("A critical error occurred in getOrderHistory: " + e.toString());
    return {};
  }
}


function getNewOrders(lastKnownIsoTimestamp) {
  if (!lastKnownIsoTimestamp) return {};

  const orderData = orderSheet.getDataRange().getValues();
  if (orderData.length < 2) return {};

  const headers = orderData.shift();
  const timestampIndex = headers.indexOf("Timestamp");
  
  const newOrderRows = orderData.filter(row => {
    const rowTimestamp = new Date(row[timestampIndex]);
    return rowTimestamp.toISOString() > lastKnownIsoTimestamp;
  });

  if (newOrderRows.length === 0) return {};

  const orderNumberIndex = headers.indexOf("OrderNumber");
  const tableNumberIndex = headers.indexOf("TableNumber");
  const statusIndex = headers.indexOf("Status");
  const itemNameIndex = headers.indexOf("ItemName");
  const quantityIndex = headers.indexOf("Quantity");

  const groupedNewOrders = newOrderRows.reduce((acc, row) => {
    const orderNumber = row[orderNumberIndex];
    if (!acc[orderNumber]) {
      const dateObject = new Date(row[timestampIndex]);
      acc[orderNumber] = {
        orderNumber: orderNumber,
        tableNumber: row[tableNumberIndex],
        status: row[statusIndex],
        timestampForDisplay: dateObject.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        isoTimestamp: dateObject.toISOString(),
        items: []
      };
    }
    acc[orderNumber].items.push({
      name: row[itemNameIndex],
      quantity: row[quantityIndex]
    });
    return acc;
  }, {});
  
  return groupedNewOrders;
}

/**
 * Fetches all available promotions from the 'Discounts' sheet.
 * @returns {Array<Object>} An array of discount objects {name, value}.
 */
function getDiscounts() {
  try {
    const discountSheet = ss.getSheetByName("Discounts");
    const data = discountSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    data.shift();
    return data.map(row => ({
      name: row[0],
      value: parseFloat(row[1])
    })).filter(d => d.name && !isNaN(d.value));
  } catch (e) {
    Logger.log("Error getting discounts: " + e.toString());
    return [];
  }
}
function processPayment(paymentDetails) {
  try {
    const { orderNumber, paymentMethod, cashReceived, changeGiven, imageData } = paymentDetails;
    const newStatus = "Paid";
    
    // --- 1. จัดการการอัปโหลดรูปภาพ (ถ้ามี) ---
    let imageURL = "";
    if (paymentMethod === 'Transfer' && imageData) {
      const driveFolder = DriveApp.getFolderById("1cFfNZUyi7AX1UPNRkD07hmxxgLVRHGTy");
      const decodedImage = Utilities.base64Decode(imageData.split(',')[1]);
      const blob = Utilities.newBlob(decodedImage, MimeType.PNG, `${orderNumber}-proof.png`);
      const file = driveFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // ทำให้ลิงก์ดูได้
      imageURL = file.getUrl();
    }

    // --- 2. อัปเดตข้อมูลใน Google Sheets ---
    const ordersData = orderSheet.getDataRange().getValues();
    const headers = ordersData[0];
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const statusIndex = headers.indexOf("Status");
    const tableNumberIndex = headers.indexOf("TableNumber");
    // หา Index ของคอลัมน์ใหม่
    const paymentMethodIndex = headers.indexOf("PaymentMethod");
    const cashReceivedIndex = headers.indexOf("CashReceived");
    const changeGivenIndex = headers.indexOf("ChangeGiven");
    const proofImageURLIndex = headers.indexOf("ProofImageURL");
    
    let tableToClear = null;

    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][orderNumberIndex] === orderNumber) {
        // อัปเดตสถานะและข้อมูลการชำระเงิน
        orderSheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
        orderSheet.getRange(i + 1, paymentMethodIndex + 1).setValue(paymentMethod);
        orderSheet.getRange(i + 1, cashReceivedIndex + 1).setValue(cashReceived || "");
        orderSheet.getRange(i + 1, changeGivenIndex + 1).setValue(changeGiven || "");
        orderSheet.getRange(i + 1, proofImageURLIndex + 1).setValue(imageURL || "");

        // เก็บชื่อโต๊ะไว้เคลียร์
        if (!tableToClear) {
          tableToClear = ordersData[i][tableNumberIndex];
        }
      }
    }

    // --- 3. ทำให้โต๊ะกลับมาว่าง ---
    if (tableToClear && tableToClear !== 'Takeaway') {
      updateTableStatus(tableToClear, 'Available');
    }

    return { success: true, orderNumber: orderNumber, newStatus: newStatus };

  } catch (e) {
    Logger.log("Error in processPayment: " + e.toString());
    return { success: false, message: e.message };
  }
}
function updateOrderStatus(orderNumber, newStatus) {
  try {
    const ordersData = orderSheet.getDataRange().getValues();
    const headers = ordersData[0];
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const statusIndex = headers.indexOf("Status");

    // Loop through all order rows to find matching orderNumber
    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][orderNumberIndex] === orderNumber) {
        orderSheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
      }
    }
    
    return { success: true, orderNumber: orderNumber, newStatus: newStatus };
  } catch (e) {
    Logger.log("Error in updateOrderStatus: " + e.toString());
    return { success: false, message: e.message };
  }
}
function cancelOrder(orderNumber) {
  try {
    const newStatus = "Cancelled";
    const ordersData = orderSheet.getDataRange().getValues();
    const headers = ordersData[0];
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const statusIndex = headers.indexOf("Status");
    const tableNumberIndex = headers.indexOf("TableNumber");
    let tableToFree = null;

    // Loop through all order rows to find and update matching orderNumber
    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][orderNumberIndex] === orderNumber) {
        // Update the status in this row
        orderSheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
        
        // Store the table name to free it up later
        if (!tableToFree) { // Only need to get it once per order
          tableToFree = ordersData[i][tableNumberIndex];
        }
      }
    }
    
    // If a table was associated with the order and it's not Takeaway, free it up
    if (tableToFree && tableToFree !== 'Takeaway') {
      updateTableStatus(tableToFree, 'Available');
    }

    return { success: true, orderNumber: orderNumber, newStatus: newStatus };
  } catch (e) {
    Logger.log("Error in cancelOrder: " + e.toString());
    return { success: false, message: e.message };
  }
}

function getOrderDetails(orderNumber) {
  try {
    const ordersData = orderSheet.getDataRange().getValues();
    const headers = ordersData[0];
    
    // --- หา Index ของทุกคอลัมน์ที่จำเป็น ---
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const itemNameIndex = headers.indexOf("ItemName");
    const itemNoteIndex = headers.indexOf("ItemNote");
    const quantityIndex = headers.indexOf("Quantity");
    const itemSubtotalIndex = headers.indexOf("ItemSubtotal");
    const totalPriceIndex = headers.indexOf("TotalPrice");
    const tableNumberIndex = headers.indexOf("TableNumber");
    const timestampIndex = headers.indexOf("Timestamp");
    const paymentMethodIndex = headers.indexOf("PaymentMethod"); 
    const cashReceivedIndex = headers.indexOf("CashReceived");   
    const changeGivenIndex = headers.indexOf("ChangeGiven");     
    
    let orderDetails = {
      orderNumber: orderNumber,
      tableNumber: "",
      timestamp: "",
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      paymentMethod: "", 
      cashReceived: 0,   
      changeGiven: 0     
    };
    
    let found = false;
    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][orderNumberIndex] === orderNumber) {
        if (!found) { // ดึงข้อมูลที่ไม่ซ้ำกันแค่ครั้งแรกที่เจอ
          found = true;
          orderDetails.tableNumber = ordersData[i][tableNumberIndex];
          let dateObj = new Date(ordersData[i][timestampIndex]);
          orderDetails.timestamp = dateObj.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
          // ดึงข้อมูลการชำระเงิน
          orderDetails.paymentMethod = ordersData[i][paymentMethodIndex];
          orderDetails.cashReceived = parseFloat(ordersData[i][cashReceivedIndex] || 0);
          orderDetails.changeGiven = parseFloat(ordersData[i][changeGivenIndex] || 0);
        }
        
        const itemSubtotal = parseFloat(ordersData[i][itemSubtotalIndex] || 0);
        const totalPrice = parseFloat(ordersData[i][totalPriceIndex] || 0);
        
        const item = {
          name: ordersData[i][itemNameIndex],
          note: ordersData[i][itemNoteIndex],
          quantity: parseInt(ordersData[i][quantityIndex] || 0),
          totalPrice: itemSubtotal
        };
        orderDetails.items.push(item);
        orderDetails.subtotal += itemSubtotal;
        orderDetails.total += totalPrice;
      }
    }
    
    if (!found) {
      throw new Error("Order not found: " + orderNumber);
    }

    orderDetails.discountAmount = orderDetails.subtotal - orderDetails.total;
    
    return orderDetails;

  } catch (e) {
    Logger.log("Error in getOrderDetails: " + e.toString());
    throw new Error("Could not retrieve order details. " + e.message);
  }
}


function updateMenuItemStatus(itemName, newStatus) {
  try {
    const data = menuSheet.getDataRange().getValues();
    const headers = data.shift(); // เอา header ออก
    const nameIndex = headers.indexOf("Name");
    const statusIndex = headers.indexOf("Status");

    if (statusIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'Status' ในชีท MenuItems");
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i][nameIndex] === itemName) {
        // เจอแถวที่ต้องการอัปเดต (บวก 2 เพราะเรา shift header ไป 1 และ index เริ่มที่ 0)
        menuSheet.getRange(i + 2, statusIndex + 1).setValue(newStatus);
        return { success: true, itemName: itemName, newStatus: newStatus };
      }
    }

    // ถ้าวนลูปจนจบแล้วยังไม่เจอ
    return { success: false, message: "ไม่พบเมนูชื่อ: " + itemName };

  } catch (e) {
    Logger.log("Error in updateMenuItemStatus: " + e.toString());
    return { success: false, message: e.message };
  }
}


function getDashboardData(reportType = 'last_days', value = 7) { // <<< เพิ่มพารามิเตอร์และค่าเริ่มต้น
  try {
    // ส่วนนี้เหมือนเดิม
    const trackableMenuItems = getMenuItems().filter(item => item.trackSales);
    const trackableItemNames = new Set(trackableMenuItems.map(item => item.name));
    const orderData = orderSheet.getDataRange().getValues();
    const headers = orderData.shift();

    if (orderData.length === 0) {
      return { dailySales: 0, monthlySales: 0, quarterlySales: 0, topSellingItems: [], salesByDay: {}, reportTitle: "ไม่มีข้อมูล" };
    }

    const now = new Date();
    // ส่วนคำนวณยอดขายวันนี้, เดือนนี้, ไตรมาสนี้ ยังคงเหมือนเดิม
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonthStatic = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    // ... (ประกาศ Index ของคอลัมน์ต่างๆ เหมือนเดิม)
    const timestampIndex = headers.indexOf("Timestamp");
    const grandTotalIndex = headers.indexOf("OrderGrandTotal");
    const orderNumberIndex = headers.indexOf("OrderNumber");
    const itemNameIndex = headers.indexOf("ItemName");
    const quantityIndex = headers.indexOf("Quantity");
    const statusIndex = headers.indexOf("Status");

    let dailySales = 0, monthlySales = 0, quarterlySales = 0;
    const itemSales = {}, salesByDay = {}; // salesByDay จะถูกเติมค่าแบบไดนามิก
    const processedOrders = new Set();
    
    // --- ส่วนตรรกะใหม่สำหรับกำหนดช่วงเวลาของกราฟ ---
    let chartStartDate, chartEndDate, reportTitle;

    if (reportType === 'last_days') {
      const days = parseInt(value) || 7;
      chartStartDate = new Date();
      chartStartDate.setDate(now.getDate() - (days - 1));
      chartStartDate.setHours(0, 0, 0, 0);
      chartEndDate = new Date(); // สิ้นสุดที่ปัจจุบัน
      reportTitle = `ยอดขายย้อนหลัง ${days} วัน`;
    } else if (reportType === 'by_month') {
      const [year, month] = value.split('-').map(Number);
      chartStartDate = new Date(year, month - 1, 1);
      chartEndDate = new Date(year, month, 1); // ใช้เป็นวันแรกของเดือนถัดไปเพื่อการเปรียบเทียบที่ง่าย
      reportTitle = `ยอดขายเดือน ${chartStartDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}`;
    }

    for (let i = orderData.length - 1; i >= 0; i--) {
      const row = orderData[i];
      if (row[statusIndex] === 'Cancelled') {
        continue;
      }
      
      const timestamp = new Date(row[timestampIndex]);
      const orderNumber = row[orderNumberIndex];
      const grandTotal = parseFloat(row[grandTotalIndex] || 0);

      if (!processedOrders.has(orderNumber)) {
        if (timestamp >= today) dailySales += grandTotal;
        if (timestamp >= startOfMonthStatic) monthlySales += grandTotal;
        if (timestamp >= startOfQuarter) quarterlySales += grandTotal;
        processedOrders.add(orderNumber);
      }
      
      const itemName = row[itemNameIndex];
      if (trackableItemNames.has(itemName)) {
        const quantity = parseInt(row[quantityIndex] || 0);
        itemSales[itemName] = (itemSales[itemName] || 0) + quantity;
      }
      
      if (timestamp >= chartStartDate && timestamp < chartEndDate) {
        // ใช้ grandTotal จากออเดอร์ที่ไม่ซ้ำกัน
        if (!processedOrders.has(orderNumber + "_chart")) {
          const dayKey = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd");
          salesByDay[dayKey] = (salesByDay[dayKey] || 0) + grandTotal;
          processedOrders.add(orderNumber + "_chart");
        }
      }
    }
    
    const topSellingItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .map(([name, quantity]) => ({ name, quantity }));

    return { dailySales, monthlySales, quarterlySales, topSellingItems, salesByDay, reportTitle };

  } catch (e) {
    Logger.log("Error in getDashboardData: " + e.toString());
    return { success: false, message: e.message };
  }
}