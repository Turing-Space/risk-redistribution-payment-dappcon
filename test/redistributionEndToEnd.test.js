const Redistribution = artifacts.require("Redistribution");
const expectEvent = require("./helper/expectEvent");
const shouldFail = require("./helper/shouldFail");


let redistribution;
var lastReceiptBlock = 0
let paymentHashs

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


contract('Redistribution', function (accounts) {
  const [owner, merchant1, merchant2, customer1, customer2, customer3] = accounts;

  before(async function () {
    redistribution = await Redistribution.new();
    assert.equal(await redistribution.balanceOf(owner), 1000);
  })

  it("should register merchant", async function () {
    await redistribution.registerAsMerchant({
      from: merchant1
    })
    await redistribution.registerAsMerchant({
      from: merchant2
    })
  })

  it("should register customer", async function () {
    await redistribution.registerAsCustomer({
      from: customer1
    })
    await redistribution.registerAsCustomer({
      from: customer2
    })
    await redistribution.registerAsCustomer({
      from: customer3
    })
  })

  it("owner should send 20 tokens to customer", async function () {
    await redistribution.transfer(customer1, 20);
    assert.equal(await redistribution.balanceOf(customer1), 20);
  })

  // exp1: test latency of pay 
  it("customer should pay 10 token to merchant ", async function () {
    await redistribution.pay(merchant1, 10, {
      from: customer1
    })
    assert.equal(await redistribution.balanceOf(customer1), 10);
  });

  // exp2: test latency of settle 
  it("merchant should settle 10 token from previous payment event ", async function () {
    let res = await retrieveReceipts(lastReceiptBlock, merchant1);
    [paymentHashs, lastReceiptBlock] = res
    // console.log(paymentHashs, lastReceiptBlock)

    await Promise.all(paymentHashs.map(async function (paymentHash) {
      await redistribution.settle(paymentHash, {
        from: merchant1
      })
    }))
  });

  // exp1: test latency of pay 
  it("customer should pay 5 token to merchant ", async function () {
    assert.equal(await redistribution.balanceOf(customer1), 10);
    await redistribution.pay(merchant1, 5, {
      from: customer1
    })
  });

  // exp1: test latency of pay 
  it("customer should pay 5 token to merchant ", async function () {
    await expectEvent.inTransaction(
      redistribution.pay(merchant1, 5, {
        from: customer1
      }),
      "PaymentInitiated"
    );
  });

  // exp2: test latency of settle 
  it("merchant should settle 2 more transactions from previous payment event ", async function () {
    let res = await retrieveReceipts(lastReceiptBlock, merchant1);
    [paymentHashs, lastReceiptBlock] = res
    // console.log(paymentHashs, lastReceiptBlock)
    await Promise.all(paymentHashs.map(async function (paymentHash) {
      await redistribution.settle(paymentHash, {
        from: merchant1
      })
    }))
  });

  it("should revert when paymentHash has already been settled", async function () {
    let res = await retrieveReceipts(lastReceiptBlock - 1, merchant1);
    [paymentHashs, lastReceiptBlock] = res
    // console.log(paymentHashs, lastReceiptBlock)
    await shouldFail.reverting(redistribution.settle(paymentHashs[0], {
      from: merchant1
    }))
  });

});