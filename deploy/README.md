# bileton.kz серверге орналастыру

**Күйі: дайын, тірі.** https://bileton.kz жұмыс істеп тұр, SSL бар.

## Сервер

- Провайдер: PS.kz VPS, тариф Basic-2 (2 CPU / 2 ГБ RAM / 40 ГБ диск).
- IP: `82.115.43.253`
- ОЖ: Ubuntu 24.04 LTS
- Пайдаланушы: `ubuntu` (root емес, sudo арқылы, парольсіз sudo қосылған)
- Кіру: осы компьютердегі SSH кілт (`~/.ssh/id_ed25519`) серверге қосылған,
  құпия сөз қажет емес: `ssh ubuntu@82.115.43.253`
- Аймақ: Алматы (kz-ala-1)

## Орнатылған нәрселер

- nginx (сайтты қызмет етеді, `/etc/nginx/sites-available/bileton.kz`)
- certbot + Let's Encrypt SSL (bileton.kz және www.bileton.kz үшін,
  автоматты жаңарту қосылған, сертификат 2026-12-22 дейін жарамды)
- ufw firewall (SSH, HTTP, HTTPS қана ашық)
- 2 ГБ swap файл (`/swapfile`, RAM аз болғандықтан қосымша қор ретінде)
- Сайт файлдары: `/var/www/bileton/` (`index.html` + `assets/img/`)

## Жаңарту (сайтқа өзгеріс енгізген сайын)

Windows-та rsync жоқ болғандықтан, Python арқылы жазылған скрипт қолданылады:

```bash
python deploy/deploy.py
```

Бұл `index.html` мен `assets/img/` қалтасын серверге қайта жүктеп, nginx-ті
қайта жүктейді (reload). `paramiko` кітапханасы керек: `pip install paramiko`
(бір рет орнатылған).

Linux/Mac-та rsync бар болса, `deploy.sh` да қолдануға болады:
```bash
DEPLOY_HOST=82.115.43.253 DEPLOY_USER=ubuntu DEPLOY_PATH=/var/www/bileton bash deploy/deploy.sh
```

## Домен

bileton.kz мен www.bileton.kz A-жазбалары PS.kz домен басқару панелінде
82.115.43.253-ке бағытталған. DNS дұрыс тұр, тексеру:
```bash
nslookup bileton.kz 8.8.8.8
```

## Қалғандары (кейінгі кезең)

- `joldas-backend`, `carrier-portal`, `station-portal` кодтары әлі осы
  серверге қойылған жоқ, себебі олардың коды маған әлі берілмеген. Код
  келген соң (жергілікті қалта немесе git репозиторийі) осы серверге, я
  болмаса бөлек субдомендерге (api., carrier., station.) орналастырамыз.
- `tauekel-app`, `driver-app` — мобильді қосымшалар, серверге "орналаспайды",
  тек өз backend-мен (`joldas-backend`, орналастырылған соң) сөйлеседі.
- Ядро жаңартулары (`linux-generic` және т.б.) серверде қалып қойды, толық
  қолдану үшін қайта жүктеу (reboot) керек. Асығыс емес, ыңғайлы уақытта
  жасауға болады: `ssh ubuntu@82.115.43.253 sudo reboot`
- Иесі: bileton.kz логотипін көрсету үшін `info@bileton.kz` certbot
  тіркеу email ретінде қолданылды (жарамдылық мерзімі бітерге жақын
  ескерту хаттар сол мекенжайға келеді).
