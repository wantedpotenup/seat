/**
 * ============================================================
 * 교육생 자리 번호 선택 웹앱 - Google Apps Script 백엔드
 * ============================================================
 * 사용법:
 * 1) 새 Google 스프레드시트를 만든다.
 * 2) 확장 프로그램 > Apps Script 를 열고, 기존 코드를 지운 뒤 이 파일 내용
 *    전체를 복사해서 붙여넣는다.
 * 3) 위쪽 함수 선택 드롭다운에서 setup 을 고른 뒤 ▶ 실행 버튼을 누른다.
 *    (Seats/Config 시트와 기본값을 만든다. 처음 실행하면 권한 승인 창이
 *    뜨는데 "고급" > "이동" 등을 눌러 허용해야 한다.)
 * 4) 배포 > 새 배포 > 유형 선택(⚙️) > 웹 앱
 *      - 설명: 아무거나
 *      - 실행할 사용자: 나
 *      - 액세스 권한이 있는 사용자: 전체 공개(모든 사용자)
 *    배포를 누르고 웹 앱 URL을 복사한다. (.../exec 로 끝나는 URL)
 * 5) 이 URL을 프론트엔드 .env 의 VITE_APPS_SCRIPT_URL 에 넣는다.
 * 6) 관리자 비밀번호는 이 스프레드시트의 "Config" 시트에서 AdminPassword
 *    값을 직접 수정하면 바로 바뀐다. 기본값은 change-me-1234 이니 꼭 바꾸자.
 *
 * 주의: 이 스프레드시트에 "편집 권한"을 가진 사람은 Config 시트에서
 * 관리자 비밀번호를 볼 수 있다. 이 시트는 공유하지 말고, 참가자에게는
 * 배포된 웹 사이트 URL만 알려주면 된다 (참가자는 이 스프레드시트에
 * 접근할 필요가 전혀 없다).
 * ============================================================
 */

var SEATS_SHEET = 'Seats';
var CONFIG_SHEET = 'Config';
var SEATS_HEADERS = ['Number', 'Name', 'OrderIndex', 'SelectedAt'];

var DEFAULT_CONFIG = {
  AdminPassword: 'change-me-1234',
  TotalSeats: '0',
  ResultsRevealed: 'false',
  LayoutTitle: '',
  LayoutRows: '[]',
  OrderCounter: '0',
};

/** 최초 1회 실행: 시트와 기본값을 만든다. 여러 번 실행해도 안전하다. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var seatsSheet = ss.getSheetByName(SEATS_SHEET);
  if (!seatsSheet) seatsSheet = ss.insertSheet(SEATS_SHEET);
  var firstRow = seatsSheet.getRange(1, 1, 1, SEATS_HEADERS.length).getValues()[0];
  if (firstRow.join('') === '') {
    seatsSheet.getRange(1, 1, 1, SEATS_HEADERS.length).setValues([SEATS_HEADERS]);
  }

  var configSheet = ss.getSheetByName(CONFIG_SHEET);
  if (!configSheet) configSheet = ss.insertSheet(CONFIG_SHEET);
  var data = configSheet.getDataRange().getValues();
  var keys = data.map(function (row) {
    return row[0];
  });
  Object.keys(DEFAULT_CONFIG).forEach(function (key) {
    if (keys.indexOf(key) === -1) {
      configSheet.appendRow([key, DEFAULT_CONFIG[key]]);
    }
  });

  Logger.log('setup 완료. Seats / Config 시트를 확인하세요.');
}

function getConfigMap_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  var data = sheet.getDataRange().getValues();
  var map = {};
  data.forEach(function (row) {
    if (row[0]) map[row[0]] = row[1];
  });
  return map;
}

function setConfigValue_(key, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getSeatsSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATS_SHEET);
}

function readSeats_() {
  var sheet = getSeatsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var seats = [];
  values.forEach(function (r) {
    if (r[0] === '' || r[0] === null) return;
    seats.push({
      number: Number(r[0]),
      name: r[1] === '' || r[1] === null ? null : String(r[1]),
      orderIndex: r[2] === '' || r[2] === null ? null : Number(r[2]),
      selectedAt: r[3] === '' || r[3] === null ? null : String(r[3]),
    });
  });
  return seats;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function checkPassword_(password) {
  var config = getConfigMap_();
  return String(config.AdminPassword) === String(password);
}

/** 참가자/관리자 화면이 상태를 읽어올 때 호출 (몇 초마다 자동으로 다시 호출됨) */
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'getState') {
    var config = getConfigMap_();
    var rows = [];
    try {
      rows = JSON.parse(config.LayoutRows || '[]');
    } catch (err) {
      rows = [];
    }
    return jsonResponse_({
      seats: readSeats_(),
      totalSeats: Number(config.TotalSeats || 0),
      resultsRevealed: String(config.ResultsRevealed) === 'true',
      layout: { title: config.LayoutTitle || '', rows: rows },
    });
  }

  return jsonResponse_({ error: 'unknown action' });
}

