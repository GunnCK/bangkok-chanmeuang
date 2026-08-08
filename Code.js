// กำหนด Spreadsheet ID และชื่อ Sheet
const SHEET_ID = '1bgZqJ5fiDbA0wSGNslYnmo-WVEk2K9v3dXqaNEA8iik';
const SHEET_NAME = 'Condo Listing';

// ฟังก์ชันเริ่มแรกสำหรับเปิดหน้า Web App
function doGet(e) {
  let page = 'Login'; // เริ่มต้นให้เปิดหน้า Login ก่อนเสมอ
  if (e.parameter.page) {
    page = e.parameter.page;
  }
  
  const title = page === 'Login' ? 'Bangkok Chanmeuang - Login' : 'Bangkok Chanmeuang - Condo Listing';
  
  const template = HtmlService.createTemplateFromFile(page);
  template.token = e.parameter.token || '';
  
  return template.evaluate()
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ฟังก์ชันดึง URL ปัจจุบันของ Web App เพื่อใช้สำหรับการ Redirect หน้า
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

// ฟังก์ชันดึงข้อมูลจาก Google Sheet เพื่อไปแสดงในตาราง
function getData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      createSheetWithHeaders(ss);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    let result = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.join('') === '') continue;

      let leaseStartStr = row[15] instanceof Date ? Utilities.formatDate(row[15], Session.getScriptTimeZone(), "yyyy-MM-dd") : row[15];
      let leaseEndStr = row[16] instanceof Date ? Utilities.formatDate(row[16], Session.getScriptTimeZone(), "yyyy-MM-dd") : row[16];

      result.push({
        rowIndex: i + 1,
        no: row[0],
        condo: row[1],
        roomType: row[2],
        building: row[3],
        floor: row[4],
        room: row[5],
        size: row[6],
        bed: row[7],
        bath: row[8],
        parking: row[9],
        zone: row[10],
        district: row[11],
        sales: row[12],
        status: row[13],
        price: row[14],
        leaseStart: leaseStartStr,
        leaseEnd: leaseEndStr,
        type: row[17],
        facebook: row[18],
        googleMap: row[19],
        remark: row[20],
        propertyType: row[21],
        petFriendly: row[22],
        ownerName: row[23] || "",
        ownerPhone: row[24] || "",
        ownerLine: row[25] || "",
        ownerFacebook: row[26] || ""
      });
    }
    return result.reverse();
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function saveData(formObj) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    let propertyNo = formObj.no;
    
    // หากเป็นโหมดเพิ่มใหม่ (ไม่มี rowIndex) ให้รันเลขรหัสทรัพย์ใหม่แบบออโต้
    if (!formObj.rowIndex) {
      const data = sheet.getDataRange().getValues();
      let maxNo = 0;
      for (let i = 1; i < data.length; i++) {
        const currentNoStr = String(data[i][0]).trim();
        if (currentNoStr && currentNoStr.toUpperCase().startsWith('BC-')) {
          const numPart = parseInt(currentNoStr.substring(3), 10);
          if (!isNaN(numPart) && numPart > maxNo) {
            maxNo = numPart;
          }
        }
      }
      maxNo++;
      propertyNo = 'BC-' + String(maxNo).padStart(3, '0');
    }
    
    const rowData = [
      propertyNo,
      formObj.condo,
      formObj.roomType,
      formObj.building,
      formObj.floor,
      formObj.room,
      formObj.size,
      formObj.bed,
      formObj.bath,
      formObj.parking,
      formObj.zone,
      formObj.district,
      formObj.sales,
      formObj.status,
      formObj.price,
      formObj.leaseStart,
      formObj.leaseEnd,
      formObj.type,
      formObj.facebook,
      formObj.googleMap,
      formObj.remark,
      formObj.propertyType,
      formObj.petFriendly === 'Yes' || formObj.petFriendly === true ? "Yes" : "No",
      formObj.ownerName || "",
      formObj.ownerPhone || "",
      formObj.ownerLine || "",
      formObj.ownerFacebook || ""
    ];

    if (formObj.rowIndex) {
      sheet.getRange(parseInt(formObj.rowIndex), 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function deleteRow(rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    sheet.deleteRow(parseInt(rowIndex));
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function createSheetWithHeaders(ss) {
  const sheet = ss.insertSheet(SHEET_NAME);
  const headers = [
    "No.", "คอนโด", "ประเภทห้อง", "ตึก/อาคาร", "ชั้น", "ห้อง", "ขนาด ตร.ม.", "ห้องนอน", "ห้องน้ำ", 
    "ที่จอดรถ", "จังหวัด", "โซน", "เซลส์", "สถานะ", "ค่าเช่า", "สัญญาเช่า", "หมดสัญญา", "ประเภท", 
    "Facebook", "Google Map", "หมายเหตุ", "ประเภทอสังหา", "สัตว์เลี้ยง",
    "ชื่อเจ้าของ", "เบอร์โทรเจ้าของ", "Line ID เจ้าของ", "Facebook เจ้าของ"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
}

// ฟังก์ชันบันทึก log การดูข้อมูลเจ้าของ และดึงประวัติการเข้าชมของรหัสทรัพย์นั้นกลับมา
function logAndGetOwnerViews(bcCode, username, name) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Log');
    
    // ถ้ายังไม่มี Sheet 'Log' ให้สร้างขึ้นมาใหม่
    if (!sheet) {
      sheet = ss.insertSheet('Log');
      const headers = ["รหัส BC", "Username", "Name", "วันที่", "เวลา", "สถานะ", "หมายเหตุ"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
    } else {
      // ตรวจสอบว่ามีคอลัมน์ สถานะ และ หมายเหตุ หรือไม่ (กรณีมี Sheet เดิมอยู่แล้ว)
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        const headers = ["รหัส BC", "Username", "Name", "วันที่", "เวลา", "สถานะ", "หมายเหตุ"];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
      } else {
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        if (headers.length < 7) {
          sheet.getRange(1, 6).setValue("สถานะ");
          sheet.getRange(1, 7).setValue("หมายเหตุ");
          sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
        }
      }
    }
    
    if (username && name) {
      const now = new Date();
      // แปลงวันที่และเวลาให้อยู่ในรูปแบบที่อ่านง่ายตาม Timezone ประเทศไทย
      const dateStr = Utilities.formatDate(now, "Asia/Bangkok", "dd/MM/yyyy");
      const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");
      
      // บันทึก log ใหม่
      sheet.appendRow([bcCode, username, name, dateStr, timeStr, "", ""]);
    }
    
    // อ่านข้อมูล log ทั้งหมดที่ตรงกับรหัสทรัพย์นี้
    const data = sheet.getDataRange().getValues();
    let logs = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(bcCode)) {
        logs.push({
          name: data[i][2],
          date: data[i][3] instanceof Date ? Utilities.formatDate(data[i][3], "Asia/Bangkok", "dd/MM/yyyy") : data[i][3],
          time: data[i][4] instanceof Date ? Utilities.formatDate(data[i][4], "Asia/Bangkok", "HH:mm:ss") : data[i][4],
          status: data[i][5] || '-',
          remark: data[i][6] || '-'
        });
      }
    }
    
    // แสดง log ล่าสุดอยู่ด้านบน
    return logs.reverse();
  } catch (error) {
    return [{name: 'Error', date: '', time: error.toString(), status: '-', remark: '-'}];
  }
}

