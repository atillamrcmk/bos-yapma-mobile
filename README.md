# BOŞ YAPMA

Kısa, bilinçli molalar için geliştirilen mobil uygulama. Bu depo, iki geliştiricinin birlikte çalışabileceği temiz bir React Native iskeleti sunar.

## Amaç

BOŞ YAPMA, kullanıcıya kısa süreli (ör. 3 dakika) odaklanmış bir mola deneyimi sunmayı hedefler. Bu aşamada yalnızca uygulama iskeleti ve geçici geliştirme ana ekranı bulunur; backend, kimlik doğrulama veya oyun implementasyonu yoktur.

## Teknoloji stack'i

- [React Native](https://reactnative.dev/) `0.81.x`
- [Expo](https://expo.dev/) SDK `54` (App Store / Play Store Expo Go ile uyumlu)
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)

## Kurulum

```bash
npm install
```

## Çalıştırma

```bash
# Geliştirme sunucusu
npm start

# Android emülatör veya cihaz
npm run android

# iOS simülatör (macOS gerekir) veya Expo Go
npm run ios
```

Expo Go ile test etmek için `npm start` sonrası QR kodu tarayın. SDK 54, App Store ve Play Store’daki Expo Go sürümüyle uyumludur.

## Kalite kontrolleri

```bash
npm run typecheck
npm run lint
npm run validate
```

## Proje yapısı

```
app/                 # Expo Router ekranları
src/
  components/        # Paylaşılan UI bileşenleri
  games/             # Oyun modülleri (henüz boş)
  session/           # Oturum akışı
  content/           # İçerik tanımları
  storage/           # Yerel depolama
  hooks/             # Özel React hook'ları
  utils/             # Yardımcı fonksiyonlar
  constants/         # Sabitler
  types/             # Paylaşılan TypeScript tipleri
assets/              # Görseller ve statik dosyalar
docs/                # Proje dokümantasyonu
```

## Mevcut MVP kapsamı

- Tek ana ekran (geçici geliştirme ekranı)
- Uygulama adı, kısa tagline ve **3 Dakika Başlat** butonu
- iOS ve Android üzerinde Expo ile çalışabilir yapı
- TypeScript strict mode, ESLint ve temel klasör mimarisi

### Kapsam dışı (şimdilik)

- Backend / API
- Login / register
- AI, abonelik, ödeme
- Firebase / Supabase
- Oyun implementasyonu

## Lisans

Bu proje için lisans bilgisi `LICENSE` dosyasına bakın.
