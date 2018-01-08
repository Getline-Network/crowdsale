pragma solidity ^0.4.18;

import 'contracts/Boson.sol';

contract TestBoson is IBoson {
    mapping(address => uint256) requestCounters;
    address owner;

    function TestBoson() public {
        cbAddress = this;
        owner = msg.sender;
    }

    event Query(address _contract, address _address, bytes32 _id);

    function queryAddress(address _address) public payable returns (bytes32 _id) {
        // Generate ID for request.
        _id = keccak256(this, msg.sender, requestCounters[msg.sender]);
        requestCounters[msg.sender]++;
        // Emit a query event.
        Query(msg.sender, _address, _id);
    }

    function proxyResponse(IBosonCallbackReceiver _receiver, bytes32 _id, bool _result) public {
        require(msg.sender == owner);
        _receiver.__bosonCallback(_id, _result);
    }
}

contract TestBosonAddressResolver is IBosonAddressResolver {
    IBoson boson;

    function TestBosonAddressResolver(IBoson _boson) public {
        boson = _boson;
    }

    function getAddress() public returns (address _address) {
        return boson;
    }
}
