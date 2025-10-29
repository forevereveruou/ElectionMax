# ElectionMax

## 🗳️ Privacy-Preserving Voting with Zama FHEVM

ElectionMax — это платформа для конфиденциального голосования, построенная на Zama FHEVM (Fully Homomorphic Encryption Virtual Machine). Голоса остаются зашифрованными на всех этапах: от отправки до подсчета, обеспечивая проверяемость результатов без раскрытия индивидуальных предпочтений.

### ✨ Ключевые возможности

- 🔐 FHE-конфиденциальность: шифрование Zama FHE сохраняет секретность голосов даже во время вычислений
- 🧾 Проверяемость: результаты могут быть верифицированы без раскрытия сырых данных
- 🧭 Целостность: неизменяемый лог на блокчейне (Ethereum/Sepolia)
- 👤 Анонимность: отсутствие связи между адресом и выбором голосующего
- ⚙️ Гибкость: поддержка опросов, голосований с несколькими вариантами и весами

### 🛠️ Технологии

- FHE: Zama FHEVM (Fully Homomorphic Encryption)
- Blockchain: Ethereum/Sepolia
- Smart Contracts: Solidity с FHE-операциями
- Frontend: React, TypeScript
- Tooling: Hardhat/Foundry (в зависимости от конфигурации проекта)

### 🚀 Быстрый старт

1) Установка
```bash
git clone https://github.com/forevereveruou/ElectionMax
cd ElectionMax
npm install
```

2) Конфигурация окружения
```bash
cp .env.example .env.local
# заполните RPC_URL, PRIVATE_KEY, (опционально) CONTRACT_ADDRESS
```

3) Скрипты
```bash
npm run build
npm run dev
```

### 🧩 Архитектура

- Frontend: формирует и отправляет зашифрованные бюллетени
- Contracts: принимает зашифрованные голоса и агрегирует их
- FHE Runtime: выполняет гомоморфные операции над шифртекстами
- Verifier: публикует проверяемые агрегированные результаты

### 🔐 Безопасность и приватность

- Голоса никогда не расшифровываются смарт-контрактами
- Агрегация выполняется над шифртекстами (FHE)
- Публичная проверяемость итогов без утечки индивидуальных голосов
- Минимизация метаданных и корреляций

### 📚 Полезные ссылки

- Репозиторий: https://github.com/forevereveruou/ElectionMax
- Issues: https://github.com/forevereveruou/ElectionMax/issues
- Wiki: https://github.com/forevereveruou/ElectionMax/wiki

---

Built with Zama FHEVM for confidential, verifiable on-chain voting.
