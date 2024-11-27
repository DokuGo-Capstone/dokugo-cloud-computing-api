const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Path ke file service account
const pathKey = path.resolve("./serviceaccountkey.json");

// Konfigurasi Google Cloud Storage
const gcs = new Storage({
  projectId: "dokugo-capstone", // Ganti dengan projectId Anda
  keyFilename: pathKey, // File service account
});

// Nama bucket di Google Cloud Storage
const bucketName = "dokugo-storage"; // Ganti dengan nama bucket Anda
const bucket = gcs.bucket(bucketName);

// Fungsi untuk mendapatkan URL publik dari file
function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
}

// Fungsi untuk upload file ke bucket
async function uploadToGoogleCloud(buffer, filename) {
  return new Promise((resolve, reject) => {
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: { contentType: "image/jpeg" },
    });

    stream.on("error", (err) => reject(err));
    stream.on("finish", async () => {
      await file.makePublic(); // Pastikan file publik
      resolve(getPublicUrl(filename));
    });

    stream.end(buffer);
  });
}

module.exports = { uploadToGoogleCloud, getPublicUrl };
