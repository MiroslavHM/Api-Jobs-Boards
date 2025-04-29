Проект: VIRTUAL JOB FAIR SYSTEM
Име: Мирослав Маринов
Факултетен номер: 381222076

Описание
Това е Node.js/Express приложение за управление на обяви за работа, автобиографии (CV), интервюта и потребители (работодатели и кандидати).

Технологии
-Node.js
-Express.js
-MongoDB + Mongoose
-JWT (JSON Web Tokens) за автентикация
-bcryptjs за криптиране на пароли
-dtenv за работа с променливи на средата
-helmet + cors за сигурност
-multer за качване на файлове (автобиографии)

Инсталиране

Клонирай репозитория:
```git clone <линк към репото>```
```cd <името на проекта>```

Инсталирай зависимостите:
```npm install```
Създай .env файл в основната директория като ползваш шаблона .env.example.
Стартирай сървъра:
```npm run dev```
(или ако нямаш nodemon: ```npm start```)

Структура на проект
/routes — Пътища за потребители, обяви, автобиографии, интервюта и статистики
/models — Mongoose модели
/middleware — Междинен слой за защита (auth middleware)

Примерно съдържание на .env.example
```PORT=5000```
```MONGODB_URI=your_mongodb_connection_string```
```JWT_SECRET=your_jwt_secret```



# Api-Jobs-Boards
