# kitob.uz — kitob ijarasi
Hech narsa o'rnatish shart emas (npm install YO'Q). Faqat Node 22.13+ kerak.

    npm run dev        # yoki: node server/index.js
    http://localhost:3001

## MUHIM: ma'lumotlar qayerda?
Baza kod papkasidan tashqarida saqlanadi: `C:\Users\<ism>\.kitob-uz\kitob.db` (Windows).
Shuning uchun yangi zip/papka ochsangiz ham akkauntlar va kitoblar YO'QOLMAYDI. Bazani o'chirmang.
Boshqa joyga saqlash: `$env:DATA_DIR="D:\kitob-data"; npm run dev`

## Hamma ko'rishi uchun
- Bir Wi-Fi: `http://<kompyuter-IP>:3001`
- Internet: `npx cloudflared tunnel --url http://localhost:3001`
Port band bo'lsa: `$env:PORT=3002; npm run dev`

`src/` — client manba kodi (ishga tushirish uchun kerak emas, tayyor `server/public/app.js` ishlaydi).

## Yangiliklar
- Demo akkauntlar (Alisher_Bookworm, Malika_Reads, Jamshid_Lib va b.) va ularning ~35 ta kitobi V A Y R O platformasiga bir marta qo'shiladi. Ularning kitoblari V A Y R O kabi avtomatik tasdiqlanadi.
- Real-time: ochiq oynalar/tablar BroadcastChannel + `storage` hodisasi orqali bir zahoti yangilanadi (boshqa kompyuterlarda ~10 soniyada).
- Qidiruv faqat so'z BOSHIDAGI harflar bo'yicha ishlaydi.
- `src/` ni qayta yig'ish (ixtiyoriy, esbuild kerak):
  `esbuild src/main.jsx --bundle --minify --jsx=automatic --define:process.env.NODE_ENV='"production"' --format=iife --loader:.js=jsx --outfile=server/public/app.js`

## Yangi imkoniyatlar (2-bosqich)
Top kitobxonlar (leaderboard) · qaytarishga qolgan vaqt taymeri · ijarani uzaytirish · kitob navbati (waitlist) · kechikish jarimasi · garov puli ·
kitob sharhlari va reyting · saralash/hudud/«faqat mavjud» filtrlari · haftaning mashhurlari · o'xshash kitoblar · kitob xohishlari (wishlist) ·
nishonlar · bildirishnomalar · kuzatish (follow) · ishonch darajasi · qorong'u rejim · egasi statistikasi · band kunlar kalendari · ulashish va QR kod · UZ/RU/EN tillari.
QR kod uchun `src/vendor/qr` (MIT litsenziya, Kazuhiko Arase) ishlatilgan.

## Yangi imkoniyatlar (3-bosqich)
Kitob almashish (barter) · o'qish maqsadi, seriya va «Mening yilim» · shaxsiy javon (O'qiyapman / O'qimoqchiman / O'qib bo'ldim) · narx maslahatchisi ·
topshirish nuqtalari (+ qidiruv) · bepul berish va xayriya bo'limi · XP do'koni (ramkalar, «Tavsiya etilgan», katalogda yuqorida).
Demo akkaunt kitoblari bilan almashib bo'lmaydi (ular javob bermaydi) — barter uchun ikkita haqiqiy akkaunt kerak.
