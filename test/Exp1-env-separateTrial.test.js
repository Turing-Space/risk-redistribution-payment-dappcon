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
var lastReceiptBlock = 0
let paymentHashs

let t1 = [];
let t2 = [];

function retrieveReceipts(lastReceiptBlock, merchant) {
  return new Promise(function (resolve, reject) {

    let paymentHashs = [];
    let latestBlock = web3.eth.blockNumber;
    let PaymentInitiatedEvent = redistribution.PaymentInitiated({}, {
      fromBlock: lastReceiptBlock + 1,
      toBlock: latestBlock,
      address: merchant
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
let M = 10; // num of merchants
let token = 1; // num of tokens to pay
let fact_M = 3628800; // calculate M! in advance 
let total_token = token * max_trial * fact_M; // total tokens needed in this exp
let STEP = 1;
let START_NUM = 1;
let EXP_NUM = "Exp1";
let prefix = "10M";
// -----------------------------------end of configurable vars-----------------------------


contract('Redistribution', function (accounts) {
  // assert.equal(accounts.length, 50)
  const [owner, customer1] = accounts;
  const merchants = accounts.slice(2, 2 + M); // from index 2, len = number of merchants  
  // console.log(merchants.length)

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

  it("Exp1: test latency of pay ", async function () {
    // Catch file prefix
    // const prefix = argv['prefix'];

    // Do multiple trials
    for (var j = 1; j <= max_trial; j++) {
      let ans_array_per_trial = [];

      // Test different number of merchants
      for (var m = START_NUM; m <= M; m += STEP) {
        // start!
        t1[m] = Date.now()

        await Promise.all(merchants.slice(0, m).map(function (merchant) {
          return redistribution.pay(merchant, token, {
            from: customer1
          })
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