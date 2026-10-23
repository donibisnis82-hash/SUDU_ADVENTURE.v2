
"use strict";

// ===================================
// 1. FORMAT ANGKA KE RUPIAH
// ===================================
const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(angka);

const formatAngka = (angka) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(angka);

// ===================================
// 2. MEMUAT DATA LAMA
// Data lama tidak dihapus
// ===================================
function bacaTransaksi() {
  try {
    const data = JSON.parse(
      localStorage.getItem("dompet_transaksi") || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let saldoAwal = Number(
  localStorage.getItem("dompet_saldo") || 0
);

if (!Number.isSafeInteger(saldoAwal) || saldoAwal < 0) {
  saldoAwal = 0;
}

let transaksi = bacaTransaksi();

let anggaran = Number(
  localStorage.getItem("dompet_anggaran") || 0
);

if (!Number.isSafeInteger(anggaran) || anggaran < 0) {
  anggaran = 0;
}

// ===================================
// 3. MENGAMBIL ELEMEN HTML
// ===================================
const form = document.getElementById("formPengeluaran");
const inputSaldo = document.getElementById("saldoAwal");
const inputNama = document.getElementById("nama");
const inputJumlah = document.getElementById("jumlah");
const inputTanggal = document.getElementById("tanggal");
const inputKategori = document.getElementById("kategori");

const elemenSisa = document.getElementById("sisaUang");
const elemenTotal = document.getElementById("totalPengeluaran");
const elemenJumlah = document.getElementById("jumlahTransaksi");
const elemenRiwayat = document.getElementById("riwayat");

// Fitur tambahan bersifat opsional
const inputAnggaran = document.getElementById("anggaran");
const tombolAnggaran = document.getElementById("simpanAnggaran");
const infoAnggaran = document.getElementById("infoAnggaran");
const progressAnggaran = document.getElementById("progressAnggaran");
const inputCari = document.getElementById("cariTransaksi");
const filterKategori = document.getElementById("filterKategori");
const tombolEkspor = document.getElementById("eksporCSV");

// ===================================
// 4. FORMAT NOMINAL SAAT MENGETIK
// Contoh: 50000 menjadi 50.000
// ===================================
function pasangFormatNominal(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    const posisiAwal = input.selectionStart;
    const panjangLama = input.value.length;

    let angka = input.value.replace(/\D/g, "").slice(0, 15);

    input.value = angka ? formatAngka(Number(angka)) : "";

    // Menjaga posisi kursor sebisa mungkin
    if (document.activeElement === input) {
      const selisih = input.value.length - panjangLama;
      const posisi = Math.max(
        0,
        Math.min(input.value.length, (posisiAwal || 0) + selisih)
      );

      input.setSelectionRange(posisi, posisi);
    }
  });
}

pasangFormatNominal(inputJumlah);
pasangFormatNominal(inputSaldo);
pasangFormatNominal(inputAnggaran);

// ===================================
// 5. TANGGAL HARI INI
// ===================================
function tanggalHariIni() {
  const sekarang = new Date();

  sekarang.setMinutes(
    sekarang.getMinutes() - sekarang.getTimezoneOffset()
  );

  return sekarang.toISOString().slice(0, 10);
}

if (inputTanggal && !inputTanggal.value) {
  inputTanggal.value = tanggalHariIni();
}

// ===================================
// 6. MENYIMPAN DATA
// ===================================
function simpanData() {
  try {
    localStorage.setItem("dompet_saldo", String(saldoAwal));
    localStorage.setItem(
      "dompet_transaksi",
      JSON.stringify(transaksi)
    );
    localStorage.setItem("dompet_anggaran", String(anggaran));
    return true;
  } catch (error) {
    alert("Data gagal disimpan. Periksa ruang penyimpanan browser.");
    console.error(error);
    return false;
  }
}

// ===================================
// 7. TOTAL PENGELUARAN
// ===================================
function hitungTotal(daftar) {
  return daftar.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );
}

