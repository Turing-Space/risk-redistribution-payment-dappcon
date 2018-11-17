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
let C = 1; // num of customers: FIXED
let M = 20; // num of merchants
let token = 1; // num of tokens to pay
let fact_M = 3628800; // calculate M! in advance 
let total_token = token * max_trial * fact_M; // total tokens needed in this exp
let STEP = 2;
let START_NUM = 2;
let EXP_NUM = "Exp3";
let prefix = "20M";
// -----------------------------------end of configurable vars-----------------------------


contract('Redistribution', function (accounts) {
  // assert.equal(accounts.length, 110)
  const [owner, customer1] = accounts;
  const merchants = accounts.slice(2, 2 + M); // from index 2, len = number of merchants  

  it("configure env", async function () {
    // deploy contract
    redistribution = await Redistribution.new();

    // owner sends tokens to customer1
    await redistribution.transfer(customer1, total_token);

    // register
    await redistribution.registerAsCustomer({
      from: customer1
    })

    await Promise.all(merchants.slice(0, M).map(function (merchant) {
      return redistribution.registerAsMerchant({
        from: merchant
      })
    }))
  })

  it("Exp3: test latency of settle ", async function () {
    // Catch file prefix
    // const prefix = argv['prefix'];

    // Do multiple trials
    for (var j = 1; j <= max_trial; j++) {
      let ans_array_per_trial = [];

      // Test different number of merchants
      for (var m = START_NUM; m <= M; m += STEP) {

        await Promise.all(merchants.slice(0, m).map(async function (merchant) {
          return redistribution.pay(merchant, token, {
            from: customer1
          })
        }));

        // start!
        t1[m] = Date.now()

        await Promise.all(merchants.slice(0, m).map(async function (merchant) {
          let res = await retrieveReceipts(lastReceiptBlock[merchant], merchant);
          [paymentHashs, lastReceiptBlock[merchant]] = res
          await Promise.all(paymentHashs.map(function (paymentHash) {
            return redistribution.settle(paymentHash, {
              from: merchant
            })
          }))
        }));

        t2[m] = Date.now()
        let latency = t2[m] - t1[m]
        console.log(m, ":", latency);
        ans_array_per_trial.push(latency);

      }
      // Output to file (m:time)
      // writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
      writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
    }
  }).timeout(3000000000);

});