// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEVoteApp 
/// @notic userDecrypt
contract FHEVoteApp is SepoliaConfig {
    struct Poll {
        address initiator;
        string subject;
        string details;
        string[] choices;
        uint256 expiresAt;
        bool initialized;
    }

    event PollCreated(uint256 indexed pollKey, address indexed initiator, uint256 expiresAt);
    event Voted(uint256 indexed pollKey, address indexed participant);
    event PollDeleted(uint256 indexed pollKey, address indexed initiator);

    uint256 public totalPolls;
    mapping(uint256 => Poll) public pollRecords;

    // pollId => optionIndex => euint32
    mapping(uint256 => mapping(uint256 => euint32)) private _encryptedCounts;

    mapping(uint256 => mapping(address => bool)) public didVote;

    function createPoll(
        string calldata subject,
        string calldata details,
        string[] calldata choices,
        uint256 expiresAt
    ) external returns (uint256 newPollId) {
        require(choices.length >= 2 && choices.length <= 16, "INVALID_OPTIONS");
        require(expiresAt > block.timestamp, "INVALID_DEADLINE");

        newPollId = ++totalPolls;
        Poll storage rec = pollRecords[newPollId];
        rec.initiator = msg.sender;
        rec.subject = subject;
        rec.details = details;
        for (uint256 idx = 0; idx < choices.length; idx++) {
            rec.choices.push(choices[idx]);
        }
        rec.expiresAt = expiresAt;
        rec.initialized = true;

        emit PollCreated(newPollId, msg.sender, expiresAt);
    }

    function getPoll(uint256 pollKey)
        external
        view
        returns (
            address initiator,
            string memory subject,
            string memory details,
            string[] memory choices,
            uint256 expiresAt
        )
    {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        Poll storage rec = pollRecords[pollKey];
        return (rec.initiator, rec.subject, rec.details, rec.choices, rec.expiresAt);
    }

    function getOptionCount(uint256 pollKey) external view returns (uint256) {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        return pollRecords[pollKey].choices.length;
    }

    function getOptionEncryptedCount(uint256 pollKey, uint256 choiceIndex)
        external
        view
        returns (euint32)
    {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        require(choiceIndex < pollRecords[pollKey].choices.length, "BAD_OPTION");
        return _encryptedCounts[pollKey][choiceIndex];
    }

    function vote(
        uint256 pollKey,
        externalEuint32[] calldata encryptedBits,
        bytes calldata inputProof
    ) external {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        require(block.timestamp < pollRecords[pollKey].expiresAt, "POLL_ENDED");
        require(!didVote[pollKey][msg.sender], "ALREADY_VOTED");

        uint256 numChoices = pollRecords[pollKey].choices.length;
        require(encryptedBits.length == numChoices, "BAD_LENGTH");

        for (uint256 idx = 0; idx < numChoices; idx++) {
            euint32 encBit = FHE.fromExternal(encryptedBits[idx], inputProof);
            _encryptedCounts[pollKey][idx] = FHE.add(_encryptedCounts[pollKey][idx], encBit);

            FHE.allowThis(_encryptedCounts[pollKey][idx]);
        }

        didVote[pollKey][msg.sender] = true;
        emit Voted(pollKey, msg.sender);
    }

    function grantDecryptForAllOptions(uint256 pollKey) external {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        require(block.timestamp >= pollRecords[pollKey].expiresAt, "NOT_ENDED");

        uint256 n = pollRecords[pollKey].choices.length;
        for (uint256 idx = 0; idx < n; idx++) {
            FHE.allow(_encryptedCounts[pollKey][idx], msg.sender);
        }
    }

    function deletePoll(uint256 pollKey) external {
        require(pollRecords[pollKey].initialized, "POLL_NOT_FOUND");
        require(msg.sender == pollRecords[pollKey].initiator, "NOT_OWNER");
        delete pollRecords[pollKey];
        emit PollDeleted(pollKey, msg.sender);
    }
}