function hitungTotalBulanIni() {
  const sekarang = new Date();
  const bulan = sekarang.getMonth();
  const tahun = sekarang.getFullYear();

  return hitungTotal(
    transaksi.filter((item) => {
      const tanggal = new Date(item.tanggal + "T12:00:00");

      return (
        !Number.isNaN(tanggal.getTime()) &&
        tanggal.getMonth() === bulan &&
        tanggal.getFullYear() === tahun
      );
    })
  );
}

// ===================================
// 8. TAMPILKAN ANGGARAN BULANAN
// ===================================
function tampilkanAnggaran() {
  if (!infoAnggaran || !progressAnggaran) return;

  const totalBulanIni = hitungTotalBulanIni();

  const persen = anggaran > 0
    ? (totalBulanIni / anggaran) * 100
    : 0;

  progressAnggaran.style.width =
    Math.min(persen, 100) + "%";

  progressAnggaran.classList.toggle(
    "hampir-penuh",
    persen >= 80 && persen < 100
  );

  progressAnggaran.classList.toggle(
    "lewat-batas",
    persen >= 100
  );

  if (anggaran <= 0) {
    infoAnggaran.textContent = "Atur anggaran bulananmu.";
    return;
  }

  infoAnggaran.textContent =
    "Terpakai " + formatRupiah(totalBulanIni) +
    " dari " + formatRupiah(anggaran) +
    " (" + persen.toFixed(1) + "%)." +
    (persen >= 100
      ? " Anggaran terlampaui!"
      : persen >= 80
        ? " Hati-hati, anggaran hampir habis."
        : " Anggaran masih tersedia.");
}

// ===================================
// 9. TAMPILKAN RIWAYAT TRANSAKSI
// ===================================
function tampilkanData() {
  const total = hitungTotal(transaksi);

  if (elemenSisa) {
    elemenSisa.textContent = formatRupiah(saldoAwal - total);
  }

  if (elemenTotal) {
    elemenTotal.textContent = formatRupiah(total);
  }

  if (elemenJumlah) {
    elemenJumlah.textContent = transaksi.length;
  }

  if (elemenRiwayat) {
    elemenRiwayat.replaceChildren();

    const kataKunci = inputCari
      ? inputCari.value.toLowerCase().trim()
      : "";

    const kategoriDipilih = filterKategori
      ? filterKategori.value
      : "";

    const daftarTampil = [...transaksi]
      .reverse()
      .filter((item) =>
        String(item.nama).toLowerCase().includes(kataKunci)
      )
      .filter((item) =>
        !kategoriDipilih ||
        item.kategori === kategoriDipilih
      );

    if (daftarTampil.length === 0) {
      const pesan = document.createElement("p");
      pesan.className = "kosong";
      pesan.textContent = transaksi.length === 0
        ? "Belum ada pengeluaran."
        : "Transaksi tidak ditemukan.";

      elemenRiwayat.appendChild(pesan);
    }

    daftarTampil.forEach((item) => {
      const kartu = document.createElement("div");
      kartu.className = "item-riwayat";

      const atas = document.createElement("div");
      atas.className = "item-atas";

      const nama = document.createElement("strong");
      nama.textContent = item.nama;

      const nominal = document.createElement("span");
      nominal.className = "nominal";
      nominal.textContent = "-" + formatRupiah(item.jumlah);

      atas.append(nama, nominal);

      const detail = document.createElement("p");
      detail.className = "detail";
      detail.textContent =
        item.tanggal + " • " + item.kategori;

      // Tombol edit
      const tombolEdit = document.createElement("button");
      tombolEdit.textContent = "Edit";
      tombolEdit.className = "tombol-edit";

      tombolEdit.addEventListener("click", () => {
        const namaBaru = prompt(
          "Nama pengeluaran:",
          item.nama
        );

        if (namaBaru === null) return;

        if (!namaBaru.trim()) {
          alert("Nama pengeluaran tidak boleh kosong.");
          return;
        }

        const jumlahBaru = prompt(
          "Jumlah uang (Rp):",
          formatAngka(item.jumlah)
        );

        if (jumlahBaru === null) return;

        const angkaBaru = jumlahBaru.replace(/\D/g, "");
        const nilaiBaru = Number(angkaBaru);

        if (
          !angkaBaru ||
          !Number.isSafeInteger(nilaiBaru) ||
          nilaiBaru <= 0
        ) {
          alert("Nominal tidak valid.");
          return;
        }

        const tanggalBaru = prompt(
          "Tanggal (YYYY-MM-DD):",
          item.tanggal
        );

        if (tanggalBaru === null) return;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalBaru)) {
          alert("Format tanggal harus YYYY-MM-DD.");
          return;
        }

        const tanggalValid = new Date(
          tanggalBaru + "T12:00:00"
        );

        if (
          Number.isNaN(tanggalValid.getTime()) ||
          tanggalValid.toISOString().slice(0, 10) !== tanggalBaru
        ) {
          alert("Tanggal tidak valid.");
          return;
        }

        const kategoriBaru = prompt(
          "Kategori (Makanan, Transportasi, Belanja, Tagihan, Kesehatan, Hiburan, Lainnya):",
          item.kategori
        );

        if (kategoriBaru === null) return;

        const pilihanKategori = [
          "Makanan",
          "Transportasi",
          "Belanja",
          "Tagihan",
          "Kesehatan",
          "Hiburan",
          "Lainnya"
        ];

        if (!pilihanKategori.includes(kategoriBaru)) {
          alert("Kategori tidak dikenal.");
          return;
        }

        item.nama = namaBaru.trim();
        item.jumlah = nilaiBaru;
        item.tanggal = tanggalBaru;
        item.kategori = kategoriBaru;

        simpanData();
        tampilkanData();
      });

      // Tombol hapus
      const tombolHapus = document.createElement("button");
      tombolHapus.className = "tombol-hapus";
      tombolHapus.textContent = "Hapus";

      tombolHapus.addEventListener("click", () => {
        if (!confirm("Yakin ingin menghapus transaksi ini?")) {
          return;
        }

        transaksi = transaksi.filter(
          (data) => data.id !== item.id
        );

        if (simpanData()) tampilkanData();
      });

      const aksi = document.createElement("div");
      aksi.className = "aksi-transaksi";
      aksi.append(tombolEdit, tombolHapus);

      kartu.append(atas, detail, aksi);
      elemenRiwayat.appendChild(kartu);
    });
  }

  tampilkanAnggaran();
}