// ฟังก์ชันสำหรับอัปเดตสถานะและหมายเหตุใน Log ล่าสุดของ User นั้นๆ
function updateOwnerStatus(bcCode, username, status, remark) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Log');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    let updated = false;
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]) === String(bcCode) && String(data[i][1]) === String(username)) {
        sheet.getRange(i + 1, 6).setValue(status);
        sheet.getRange(i + 1, 7).setValue(remark);
        updated = true;
        break;
      }
    }
    
    // ถ้าไม่เจอให้สร้าง row ใหม่ไปเลย
    if (!updated) {
      const now = new Date();
      const dateStr = Utilities.formatDate(now, "Asia/Bangkok", "dd/MM/yyyy");
      const timeStr = Utilities.formatDate(now, "Asia/Bangkok", "HH:mm:ss");
      // หาชื่อผู้ใช้จาก Log ก่อนหน้า หรือใช้ชื่อ default
      let name = username;
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][1]) === String(username)) {
           name = data[i][2];
           break;
        }
      }
      sheet.appendRow([bcCode, username, name, dateStr, timeStr, status, remark]);
    }
    
    return logAndGetOwnerViews(bcCode, null, null);
  } catch(error) {
    return [{name: 'Error', date: '', time: error.toString(), status: '-', remark: '-'}];
  }
}