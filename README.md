# Koleksiyon Föy Oluşturucu

Bu uygulama, moda ürünleri için koleksiyon föyü oluşturmaya ve PDF olarak dışa aktarmaya yarayan basit bir araçtır.

## Özellikler

- CSV dosyasından ürün bilgilerini içe aktarma
- Her ürün için birden fazla resim ekleme
- Koleksiyon föyünü görüntüleme ve PDF olarak dışa aktarma
- Projeleri kaydetme ve daha sonra düzenleme

## Başlangıç

Uygulamayı başlatmak için:

```bash
npm install
npm run dev
```

## Kullanım

1. Ana sayfada "Yeni Proje Oluştur" bölümünden bir proje adı girin
2. "CSV Yükle" butonuna tıklayarak ürün verilerinizi içe aktarın
   - CSV formatı: ürün kodu, ürün adı, içerik, beden, satış fiyatı, kdv
3. Her ürün kartında "Resim eklemek için tıklayın" alanına tıklayarak ürün görselleri ekleyin
4. "Koleksiyon Föyü Önizle" butonuna tıklayarak oluşturduğunuz koleksiyon föyünü görüntüleyin
5. Önizleme sayfasında "PDF İndir" veya "Yazdır" seçeneklerini kullanarak föyü dışa aktarın

## Dağıtım

Uygulamayı dağıtmak için:

```bash
npm run build
```

Oluşturulan `dist` klasörünü herhangi bir statik web sunucusuna (Netlify, Vercel, GitHub Pages vb.) yükleyebilirsiniz.

## Not

Tüm veriler tarayıcınızın yerel depolama alanında saklanır. Tarayıcı verilerinizi temizlerseniz projeleriniz kaybolabilir.
