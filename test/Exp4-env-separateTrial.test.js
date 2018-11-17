const {
  getNow
} = require("./helper/timer");
const {
  sleep,
  writeToFile
} = require("./helper/util");

const argv = require('minimist')(process.argv.slice(2), {
  string: ['prefix']
});

const Redistribution = artifacts.require("Redistribution");

let redistribution;
let lastReceiptBlock = []
let paymentHashs

let t1 = [];
let t2 = [];

function retrieveReceipts(lastReceiptBlock, merchant) {
  return new Promise(function (resolve, reject) {

    let paymentHashs = [];
    let latestBlock = web3.eth.blockNumber;
    let PaymentInitiatedEvent = redistribution.PaymentInitiated({
      merchant: merchant
    }, {
      fromBlock: lastReceiptBlock + 1,
      toBlock: latestBlock
    })
    PaymentInitiatedEvent.get((error, logs) => {
      if (error) reject(error);

      Promise.all(logs.map(function (log) {
        paymentHashs.push(log.args.paymentHash);
      })).then(() => resolve([paymentHashs, latestBlock]))
    })
  });
}

// --------------------------------------end of env vars-----------------------------
let max_trial = 10;
let C = 20; // num of customers: FIXED
let M = 1; // num of merchants
let token = 1; // num of tokens to pay
// let fact_M = 3628800; // calculate M! in advance 
let total_token = token * max_trial * C; // total tokens needed in this exp
let STEP = 2;
let START_NUM = 2;
let EXP_NUM = "Exp4";
let prefix = "20C";
// -----------------------------------end of configurable vars-----------------------------


contract('Redistribution', function (accounts) {
  // assert.equal(accounts.length, 110)
  const [owner, merchant1] = accounts;
  const customers = accounts.slice(2, 2 + C); // from index 2, len = number of customers  

  it("configure env", async function () {
    // deploy contract
    redistribution = await Redistribution.new();

    // owner sends tokens to customer1
    await Promise.all(customers.slice(0, C).map(function (customer) {
      return redistribution.transfer(customer, total_token);
    }))

    // register
    await redistribution.registerAsMerchant({
      from: merchant1
    })

    await Promise.all(customers.slice(0, C).map(function (customer) {
      return redistribution.registerAsCustomer({
        from: customer
      })
    }))
  })

  it("Exp4: test latency of settle ", async function () {
    // Catch file prefix
    // const prefix = argv['prefix'];

    // Do multiple trials
    for (var j = 1; j <= max_trial; j++) {
      let ans_array_per_trial = [];

      // Test different number of customers
      for (var c = START_NUM; c <= C; c += STEP) {

        await Promise.all(customers.slice(0, c).map(function (customer) {
          return redistribution.pay(merchant1, token, {
            from: customer
          })
        }));

        // start!
        t1[c] = Date.now()

        let res = await retrieveReceipts(lastReceiptBlock[merchant1], merchant1);
        [paymentHashs, lastReceiptBlock[merchant1]] = res
        await Promise.all(paymentHashs.map(function (paymentHash) {
          return redistribution.settle(paymentHash, {
            from: merchant1
          })
        }))

        t2[c] = Date.now()
        let latency = t2[c] - t1[c]
        // console.log(c, ":", latency);
        ans_array_per_trial.push(latency);

      }
      // Output to file (m:time)
      // writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
      writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
    }
  }).timeout(3000000000);

});