pragma solidity ^0.4.24;

/// @author Hu Yao-Chieh (yhuag) & Lee Ting-Ting (tina1998612)
/// @title Risk Redistribution Payment
/// @dev This contract has not been conpleted!!
/// @dev TODO:
///           Client --> Customer; Issue --> Initiate;
///           "token" to be determined; USDT considered;
///           owner not yet integrated; rename events and mappings to distinguish
contract Redistribution {

  enum Role {Client, Merchant, Owner}

  mapping (address => Role) public addressToRole;
  mapping (bytes32 => bool) public paymentSettled;
  mapping (bytes32 => bool) public paymentInitiated;

  uint256 nonce;

  event PaymentInitiated(
    address client,
    address merchant,
    uint256 value,
    uint256 timeStamp,
    bytes32 paymentHash,
    uint256 nonce
  );

  event PaymentSettled(bytes32 paymentHash);

  modifier onlyClient {
    require(addressToRole[msg.sender] == Role.Client);
    _;
  }

  modifier onlyMerchant {
    require(addressToRole[msg.sender] == Role.Merchant);
    _;
  }

  modifier paymentHasNotBeenSettled(bytes32 paymentHash) {
    require(paymentSettled[paymentHash] == false);
    _;
  }

  modifier paymentHasBeenInitiated(bytes32 paymentHash) {
    require(PaymentInitiated[paymentHash] == true);
    _;
  }


  function pay
  (
    address _merchant,
    uint256 _value
  )
    onlyClient
    public
  {
    // the actual token goes to the owner
    token.transfer(owner, _value);

    // increase nonce
    nonce = nonce.add(1);

    // generate a hash as the unique identifier for this payment
    // @notice may NOT be unique. Can be somehow forgeable!!!
    bytes32 _paymentHash = keccak256(abi.encoded(msg.sender, _merchant, _value, now, nonce));

    // all the requirements
    require(paymentInitiated[_paymentHash] == false);
    require(paymentSettled[_paymentHash] == false);

    // set payment to issued
    paymentInitiated[_paymentHash] = true;

    // record the payment as settlable receipt for the merchant
    emit PaymentInitiated(msg.sender, _merchant, _value, now, _paymentHash, nonce);
  }




  function settle
  (
    bytes32 _paymentHash
  )
    onlyMerchant
    paymentHasNotBeenSettled(_paymentHash)
    paymentHasBeenInitiated(_paymentHash)
    public
  {
    // set payment to settled
    paymentSettled[_paymentHash] = true;

    // settle the payment with the exact unique identifier
    emit PaymentSettled(_paymentHash);
  }

}
