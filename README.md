# Experiments

```
ssh -v -i /path/to/CPE.pem ubuntu@54.211.179.4
git clone https://github.com/yhuag/risk-redistribution-payment.git
cd risk-redistribution-payment
npm install
nohup npm test &
disown <PID>
exit
```

### Exp1: meaure pay function latency as merchants increases

- Merchant: 10, 20, 30, ... , 100
- Customer: 1
- Trials: 10

### Exp2: meaure pay function latency as customer increases

- Merchant: 1
- Customer: 10, 20, 30, ... , 100
- Trials: 10

### Exp3: meaure settle function latency as merchants increases

- Merchant: 2, 4, 6, ... , 20
- Customer: 1
- Trials: 10

### Exp4: meaure settle function latency as customers increases

- Merchant: 1
- Customer: 2, 4, 6, ... , 20
- Trials: 10