// ===================================
// 10. SIMPAN SALDO AWAL
// ===================================
const tombolSaldo = document.getElementById("simpanSaldo");

if (tombolSaldo && inputSaldo) {
  tombolSaldo.addEventListener("click", () => {
    const nilai = inputSaldo.value.replace(/\D/g, "");

    if (
      !nilai ||
      !Number.isSafeInteger(Number(nilai))
    ) {
      alert("Masukkan saldo awal yang valid.");
      return;
    }

    const saldoBaru = Number(nilai);

    if (saldoBaru < 0) {
      alert("Saldo tidak boleh negatif.");
      return;
    }

    saldoAwal = saldoBaru;

    if (simpanData()) {
      tampilkanData();
      inputSaldo.value = "";
      alert("Saldo awal berhasil disimpan.");
    }
  });
}

// ===================================
// 11. TAMBAH PENGELUARAN
// ===================================
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nama = inputNama.value.trim();
    const jumlah = Number(
      inputJumlah.value.replace(/\D/g, "")
    );
    const tanggal = inputTanggal.value;
    const kategori = inputKategori.value;

    if (
      !nama ||
      !tanggal ||
      !Number.isSafeInteger(jumlah) ||
      jumlah <= 0
    ) {
      alert("Periksa nama, tanggal, dan nominal.");
      return;
    }

    const total = hitungTotal(transaksi);
    const sisa = saldoAwal - total;

    if (jumlah > sisa) {
      const lanjut = confirm(
        "Pengeluaran melebihi sisa uang. Tetap simpan?"
      );

      if (!lanjut) return;
    }

    transaksi.push({
      id: Date.now().toString() +
        Math.random().toString(16).slice(2),
      nama,
      jumlah,
      tanggal,
      kategori
    });

    if (!simpanData()) {
      transaksi.pop();
      return;
    }

    tampilkanData();
    form.reset();
    inputTanggal.value = tanggalHariIni();
  });
}

