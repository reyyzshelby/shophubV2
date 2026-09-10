// db.js — helper database file JSON.
//
// Lokal: data tetap dibaca/ditulis ke data/db.json seperti versi asli.
// Vercel: filesystem deployment bersifat read-only/tidak persisten, jadi
// data dimuat sekali ke memory dan perubahan selama instance hidup disimpan
// di memory. Ini membuat demo checkout tetap bisa berjalan di Vercel tanpa
// mengubah database lokal project.
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");
const isVercel = Boolean(process.env.VERCEL);

let memoryData = null;
let writing = Promise.resolve();

function loadFromFile() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function read() {
  if (isVercel) {
    if (!memoryData) memoryData = loadFromFile();
    return memoryData;
  }

  return loadFromFile();
}

function write(data) {
  if (isVercel) {
    memoryData = data;
    return Promise.resolve();
  }

  writing = writing.then(
    () =>
      new Promise((resolve, reject) => {
        const tmp = DB_PATH + ".tmp";
        fs.writeFile(tmp, JSON.stringify(data, null, 2), (err) => {
          if (err) return reject(err);
          fs.rename(tmp, DB_PATH, (err2) =>
            err2 ? reject(err2) : resolve()
          );
        });
      })
  );

  return writing;
}

module.exports = { read, write };
