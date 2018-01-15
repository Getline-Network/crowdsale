pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'contracts/Boson.sol';

contract GetToken is BurnableToken, StandardToken {
    string public name = "GetLine Token";
    string public symbol = "GET";
    uint8 public decimals = 3;

    /**
     * GetToken contructor. Creates the GET token with a fixed supply all
     * belonging to an owner.
     * @param _treasury - The owner of all the initial supply of the token.
     * @param _totalSupply - The initial supply of the token.
     */
    function GetToken(address _treasury, uint256 _totalSupply) public {
        totalSupply = _totalSupply;
        balances[_treasury] = _totalSupply;
    }
}

contract BosonApproved is IBosonCallbackReceiver {
    IBosonAddressResolver public bosonResolver;

    event ValidationRequest(address _contract, address _who);
    event ValidationResult(address _contract, address _who, bool _result);
    struct Validations {
        uint256 approvals;
        uint256 rejections;
    }
    mapping(bytes32 => address) validationRequests;
    mapping(address => Validations) validationResults;

    function approved(address _address) public view returns (bool _approved) {
        _approved = validationResults[_address].approvals > 0;
    }

    function rejected(address _address) public view returns (bool _rejected) {
        _rejected = validationResults[_address].rejections > 0;
    }

    function approve(address _address) public {
        if (approved(_address)) {
            return;
        }

        ValidationRequest(this, _address);
        bytes32 id = boson().queryAddress(_address);
        validationRequests[id] = _address;
    }

    function __bosonCallback(bytes32 _id, bool _status) public {
        require(msg.sender == boson().cbAddress());
        address requested = validationRequests[_id];
        delete validationRequests[_id];
        ValidationResult(this, requested, _status);
        if (_status) {
            validationResults[requested].approvals++;
            validationResults[requested].rejections = 0;
        } else {
            validationResults[requested].rejections++;
        }
    }

    function boson() private returns (IBoson _boson) {
        _boson = IBoson(bosonResolver.getAddress());
    }

}

contract Crowdsale is Ownable, BosonApproved {
    uint256 public GOAL_WEI = 10000 ether;
    uint256 public DURATION = 14 days;
    uint256 public MINIMUM_PURCHASE_WEI = 1 ether / 100;

    using SafeMath for uint256;

    enum State {
        Initialized,
        Started,
        Finished
    }

    State public state;
    GetToken public token;

    uint256 public tokensLeft;
    uint256 public tokensGoal;
    uint256 public startDate;
    uint256 public endDate;

    event StateTransition(uint256 _oldState, uint256 _newState);
    event StateTimeout(uint256 _oldState);

    function nextState(State _newState) private {
        StateTransition(uint256(state), uint256(_newState));
        state = _newState;
    }

    function processTimeouts() private {
        if (state == State.Started) {
            if (block.timestamp > endDate) {
                StateTimeout(uint256(state));
                nextState(State.Finished);
            }
        }
    }

    function Crowdsale(GetToken _token, IBosonAddressResolver _bar) public {
        token = _token;
        bosonResolver = _bar;
        owner = msg.sender;
        state = State.Initialized;
    }

    function start() onlyOwner public {
        require(state == State.Initialized);

        state = State.Started;
        startDate = block.timestamp;
        endDate = startDate + DURATION;
        tokensGoal = token.balanceOf(this);
        tokensLeft = tokensGoal;

        require(tokensGoal > 0);
        require(price() > 0);
    }

    function price() public view returns (uint256 _price) {
        require(state >= State.Started);
        return GOAL_WEI / tokensGoal;
    }

    function buy(address buyer) public payable {
        processTimeouts();
        require(state == State.Started);
        require(buyer != 0x0);
        require(approved(buyer));

        // Convert purchase to requested tokens.
        uint256 tokens = msg.value.div(price());

        // Make sure to not sell more than we have.
        if (tokensLeft < tokens) {
            tokens = tokensLeft;
        }

        // Note down the purchase.
        tokensLeft.sub(tokens);

        // Check if crowdsale is done.
        if (tokensLeft == 0) {
            nextState(State.Finished);
        }

        // See if we need to send a refund. This comes when we sell less tokens
        // than their value in Ether, which can happen when:
        //  - we can't sell as many tokens as the buyer requested, because we
        //    ran out of them
        //  - the buyer send ether that cannot buy an entire token (ie. we
        //    we refund the modulo of the price division)
        uint256 refund = msg.value.sub(tokens.mul(price()));

        // Send tokens to buyer.
        require(token.transfer(buyer, tokens));
        // Send refund to buyer, if necessary.
        if (refund > 0) {
            msg.sender.transfer(refund);
        }
    }
}

contract Treasurer is Ownable {
    enum State {
        Initialized,
        Started
    }

    address public team;
    State public state;

    GetToken token_;
    Crowdsale crowdsale_;


    uint256 public initialSupply   = 1000000 * 1000; // 1 million GET tokens.
    uint256 public teamReserve     =  500000 * 1000; // 0.5 million GET tokens.
    uint256 public crowdsaleAmount =  500000 * 1000; // 0.5 million GET tokens.

    function Treasurer(address _team) public {
        team = _team;
        owner = msg.sender;
        state = State.Initialized;
    }

    function start(IBosonAddressResolver _bosonResolver) onlyOwner public {
        require(state == State.Initialized);
        state = State.Started;

        GetToken token = new GetToken(this, initialSupply);
        Crowdsale crowdsale = new Crowdsale(token, _bosonResolver);
        require(token.transfer(team, teamReserve));
        require(token.transfer(crowdsale, crowdsaleAmount));
        crowdsale.start();

        token_ = token;
        crowdsale_ = crowdsale;
    }

    function token() public view returns (address _token) {
        require(state == State.Started);
        _token = token_;
    }

    function crowdsale() public view returns (address _crowdsale) {
        require(state == State.Started);
        _crowdsale = crowdsale_;
    }
}
