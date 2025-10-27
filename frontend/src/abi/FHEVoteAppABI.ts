export const FHEVoteAppABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        }
      ],
      "name": "PollCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "participant",
          "type": "address"
        }
      ],
      "name": "Voted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "subject",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "details",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "choices",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        }
      ],
      "name": "createPoll",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "newPollId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "didVote",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        }
      ],
      "name": "getOptionCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "choiceIndex",
          "type": "uint256"
        }
      ],
      "name": "getOptionEncryptedCount",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        }
      ],
      "name": "getPoll",
      "outputs": [
        {
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "subject",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "details",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "choices",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        }
      ],
      "name": "grantDecryptForAllOptions",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "pollRecords",
      "outputs": [
        {
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "subject",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "details",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "expiresAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "initialized",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalPolls",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "pollKey",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32[]",
          "name": "encryptedBits",
          "type": "bytes32[]"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
