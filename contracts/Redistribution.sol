pragma solidity ^0.4.24;

/// @author Hu Yao-Chieh (yhuag) & Lee Ting-Ting (tina1998612)
/// @title Risk Redistribution Payment
/// @dev This contract has not been conpleted!!
/// @dev TODO:
///           "token" to be determined; USDT considered;
///           owner not yet integrated; rename events and mappings to distinguish

import "./openzeppelin-solidity/token/ERC20/ERC20.sol";

contract Redistribution is ERC20 {

  enum Role {None, Customer, Merchant, Owner}

  mapping (address => Role) public addressToRole;
  mapping (bytes32 => bool) public paymentSettled;
  mapping (bytes32 => bool) public paymentInitiated;
  mapping (bytes32 => address) public paymentHashToMerchant;

  uint256 public nonce;
  address public owner;

  event PaymentInitiated(
    address customer,
    address merchant,
    uint256 value,
    uint256 timeStamp,
    bytes32 paymentHash,
    uint256 nonce
  );

  event PaymentSettled(bytes32 paymentHash);

  modifier onlyCustomer {
    require(addressToRole[msg.sender] == Role.Customer);
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
    require(paymentInitiated[paymentHash] == true);
    _;
  }
  
  constructor() public {
      owner = msg.sender;
      // the token issuer has 1000 tokens initially
      _mint(owner, 1000);
  }

  function registerAsCustomer() public {
    require(addressToRole[msg.sender] != Role.Customer);
    require(addressToRole[msg.sender] != Role.Merchant);
    addressToRole[msg.sender] = Role.Customer;
  }


  function registerAsMerchant() public {
    require(addressToRole[msg.sender] != Role.Customer);
    require(addressToRole[msg.sender] != Role.Merchant);
    addressToRole[msg.sender] = Role.Merchant;
  }


  function pay
  (
    address _merchant,
    uint256 _value
  )
    onlyCustomer
    public
  {
    // the actual token goes to the owner
    transfer(owner, _value);

    // increase nonce
    nonce = nonce.add(1);

    // generate a hash as the unique identifier for this payment
    // @notice may NOT be unique. Can be somehow forgeable!!!
    bytes32 _paymentHash = keccak256(abi.encodePacked(msg.sender, _merchant, _value, now, nonce));

    // all the requirements
    require(paymentInitiated[_paymentHash] == false);
    require(paymentSettled[_paymentHash] == false);

    // set payment to issued
    paymentInitiated[_paymentHash] = true;

    // assign payment hash to merchant
    paymentHashToMerchant[_paymentHash] = _merchant;

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
    // the settler must be the assigned merchant
    require(paymentHashToMerchant[_paymentHash] == msg.sender);

    // set payment to settled
    paymentSettled[_paymentHash] = true;

    // settle the payment with the exact unique identifier
    emit PaymentSettled(_paymentHash);
  }

}