// ===================================
// 12. SIMPAN ANGGARAN BULANAN
// ===================================
if (tombolAnggaran && inputAnggaran) {
  inputAnggaran.value = anggaran
    ? formatAngka(anggaran)
    : "";

  tombolAnggaran.addEventListener("click", () => {
    const nilai = inputAnggaran.value.replace(/\D/g, "");
    const angka = Number(nilai);

    if (
      !nilai ||
      !Number.isSafeInteger(angka) ||
      angka <= 0
    ) {
      alert("Masukkan anggaran yang valid.");
      return;
    }

    const sebelumnya = anggaran;
    anggaran = angka;

    if (simpanData()) {
      tampilkanAnggaran();
      alert("Anggaran bulanan berhasil disimpan.");
    } else {
      anggaran = sebelumnya;
    }
  });
}

// ===================================
// 13. PENCARIAN DAN FILTER KATEGORI
// ===================================
if (inputCari) {
  inputCari.addEventListener("input", tampilkanData);
}

if (filterKategori) {
  filterKategori.addEventListener("change", tampilkanData);
}

// ===================================
// 14. EKSPOR LAPORAN CSV
// ===================================
if (tombolEkspor) {
  tombolEkspor.addEventListener("click", () => {
    const amanCSV = (nilai) => {
      let teks = String(nilai ?? "");

      if (/^[\s]*[=+\-@]/.test(teks)) {
        teks = "'" + teks;
      }

      return '"' + teks.replace(/"/g, '""') + '"';
    };

    const baris = [
      ["Tanggal", "Nama", "Kategori", "Jumlah (Rp)"],
      ...transaksi.map((item) => [
        item.tanggal,
        item.nama,
        item.kategori,
        item.jumlah
      ])
    ];

    const isiCSV = "\uFEFF" +
      baris.map((barisData) =>
        barisData.map(amanCSV).join(",")
      ).join("\r\n");

    const file = new Blob([isiCSV], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "laporan-pengeluaran.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// ===================================
// 15. JALANKAN WEBSITE
// ===================================
tampilkanData();


/* ==================================
   GRAFIK PENGELUARAN DOMPETKU
================================== */

const kanvasGrafik = document.getElementById(
  "grafikPengeluaran"
);

const tombolHarian = document.getElementById(
  "grafikHarian"
);

const tombolBulanan = document.getElementById(
  "grafikBulanan"
);

const ringkasanGrafik = document.getElementById(
  "ringkasanGrafik"
);

let modeGrafik = "harian";

function dataGrafik() {
  const sekarang = new Date();
  const hasil = [];

  if (modeGrafik === "harian") {
    for (let mundur = 6; mundur >= 0; mundur--) {
      const tanggal = new Date(sekarang);
      tanggal.setHours(12, 0, 0, 0);
      tanggal.setDate(tanggal.getDate() - mundur);

      const kunci = tanggal.toISOString().slice(0, 10);

      const total = transaksi
        .filter(item => item.tanggal === kunci)
        .reduce((jumlah, item) => jumlah + item.jumlah, 0);

      hasil.push({
        label: tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short"
        }),
        total
      });
    }
  } else {
    for (let mundur = 5; mundur >= 0; mundur--) {
      const tanggal = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() - mundur,
        1
      );

      const bulan = tanggal.getMonth();
      const tahun = tanggal.getFullYear();

      const total = transaksi
        .filter(item => {
          const t = new Date(item.tanggal + "T12:00:00");

          return (
            t.getMonth() === bulan &&
            t.getFullYear() === tahun
          );
        })
        .reduce((jumlah, item) => jumlah + item.jumlah, 0);

      hasil.push({
        label: tanggal.toLocaleDateString("id-ID", {
          month: "short"
        }),
        total
      });
    }
  }

  return hasil;
}

function gambarGrafik() {
  if (!kanvasGrafik) return;

  const konteks = kanvasGrafik.getContext("2d");
  const kotak = kanvasGrafik.getBoundingClientRect();

  if (!kotak.width || !kotak.height) return;

  const skala = Math.min(window.devicePixelRatio || 1, 2);

  kanvasGrafik.width = kotak.width * skala;
  kanvasGrafik.height = kotak.height * skala;

  konteks.setTransform(skala, 0, 0, skala, 0, 0);
  konteks.clearRect(0, 0, kotak.width, kotak.height);

  const data = dataGrafik();
  const lebar = kotak.width;
  const tinggi = kotak.height;

  const kiri = 12;
  const kanan = 12;
  const atas = 20;
  const bawah = 35;

  const areaLebar = lebar - kiri - kanan;
  const areaTinggi = tinggi - atas - bawah;

  const maksimum = Math.max(
    ...data.map(item => item.total),
    1
  );

  // Garis bantu
  konteks.strokeStyle = "rgba(180, 220, 200, 0.15)";
  konteks.lineWidth = 1;
  konteks.font = "10px Arial";

  for (let i = 0; i <= 4; i++) {
    const y = atas + areaTinggi * i / 4;

    konteks.beginPath();
    konteks.moveTo(kiri, y);
    konteks.lineTo(lebar - kanan, y);
    konteks.stroke();
  }

  // Garis grafik
  const titik = data.map((item, indeks) => ({
    x: data.length === 1
      ? lebar / 2
      : kiri + indeks * areaLebar / (data.length - 1),
    y: atas + areaTinggi -
      (item.total / maksimum) * areaTinggi,
    item
  }));

  // Area di bawah grafik
  const gradien = konteks.createLinearGradient(
    0, atas, 0, tinggi - bawah
  );

  gradien.addColorStop(0, "rgba(8, 165, 121, 0.35)");
  gradien.addColorStop(1, "rgba(8, 165, 121, 0.01)");

  konteks.beginPath();
  konteks.moveTo(titik[0].x, tinggi - bawah);

  titik.forEach(p => {
    konteks.lineTo(p.x, p.y);
  });

  konteks.lineTo(titik[titik.length - 1].x, tinggi - bawah);
  konteks.closePath();

  konteks.fillStyle = gradien;
  konteks.fill();

  // Garis utama
  konteks.beginPath();

  titik.forEach((p, indeks) => {
    if (indeks === 0) {
      konteks.moveTo(p.x, p.y);
    } else {
      konteks.lineTo(p.x, p.y);
    }
  });

  konteks.strokeStyle = "#42e5a4";
  konteks.lineWidth = 2.5;
  konteks.lineJoin = "round";
  konteks.stroke();

  // Titik dan label tanggal
  konteks.textAlign = "center";
  konteks.font = "10px Arial";

  titik.forEach(p => {
    konteks.beginPath();
    konteks.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    konteks.fillStyle = "#f4cf3a";
    konteks.fill();

    konteks.fillStyle = "#b7d5c7";
    konteks.fillText(
      p.item.label,
      p.x,
      tinggi - 12
    );
  });

  const totalPeriode = data.reduce(
    (jumlah, item) => jumlah + item.total,
    0
  );

  if (ringkasanGrafik) {
    ringkasanGrafik.textContent =
      "Total " +
      (modeGrafik === "harian"
        ? "7 hari terakhir: "
        : "6 bulan terakhir: ") +
      formatRupiah(totalPeriode);
  }
}

if (tombolHarian) {
  tombolHarian.addEventListener("click", () => {
    modeGrafik = "harian";

    tombolHarian.classList.add("aktif");
    tombolBulanan?.classList.remove("aktif");

    gambarGrafik();
  });
}

if (tombolBulanan) {
  tombolBulanan.addEventListener("click", () => {
    modeGrafik = "bulanan";

    tombolBulanan.classList.add("aktif");
    tombolHarian?.classList.remove("aktif");

    gambarGrafik();
  });
}

// Gambar ulang grafik saat ukuran layar berubah
window.addEventListener("resize", gambarGrafik);

// Perbarui grafik setelah transaksi berubah
const tampilkanDataAsli = tampilkanData;

tampilkanData = function () {
  tampilkanDataAsli();
  gambarGrafik();
};

gambarGrafik();
