// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;
pragma abicoder v2;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @dev Represents a box
struct Box {
    BoxStatus status;
    Token[] tokens;
    Token result;
}

/// @dev Represents the states a box can be in
enum BoxStatus {
    Unlocked,
    Locked,
    Opening,
    Open
}

/// @dev Represents an ERC721 token
struct Token {
    address tokenContract;
    uint256 tokenId;
}

contract RandomBox is VRFConsumerBase, ERC721, ReentrancyGuard {

    using Counters for Counters.Counter;

    /// @notice The fee in LINK to execute an opening request
    uint256 public linkFee;

    /// @dev The key hash for Chainlink VRF
    bytes32 private keyHash;

    /// @dev Used to keep track of the next box id to create
    Counters.Counter private _boxIds;

    /// @notice The contents of each Box
    mapping(uint256 => Box) public boxes;

    /// @dev Keeps track of which Chainlink request 
    mapping(bytes32 => uint256) internal requests;

    /**
     * @notice Emitted when a new box is created
     * @param boxId The id of the new box
     */
    event Create(uint256 boxId);

    /**
     * @notice Emitted when a token is deposited into a box
     * @param boxId The id of the new box
     * @param tokenContract The address of the token being deposited
     * @param tokenId The id of the token being deposited
     */
    event Deposit(uint256 boxId, address tokenContract, uint256 tokenId);

    /**
     * @notice Emitted when a box is locked
     * @param boxId The id of the box
     */
    event Lock(uint256 boxId);

    /**
     * @notice Emitted when a box is requested to be opened
     * @param boxId The id of the box
     */
    event Open(uint256 boxId);

    /**
     * @notice Emitted when a box is opened
     * @param receiver The address of the account that received the token
     * @param boxId The id of the box
     * @param tokenContract The address of the token being received
     * @param tokenId The id of the token being received
     */
    event Opened(
        address receiver,
        uint256 boxId,
        address tokenContract,
        uint256 tokenId
    );

    /**
     * @dev Only the holder of the given box can execute this function
     * @param _vrfCoordinator The address of the Chainlink VRF coordinator
     * @param _linkToken The address of the Chainlink LINK token
     * @param _linkFee The fee in LINK to execute a Chainlink VRF request
     * @param _keyHash The key hash for Chainlink VRF
     */
    constructor(
        address _vrfCoordinator,
        address _linkToken,
        uint256 _linkFee,
        bytes32 _keyHash
    )
        VRFConsumerBase(_vrfCoordinator, _linkToken)
        ERC721("RandomBox", "RB")
    {
        linkFee = _linkFee;
        keyHash = _keyHash;
    }

    /**
     * @dev Only the holder of the given box can execute this function
     * @param _boxId The id of the box to check
     */
    modifier onlyHolder(uint256 _boxId) {
        require(ownerOf(_boxId) == msg.sender, "not box holder");
        _;
    }

    /**
     * @notice Create a new random box and give it to the caller
     */
    function create() public nonReentrant returns (uint256) {
        _boxIds.increment();
        uint256 tokenId = _boxIds.current();
        _mint(msg.sender, tokenId);

        emit Create(tokenId);

        return tokenId;
    }

    /**
     * @notice Deposit an ERC721 token into an owned unlocked random box
     * @param _boxId The id of the box to deposit in
     * @param _tokenContract The contract of the token to deposit
     * @param _tokenId The id of the token to deposit
     */
    function deposit(
        uint256 _boxId,
        address _tokenContract,
        uint256 _tokenId
    ) public nonReentrant onlyHolder(_boxId) {
        require(boxes[_boxId].status == BoxStatus.Unlocked, "box not unlocked");
        require(
            IERC165(_tokenContract).supportsInterface(
                type(IERC721).interfaceId
            ),
            "token does not support ERC721"
        );
        address owner = IERC721(_tokenContract).ownerOf(_tokenId);
        require(
            msg.sender == IERC721(_tokenContract).getApproved(_tokenId)
            || msg.sender == owner, 
            "caller not approved or owner"
        );
        IERC721(_tokenContract).transferFrom(owner, address(this), _tokenId);
        boxes[_boxId].tokens.push(Token(_tokenContract, _tokenId));

        emit Deposit(_boxId, _tokenContract, _tokenId);
    }

    /**
     * @notice Lock an owned unlocked random box; no new tokens can be added
     * @param _boxId The id of the box to lock
     */
    function lock(uint256 _boxId) public nonReentrant onlyHolder(_boxId) {
        require(boxes[_boxId].status == BoxStatus.Unlocked, "box not unlocked");
        boxes[_boxId].status = BoxStatus.Locked;

        emit Lock(_boxId);
    }

    /**
     * @notice Request to open an owned locked random box; one random token will
     * be transferred to the box owner. 
     * @param _boxId The id of the box to open
     */
    function open(uint256 _boxId) public nonReentrant onlyHolder(_boxId) {
        require(boxes[_boxId].status == BoxStatus.Locked, "box not locked");
        require(
            LINK.balanceOf(address(this)) >= linkFee,
            "Insufficient LINK in contract"
        );
        require(boxes[_boxId].tokens.length > 0, "no tokens in box");
        bytes32 requestId = requestRandomness(keyHash, linkFee);
        requests[requestId] = _boxId;
        boxes[_boxId].status = BoxStatus.Opening;

        emit Open(_boxId);
    }

    /**
     * @dev Fulfill box open request; give one random token
     * @param requestId The Chainlink request id
     * @param randomness A random number
     */
    function fulfillRandomness(
        bytes32 requestId,
        uint256 randomness
    ) internal nonReentrant override {
        uint256 boxId = requests[requestId];
        require(boxes[boxId].status == BoxStatus.Opening, "box not opening");
        uint256 index = randomness % boxes[boxId].tokens.length;
        address owner = ownerOf(boxId);
        address tokenContract = boxes[boxId].tokens[index].tokenContract;
        uint256 tokenId = boxes[boxId].tokens[index].tokenId;
        IERC721(tokenContract).transferFrom(address(this), owner, tokenId);
        boxes[boxId].status = BoxStatus.Open;
        boxes[boxId].result.tokenContract = tokenContract;
        boxes[boxId].result.tokenId = tokenId;
        emit Opened(owner, boxId, tokenContract, tokenId);
    }

    /**
     * @notice Get the status of a random box
     * @param _boxId The id of the box
     */
    function getStatus(uint256 _boxId) public view returns (BoxStatus) {
        return boxes[_boxId].status;
    }

    /**
     * @notice Get the tokens in a random box
     * @param _boxId The id of the box
     */
    function getTokens(uint256 _boxId) public view returns (Token[] memory) {
        return boxes[_boxId].tokens;
    }

    /**
     * @notice Get the result of a random box
     * @param _boxId The id of the box
     */
    function getResult(uint256 _boxId) public view returns (Token memory) {
        return boxes[_boxId].result;
    }
}
