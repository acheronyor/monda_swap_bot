# Monda Swap Bot

**Bot otomatis untuk melakukan swap bolak-balik MON ⇄ USDC di Monda DEX (Testnet Monad)**  
Swap dilakukan setiap 1 menit secara terus-menerus hingga saldo MON tidak mencukupi atau pengguna menghentikan bot secara manual.

---

## Fitur

- Swap bolak-balik MON → WMON → USDC → WMON → MON.
- Otomatis wrap & unwrap token MON.
- Cek dan update leaderboard volume & point setiap round.
- Deteksi saldo dan penyesuaian otomatis jika swap melebihi saldo.
- Warning otomatis saat daily volume mencapai target tertentu (default: 10.5k).
- Logging berwarna dan rapi untuk kenyamanan pemantauan.
- DYOR (Do Your Own Research) – gunakan dengan tanggung jawab pribadi.

---

## Instalasi

### Clone repo ini

```bash
git clone https://github.com/namamu/monda_swap_bot.git
cd monda_swap_bot
```

### Install dependencies

```bash
npm install
npm install readline-sync dotenv chalk axios web3
```

### Siapkan file `.env`

```
PRIVATE_KEY=isi_private_key_anda
WALLET_ADDRESS=0xAlamatWalletAnda
```

---

## Jalankan script

```bash
node index.js
```

---

## Konfigurasi Lain

Pastikan file `abis/mondaRouter.json` berisi ABI dari router Monda DEX.

RPC yang digunakan: `https://testnet-rpc.monad.xyz/`

### Kontrak penting:

- **MON**: Native Token (akan di-wrap ke WMON)
- **WMON**: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- **USDC**: `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`
- **Router Monda DEX**: `0xc80585f78A6e44fb46e1445006f820448840386e`

---

## Peringatan

- Bot ini hanya untuk keperluan testnet Monad.
- Pastikan Anda memahami semua risiko saat menggunakan script ini.
- Tidak ada jaminan terkait hasil, performa, maupun keamanan.
- DYOR (Do Your Own Research) sebelum menggunakan, memodifikasi, atau mendistribusikan ulang bot ini.

---

## Author

Created by **[Acheron]**

Jika kamu merasa script ini bermanfaat, jangan lupa kasih bintang dan bagikan ke teman pejuang leaderboard lain!


