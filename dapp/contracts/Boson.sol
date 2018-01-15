pragma solidity ^0.4.18;

contract IBoson {
    address public cbAddress;
    function queryAddress(address _address) public payable returns (bytes32 _id);
}

contract IBosonAddressResolver {
    function getAddress() public returns (address _address);
}

contract IBosonCallbackReceiver {
    function __bosonCallback(bytes32 _id, bool _status) public;
}
