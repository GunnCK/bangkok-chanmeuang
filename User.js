// User.gs.txt

// ฟังก์ชันเข้ารหัส Password ด้วย SHA-256
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) { hashVal += 256; }
    if (hashVal.toString(16).length == 1) { txtHash += '0'; }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

// ฟังก์ชันตรวจสอบการล็อกอิน
function verifyLogin(username, password) {
  try {
    const sheetId = '1bgZqJ5fiDbA0wSGNslYnmo-WVEk2K9v3dXqaNEA8iik';
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('User');
    
    // ถ้ายังไม่มี Sheet 'User' ให้สร้างขึ้นมาใหม่พร้อมกำหนด Header
    if (!sheet) {
      sheet = ss.insertSheet('User');
      const headers = ["Username", "Password", "Name", "Role", "Status", "Gmail"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#e2e8f0");
      
      // เพิ่มข้อมูลเริ่มต้นให้ตามที่ระบุ (พร้อม Hash Password)
      sheet.appendRow(["chotdecha.k", hashPassword("gunn020643"), "Chotdecha K.", "System Admin", "Active", "chotdecha.k@gmail.com"]);
      
      // ตรวจสอบการล็อกอินกับข้อมูลเริ่มต้นในกรณีที่เพิ่งสร้างชีตใหม่
      if (username === "chotdecha.k" && password === "gunn020643") {
        return { 
          success: true, 
          name: "Chotdecha K.", 
          role: "System Admin",
          username: "chotdecha.k",
          url: ScriptApp.getService().getUrl()
        };
      }
      return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, message: "ไม่มีข้อมูลผู้ใช้งานในระบบ" };
    }
    
    // วนลูปหาข้อมูล User (เริ่มที่ i=1 เพื่อข้าม Header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sheetUsername = (row[0] || "").toString().trim();
      const sheetPassword = (row[1] || "").toString().trim();
      const sheetName = (row[2] || "").toString().trim();
      const sheetRole = (row[3] || "").toString().trim();
      const sheetStatus = (row[4] || "").toString().trim();
      
      const hashedPassword = hashPassword(password);
      // รองรับทั้งคนที่เข้ารหัสแล้ว และคนที่ยังไม่ได้เข้ารหัส (legacy plain text)
      if (sheetUsername === username && (sheetPassword === password || sheetPassword === hashedPassword)) {
        if (sheetStatus.toLowerCase() !== "active" && sheetStatus !== "เปิดใช้งาน") {
          return { success: false, message: "บัญชีนี้ถูกระงับการใช้งาน" };
        }
        
        // หากเป็นการล็อกอินด้วย Plain Text แบบเก่า ให้ทำการแปลงเป็น Hash และบันทึกทับใน Sheet อัตโนมัติเลย
        if (sheetPassword === password) {
           sheet.getRange(i + 1, 2).setValue(hashedPassword);
        }

        return { 
          success: true, 
          name: sheetName, 
          role: sheetRole,
          username: sheetUsername,
          url: ScriptApp.getService().getUrl()
        };
      }
    }
    
    return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    
  } catch (error) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + error.toString() };
  }
}

// ฟังก์ชันดึงข้อมูลผู้ใช้งานทั้งหมด
function getUsers() {
  try {
    const sheetId = '1bgZqJ5fiDbA0wSGNslYnmo-WVEk2K9v3dXqaNEA8iik';
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('User');
    
    if (!sheet) return { status: 'error', message: "ไม่พบฐานข้อมูลผู้ใช้งาน" };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // มีแค่ Header
    
    let result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.join('') === '') continue;
      
      result.push({
        rowIndex: i + 1,
        username: row[0],
        password: "", // ไม่ส่ง Password ที่ Hash แล้วกลับไปหน้าจอเพื่อความปลอดภัย
        name: row[2],
        role: row[3],
        status: row[4],
        email: row[5] || ""
      });
    }
    return result;
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// ฟังก์ชันบันทึกข้อมูลผู้ใช้งาน (เพิ่ม/แก้ไข)
function saveUserData(userObj) {
  try {
    const sheetId = '1bgZqJ5fiDbA0wSGNslYnmo-WVEk2K9v3dXqaNEA8iik';
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('User');
    
    if (!sheet) return { status: 'error', message: "ไม่พบฐานข้อมูลผู้ใช้งาน" };

    if (userObj.rowIndex) {
      // โหมดแก้ไข
      const rowIndex = parseInt(userObj.rowIndex);
      const existingData = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];
      
      // ถ้าไม่มีการส่ง Password มาแปลว่าไม่ต้องการเปลี่ยนรหัสผ่าน ให้ใช้ค่าเดิมใน Sheet
      const finalPassword = userObj.password ? hashPassword(userObj.password) : existingData[1];
      
      const rowData = [
        userObj.username,
        finalPassword,
        userObj.name,
        userObj.role,
        userObj.status,
        userObj.email
      ];
      
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // โหมดเพิ่มใหม่
      // เช็คว่า Username ซ้ำไหมก่อนเพิ่มใหม่
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == userObj.username) {
          return { status: 'error', message: "Username นี้มีในระบบแล้ว" };
        }
      }
      
      const finalPassword = hashPassword(userObj.password);
      const rowData = [
        userObj.username,
        finalPassword,
        userObj.name,
        userObj.role,
        userObj.status,
        userObj.email
      ];
      
      sheet.appendRow(rowData);
    }
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// ฟังก์ชันลบผู้ใช้งาน
function deleteUserData(rowIndex) {
  try {
    const sheetId = '1bgZqJ5fiDbA0wSGNslYnmo-WVEk2K9v3dXqaNEA8iik';
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('User');
    
    if (!sheet) return { status: 'error', message: "ไม่พบฐานข้อมูลผู้ใช้งาน" };
    
    sheet.deleteRow(parseInt(rowIndex));
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}