/** 번호 선택, 관리자 동작 등 모든 변경 요청은 POST 로 들어온다 */
function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ error: 'invalid json' });
  }

  var action = body.action;

  // LockService: 여러 명이 동시에 번호를 선택해도 한 번에 한 요청만 처리되도록
  // 직렬화한다. Supabase 의 원자적 UPDATE 와 동일한 역할.
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(10000);
  if (!gotLock) {
    return jsonResponse_({ error: 'server busy, try again' });
  }

  try {
    if (action === 'selectSeat') {
      return jsonResponse_(handleSelectSeat_(body.number, body.name));
    }
    if (action === 'adminAuthenticate') {
      return jsonResponse_({ ok: checkPassword_(body.password) });
    }
    if (action === 'adminSetSeatCount') {
      if (!checkPassword_(body.password)) return jsonResponse_({ error: 'invalid password' });
      return jsonResponse_(handleSetSeatCount_(Number(body.total)));
    }
    if (action === 'adminResetSelections') {
      if (!checkPassword_(body.password)) return jsonResponse_({ error: 'invalid password' });
      return jsonResponse_(handleResetSelections_());
    }
    if (action === 'adminSetResultsRevealed') {
      if (!checkPassword_(body.password)) return jsonResponse_({ error: 'invalid password' });
      setConfigValue_('ResultsRevealed', body.revealed ? 'true' : 'false');
      return jsonResponse_({ ok: true });
    }
    if (action === 'adminSetSeatLayout') {
      if (!checkPassword_(body.password)) return jsonResponse_({ error: 'invalid password' });
      setConfigValue_('LayoutTitle', body.title || '');
      setConfigValue_('LayoutRows', JSON.stringify(body.rows || []));
      return jsonResponse_({ ok: true });
    }
    return jsonResponse_({ error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}

function handleSelectSeat_(number, name) {
  if (!name || String(name).trim() === '') {
    return { selected: false, notFound: false, error: 'name required' };
  }

  var sheet = getSeatsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { selected: false, notFound: true };

  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (var i = 0; i < values.length; i++) {
    if (Number(values[i][0]) === Number(number)) {
      if (values[i][1] !== '' && values[i][1] !== null) {
        return { selected: false, notFound: false }; // 이미 다른 사람이 선택함
      }

      var config = getConfigMap_();
      var nextOrder = Number(config.OrderCounter || 0) + 1;
      setConfigValue_('OrderCounter', String(nextOrder));

      var rowIndex = i + 2; // 헤더 1행 + 0-based -> 1-based 보정
      sheet
        .getRange(rowIndex, 2, 1, 3)
        .setValues([[String(name).trim(), nextOrder, new Date().toISOString()]]);

      return { selected: true, notFound: false };
    }
  }

  return { selected: false, notFound: true };
}

function handleSetSeatCount_(total) {
  if (!total || total < 1 || total > 500) {
    return { error: 'total must be between 1 and 500' };
  }

  var sheet = getSeatsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
  }

  var rows = [];
  for (var n = 1; n <= total; n++) {
    rows.push([n, '', '', '']);
  }
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);

  setConfigValue_('TotalSeats', String(total));
  setConfigValue_('ResultsRevealed', 'false');
  setConfigValue_('OrderCounter', '0');
  return { ok: true };
}

function handleResetSelections_() {
  var sheet = getSeatsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var numRows = lastRow - 1;
    var cleared = [];
    for (var i = 0; i < numRows; i++) cleared.push(['', '', '']);
    sheet.getRange(2, 2, numRows, 3).setValues(cleared);
  }

  setConfigValue_('ResultsRevealed', 'false');
  setConfigValue_('OrderCounter', '0');
  return { ok: true };
}
